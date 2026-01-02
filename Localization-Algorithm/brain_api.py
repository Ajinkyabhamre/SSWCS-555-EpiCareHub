# Load environment variables FIRST, before any other imports
import os
import platform
from dotenv import load_dotenv

# Load .env file from current directory
load_dotenv()

# Then import FastAPI and other modules
from fastapi import FastAPI, File, UploadFile, Form, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import uuid
import json
import platform
import logging

# Load environment variables
PORT = int(os.environ.get("PORT", 8000))
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
BACKEND_ORIGIN = os.environ.get("BACKEND_ORIGIN", "http://localhost:3000")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format='[%(levelname)s] %(asctime)s - %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("brain_api")

# Define canonical uploads directory
# Priority: UPLOADS_DIR env var > config.json (OS-specific) > default "/app/uploads"
UPLOADS_DIR = os.environ.get("UPLOADS_DIR")
if not UPLOADS_DIR:
    # Fallback to config.json if available
    try:
        with open('config.json', 'r') as file:
            config = json.load(file)
        os_name = platform.system()
        if os_name == 'Darwin':
            UPLOADS_DIR = config.get('mac_path', '/app/uploads')
            logger.info(f"MacOS detected, using config path: {UPLOADS_DIR}")
        elif os_name == 'Windows':
            UPLOADS_DIR = config.get('windows_path', '/app/uploads')
            logger.info(f"Windows detected, using config path: {UPLOADS_DIR}")
        else:
            UPLOADS_DIR = '/app/uploads'
            logger.info(f"Running on {platform.system()} {platform.machine()}, using default: {UPLOADS_DIR}")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        UPLOADS_DIR = '/app/uploads'
        logger.warning(f"Could not load config.json ({e}), using default: {UPLOADS_DIR}")

# Ensure uploads directory exists at startup
os.makedirs(UPLOADS_DIR, exist_ok=True)
logger.info(f"Uploads directory ready: {UPLOADS_DIR}")

# Initialize FastAPI app
app = FastAPI(
    title="EpiCareHub Localization Algorithm",
    description="Brain visualization and EEG analysis service",
    version="1.0.0"
)

# Configure CORS middleware
origins = [
    "http://localhost",
    FRONTEND_ORIGIN,
    BACKEND_ORIGIN,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("FastAPI service initialized")
logger.info(f"Allowed origins: {origins}")


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the service is running.
    Used by the backend to confirm connectivity.
    """
    return {
        "status": "ok",
        "service": "Localization-Algorithm",
        "version": "1.0.0",
        "port": PORT
    }


# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch all unhandled exceptions.
    Logs full traceback without exposing sensitive information.
    """
    logger.exception(
        f"Unhandled exception in {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "url": str(request.url),
            "client": request.client.host if request.client else "unknown"
        }
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "path": request.url.path
        }
    )


@app.post("/visualize_brain")
async def visualize_brain(file: UploadFile = File(...), patientId: str = Form(...), uploadId: str = Form(None)):
    """
    Main endpoint for EEG brain visualization.
    Accepts uploaded EEG file (.fif, .h5, .mat) and runs the ML pipeline.
    """
    try:
        # PHASE 3: Accept uploadId from frontend, or generate if not provided
        if uploadId:
            logger.info(f"/visualize_brain - Using provided uploadId: {uploadId}")
        else:
            uploadId = str(uuid.uuid4())
            logger.info(f"/visualize_brain - Generated new uploadId: {uploadId}")

        # Log file details for debugging
        file_size = 0
        if file.file:
            # Get file size by seeking to end
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning

        logger.info(
            f"Received file upload",
            extra={
                "uploadId": uploadId,
                "patientId": patientId,
                "upload_filename": file.filename,
                "content_type": file.content_type,
                "file_size_bytes": file_size,
                "file_size_mb": round(file_size / (1024 * 1024), 2)
            }
        )

        # Compute and log upload directory path
        upload_dir = os.path.join(UPLOADS_DIR, uploadId)
        logger.info(f"Upload directory: {upload_dir}")

        # Ensure uploads directory exists
        os.makedirs(upload_dir, exist_ok=True)
        logger.debug(f"Created/verified upload directory: {upload_dir}")

        # Save the uploaded file to the specified location
        upload_path = os.path.join(upload_dir, file.filename)
        logger.info(f"Saving file to: {upload_path}")

        with open(upload_path, "wb") as f:
            f.write(file.file.read())

        logger.info(f"File saved successfully, starting brain_visualizer.py")

        # Run brain visualizer subprocess
        subprocess.run(["python", "brain_visualizer.py", "--basePath", UPLOADS_DIR,
                        "--file", upload_path, "--patientId", patientId, "--uploadId", uploadId, "--historic", str(False)])

        # Check for output file
        output_file = "output.json"
        if os.path.exists(output_file):
            logger.info("Found output.json, reading results")
            with open(output_file, "r") as infile:
                data = json.load(infile)

            # Delete the output file after reading its contents
            os.remove(output_file)
            logger.info(f"Processing complete for uploadId: {uploadId}")
            logger.debug(f"Result data: {data}")

            return JSONResponse(
                content={"message": "Brain visualization triggered.", "data": data},
                status_code=status.HTTP_200_OK
            )
        else:
            logger.warning("output.json not found, returning basic success response")
            return JSONResponse(
                content={"message": "Brain visualization triggered."},
                status_code=status.HTTP_200_OK
            )

    except Exception as e:
        logger.exception(
            "visualize_brain failed",
            extra={
                "uploadId": uploadId if 'uploadId' in locals() else None,
                "patientId": patientId,
                "upload_filename": file.filename if file else None
            }
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "visualize_brain failed",
                "uploadId": uploadId if 'uploadId' in locals() else None
            }
        )


@app.post("/visualize_brain_historic")
async def visualize_brain_historic(uploadId: str = Form(...)):
    """
    Reprocess historical EEG data from a previous upload.
    """
    try:
        logger.info(f"Processing historic visualization for uploadId: {uploadId}")

        # Save the uploaded file to the specified location
        upload_dir = os.path.join(UPLOADS_DIR, uploadId)
        logger.info(f"Upload directory: {upload_dir}")

        if not os.path.exists(upload_dir):
            logger.warning(f"Upload directory not found: {upload_dir}")
            return JSONResponse(content={"message": "No Visualization record found."})

        logger.info("Starting brain_visualizer.py for historic data")
        subprocess.run(["python", "brain_visualizer.py",
                       "--upload_dir", upload_dir, "--historic", str(True)])

        logger.info(f"Historic visualization complete for uploadId: {uploadId}")
        return JSONResponse(content={"message": "Brain visualization triggered."})

    except Exception as e:
        logger.exception(
            "visualize_brain_historic failed",
            extra={"uploadId": uploadId}
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "visualize_brain_historic failed",
                "uploadId": uploadId
            }
        )


@app.post("/api/human-mtl-demo")
async def run_human_mtl_demo(patientId: str = Form(...), uploadId: str = Form(...), datasetFilePath: str = Form(...)):
    """
    Run the Human MTL demo analysis pipeline.
    This endpoint accepts dataset parameters and runs brain_visualizer.py with the specified dataset.
    """
    try:
        logger.info("/api/human-mtl-demo - Starting pipeline")
        logger.info(f"Patient ID: {patientId}, Upload ID: {uploadId}")
        logger.info(f"Dataset file: {datasetFilePath}")

        # Verify dataset file exists
        if not os.path.exists(datasetFilePath):
            logger.error(f"Dataset file not found: {datasetFilePath}")
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": f"Dataset file not found: {datasetFilePath}"
                }
            )

        # Run brain_visualizer.py with the dataset
        result = subprocess.run(
            [
                "python3",
                "brain_visualizer.py",
                "--basePath", UPLOADS_DIR,
                "--file", datasetFilePath,
                "--patientId", patientId,
                "--uploadId", uploadId,
                "--historic", "false"
            ],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            logger.error("Pipeline failed with error:")
            logger.error(f"STDERR: {result.stderr}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Pipeline execution failed",
                    "details": result.stderr
                }
            )

        logger.info("Pipeline completed successfully")

        # Check for output.json
        output_file = "output.json"
        if os.path.exists(output_file):
            with open(output_file, "r") as infile:
                data = json.load(infile)
            os.remove(output_file)

            return JSONResponse(
                content={
                    "success": True,
                    "message": "Human MTL demo analysis completed",
                    "data": data
                },
                status_code=status.HTTP_200_OK
            )
        else:
            return JSONResponse(
                content={
                    "success": True,
                    "message": "Pipeline completed (no output.json generated)"
                },
                status_code=status.HTTP_200_OK
            )

    except subprocess.TimeoutExpired:
        logger.error(
            "human-mtl-demo pipeline timeout (exceeded 5 minutes)",
            extra={"uploadId": uploadId, "patientId": patientId}
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Pipeline execution timeout (exceeded 5 minutes)"
            }
        )
    except Exception as e:
        logger.exception(
            "human-mtl-demo failed",
            extra={
                "uploadId": uploadId,
                "patientId": patientId,
                "datasetFilePath": datasetFilePath
            }
        )
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal Server Error",
                "message": "human-mtl-demo failed"
            }
        )


@app.post("/visualize_brain_dev")
async def visualize_brain_dev(patientId: str = Form(...), file: UploadFile = File(None), uploadId: str = Form(None)):
    """
    DEV-ONLY ENDPOINT
    Simulates EEG processing without requiring real .fif files or heavy MNE processing.
    Generates placeholder data and calls the Node backend just like the real pipeline.

    Only available when EPICARE_DEV_MODE environment variable is set to "true".
    """
    # Check if dev mode is enabled
    dev_mode = os.environ.get("EPICARE_DEV_MODE", "false").lower() == "true"
    if not dev_mode:
        return JSONResponse(
            status_code=403,
            content={
                "error": "Dev mode not enabled",
                "message": "Set EPICARE_DEV_MODE=true in .env to use this endpoint"
            }
        )

    try:
        logger.info(f"[DEV] Processing dev upload for patient: {patientId}")

        # PHASE 3: Accept uploadId from frontend, or generate if not provided
        if uploadId:
            logger.info(f"[DEV] Using provided uploadId: {uploadId}")
        else:
            uploadId = f"dev-{str(uuid.uuid4())}"
            logger.info(f"[DEV] Generated new uploadId: {uploadId}")

        # Generate placeholder image URLs
        placeholder_urls = {
            "topomap": "https://placehold.co/600x400/0f766e/white?text=EEG+Topomap+(DEV)",
            "brainViews": [
                "https://placehold.co/1000x400/0f766e/white?text=Medial+View+(DEV)",
                "https://placehold.co/1000x400/059669/white?text=Rostral+View+(DEV)",
                "https://placehold.co/1000x400/10b981/white?text=Caudal+View+(DEV)",
                "https://placehold.co/1000x400/34d399/white?text=Dorsal+View+(DEV)",
                "https://placehold.co/1000x400/6ee7b7/white?text=Ventral+View+(DEV)",
                "https://placehold.co/1000x400/0f766e/white?text=Frontal+View+(DEV)",
                "https://placehold.co/1000x400/059669/white?text=Parietal+View+(DEV)",
                "https://placehold.co/1000x400/10b981/white?text=Axial+View+(DEV)",
                "https://placehold.co/1000x400/34d399/white?text=Sagittal+View+(DEV)",
                "https://placehold.co/1000x400/6ee7b7/white?text=Coronal+View+(DEV)",
                "https://placehold.co/1000x400/0f766e/white?text=Lateral+View+(DEV)",
            ],
            "matUrl": "https://example.com/dev-data/dev-eeg-data.mat",
        }

        # PHASE 5: Generate placeholder summary and hotspots for dev mode
        dev_summary = "Strongest activity in left temporal (0.85), followed by right frontal (0.72), and left parietal (0.63)."
        dev_hotspots = [
            {
                "region": "left temporal",
                "hemisphere": "L",
                "confidence": 0.85,
                "coordinates": [-45.2, -30.1, 10.5]
            },
            {
                "region": "right frontal",
                "hemisphere": "R",
                "confidence": 0.72,
                "coordinates": [35.8, 25.3, 45.2]
            },
            {
                "region": "left parietal",
                "hemisphere": "L",
                "confidence": 0.63,
                "coordinates": [-25.4, -55.7, 60.1]
            }
        ]

        # Prepare callback payload (identical structure to real pipeline)
        import requests

        callback_payload = {
            "patientId": patientId,
            "uploadId": uploadId,
            "figUrl": placeholder_urls["topomap"],
            "matUrl": placeholder_urls["matUrl"],
            "images": placeholder_urls["brainViews"],
            "metadata": {
                "modelVersion": "ConvDip-DEV",
                "mneVersion": "dev-mode-1.0.0"
            },
            "summary": dev_summary,  # PHASE 5
            "hotspots": dev_hotspots  # PHASE 5
        }

        # Get Node backend URL and API key
        node_api_url = os.environ.get("NODE_API_URL", "http://localhost:3000")
        api_key = os.environ.get("EPICARE_INTERNAL_API_KEY", "")

        # Prepare headers with API key
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["x-epicare-key"] = api_key

        logger.info(f"[DEV] Calling Node backend at: {node_api_url}/patients/upload")

        # Call Node backend (exactly like real pipeline)
        response = requests.post(
            f"{node_api_url}/patients/upload",
            json=callback_payload,
            headers=headers
        )

        if response.status_code == 200:
            logger.info("[DEV] ✓ Node backend callback successful")
            logger.info(f"[DEV] ✓ Patient updated: {response.json().get('patientUpdated')}")
            logger.info(f"[DEV] ✓ Study updated: {response.json().get('studyUpdated')}")
        else:
            logger.error(f"[DEV] ✗ Node backend callback failed: {response.status_code}")
            logger.error(f"[DEV] Response: {response.text}")

        # Return success response (matching real endpoint structure)
        return JSONResponse(
            content={
                "message": "Dev visualization complete",
                "data": {
                    "uploadId": uploadId
                }
            },
            status_code=status.HTTP_200_OK
        )

    except Exception as e:
        logger.exception(
            "[DEV] visualize_brain_dev failed",
            extra={
                "uploadId": uploadId if 'uploadId' in locals() else None,
                "patientId": patientId
            }
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "visualize_brain_dev failed",
                "uploadId": uploadId if 'uploadId' in locals() else None
            }
        )
