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


# ============================================================================
# PATH UTILITIES - Single source of truth for file locations
# ============================================================================

def get_upload_dir(uploadId: str) -> str:
    """Get the canonical upload directory for a given uploadId."""
    return os.path.join(UPLOADS_DIR, uploadId)


def get_output_json_path(uploadId: str) -> str:
    """Get the canonical path to output.json for a given uploadId."""
    return os.path.join(get_upload_dir(uploadId), "output.json")


def ensure_upload_dir(uploadId: str) -> str:
    """Ensure upload directory exists and return its path."""
    upload_dir = get_upload_dir(uploadId)
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def write_output_json(uploadId: str, data: dict) -> None:
    """Write output.json to the correct location with error handling."""
    output_path = get_output_json_path(uploadId)
    try:
        with open(output_path, "w") as outfile:
            json.dump(data, outfile, indent=2)
        logger.info(f"[ARTIFACT] Wrote output.json to: {output_path}")
    except Exception as e:
        logger.error(f"[ARTIFACT] Failed to write output.json: {e}")
        raise


def read_output_json(uploadId: str) -> dict:
    """Read output.json from the correct location."""
    output_path = get_output_json_path(uploadId)
    if not os.path.exists(output_path):
        raise FileNotFoundError(f"output.json not found at {output_path}")

    with open(output_path, "r") as infile:
        data = json.load(infile)
    logger.info(f"[ARTIFACT] Read output.json from: {output_path}")
    return data


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
    uploadId_for_error = None
    try:
        # Generate or use provided uploadId
        if uploadId:
            logger.info(f"[REQUEST] /visualize_brain - Using provided uploadId: {uploadId}")
        else:
            uploadId = str(uuid.uuid4())
            logger.info(f"[REQUEST] /visualize_brain - Generated new uploadId: {uploadId}")

        uploadId_for_error = uploadId

        # Log file details for debugging
        file_size = 0
        if file.file:
            file.file.seek(0, 2)  # Seek to end
            file_size = file.file.tell()
            file.file.seek(0)  # Reset to beginning

        logger.info(
            f"[REQUEST] File upload details: patientId={patientId}, filename={file.filename}, "
            f"size={round(file_size / (1024 * 1024), 2)}MB"
        )

        # Use path utilities
        upload_dir = ensure_upload_dir(uploadId)
        logger.info(f"[REQUEST] Upload directory: {upload_dir}")

        # Save uploaded file
        upload_path = os.path.join(upload_dir, file.filename)
        logger.info(f"[REQUEST] Saving file to: {upload_path}")

        with open(upload_path, "wb") as f:
            f.write(file.file.read())

        logger.info(f"[PIPELINE] Starting brain_visualizer.py for uploadId: {uploadId}")

        # Run brain visualizer subprocess with timeout and stderr capture
        result = subprocess.run(
            [
                "python", "brain_visualizer.py",
                "--basePath", UPLOADS_DIR,
                "--file", upload_path,
                "--patientId", patientId,
                "--uploadId", uploadId,
                "--historic", "false"
            ],
            capture_output=True,
            text=True,
            timeout=180,  # 3 minute timeout
            cwd="/app"  # Explicit working directory
        )

        logger.info(f"[PIPELINE] brain_visualizer.py completed with return code: {result.returncode}")

        # Log last 2000 chars of stdout/stderr for debugging
        if result.stdout:
            logger.debug(f"[PIPELINE] STDOUT (last 2000 chars): {result.stdout[-2000:]}")
        if result.stderr:
            logger.warning(f"[PIPELINE] STDERR (last 2000 chars): {result.stderr[-2000:]}")

        # Check for output.json in the CORRECT location (upload directory)
        try:
            data = read_output_json(uploadId)

            # Check if output contains error
            if "error" in data:
                logger.error(f"[PIPELINE] Processing failed: {data['error']}")
                # Still write the error to output.json for inspection
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": "Pipeline processing failed",
                        "message": str(data.get("error", "Unknown error")),
                        "uploadId": uploadId,
                        "details": data.get("traceback", "No traceback available")
                    }
                )

            logger.info(f"[PIPELINE] Processing complete for uploadId: {uploadId}")
            return JSONResponse(
                content={"message": "Brain visualization complete", "data": data},
                status_code=status.HTTP_200_OK
            )

        except FileNotFoundError as e:
            logger.error(f"[PIPELINE] output.json not found at expected path: {get_output_json_path(uploadId)}")
            logger.error(f"[PIPELINE] Return code: {result.returncode}")
            logger.error(f"[PIPELINE] STDERR: {result.stderr}")

            # Write error output.json ourselves
            error_data = {
                "error": "Pipeline did not produce output.json",
                "uploadId": uploadId,
                "returncode": result.returncode,
                "stderr": result.stderr[-2000:] if result.stderr else "",
                "stdout": result.stdout[-2000:] if result.stdout else ""
            }
            write_output_json(uploadId, error_data)

            return JSONResponse(
                status_code=500,
                content={
                    "error": "Pipeline did not produce output",
                    "message": "brain_visualizer.py did not create output.json",
                    "uploadId": uploadId,
                    "returncode": result.returncode
                }
            )

    except subprocess.TimeoutExpired as e:
        logger.error(
            f"[PIPELINE] Timeout after 180 seconds for uploadId: {uploadId_for_error}",
            extra={"uploadId": uploadId_for_error, "patientId": patientId}
        )

        # Write timeout error to output.json
        if uploadId_for_error:
            timeout_data = {
                "error": "Pipeline timeout after 180 seconds",
                "uploadId": uploadId_for_error,
                "stdout": e.stdout[-2000:] if e.stdout else "",
                "stderr": e.stderr[-2000:] if e.stderr else ""
            }
            try:
                write_output_json(uploadId_for_error, timeout_data)
            except Exception:
                pass

        return JSONResponse(
            status_code=500,
            content={
                "error": "Pipeline timeout",
                "message": "Processing exceeded 180 second limit",
                "uploadId": uploadId_for_error
            }
        )

    except Exception as e:
        logger.exception(
            "[PIPELINE] visualize_brain failed",
            extra={
                "uploadId": uploadId_for_error,
                "patientId": patientId,
                "upload_filename": file.filename if file else None
            }
        )

        # Write exception to output.json
        if uploadId_for_error:
            error_data = {
                "error": str(e),
                "uploadId": uploadId_for_error,
                "traceback": str(e.__traceback__)
            }
            try:
                write_output_json(uploadId_for_error, error_data)
            except Exception:
                pass

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": str(e),
                "uploadId": uploadId_for_error
            }
        )


@app.post("/visualize_brain_historic")
async def visualize_brain_historic(uploadId: str = Form(...)):
    """
    Reprocess historical EEG data from a previous upload.
    """
    try:
        logger.info(f"[REQUEST] /visualize_brain_historic for uploadId: {uploadId}")

        # Check if upload directory exists
        upload_dir = get_upload_dir(uploadId)
        logger.info(f"[REQUEST] Upload directory: {upload_dir}")

        if not os.path.exists(upload_dir):
            logger.warning(f"[REQUEST] Upload directory not found: {upload_dir}")
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Not Found",
                    "message": "No visualization record found for this uploadId",
                    "uploadId": uploadId
                }
            )

        logger.info(f"[PIPELINE] Starting brain_visualizer.py for historic data")

        # Run with timeout and capture output
        result = subprocess.run(
            [
                "python", "brain_visualizer.py",
                "--upload_dir", upload_dir,
                "--historic", "true"
            ],
            capture_output=True,
            text=True,
            timeout=180,
            cwd="/app"
        )

        logger.info(f"[PIPELINE] Historic processing completed with return code: {result.returncode}")

        if result.stdout:
            logger.debug(f"[PIPELINE] STDOUT: {result.stdout[-2000:]}")
        if result.stderr:
            logger.warning(f"[PIPELINE] STDERR: {result.stderr[-2000:]}")

        # Try to read output.json
        try:
            data = read_output_json(uploadId)

            if "error" in data:
                logger.error(f"[PIPELINE] Historic processing failed: {data['error']}")
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": "Historic processing failed",
                        "message": str(data.get("error")),
                        "uploadId": uploadId
                    }
                )

            logger.info(f"[PIPELINE] Historic visualization complete for uploadId: {uploadId}")
            return JSONResponse(
                content={"message": "Historic visualization complete", "data": data},
                status_code=status.HTTP_200_OK
            )

        except FileNotFoundError:
            logger.warning(f"[PIPELINE] No output.json found, returning basic success")
            return JSONResponse(
                content={"message": "Historic visualization triggered (no output data)"},
                status_code=status.HTTP_200_OK
            )

    except subprocess.TimeoutExpired:
        logger.error(f"[PIPELINE] Historic processing timeout for uploadId: {uploadId}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Pipeline timeout",
                "message": "Historic processing exceeded 180 second limit",
                "uploadId": uploadId
            }
        )

    except Exception as e:
        logger.exception(
            "[PIPELINE] visualize_brain_historic failed",
            extra={"uploadId": uploadId}
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": str(e),
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
        logger.info(f"[REQUEST] /api/human-mtl-demo - patientId={patientId}, uploadId={uploadId}")
        logger.info(f"[REQUEST] Dataset file: {datasetFilePath}")

        # Verify dataset file exists
        if not os.path.exists(datasetFilePath):
            logger.error(f"[REQUEST] Dataset file not found: {datasetFilePath}")
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "error": f"Dataset file not found: {datasetFilePath}",
                    "uploadId": uploadId
                }
            )

        # Ensure upload directory exists
        upload_dir = ensure_upload_dir(uploadId)
        logger.info(f"[REQUEST] Upload directory: {upload_dir}")

        logger.info(f"[PIPELINE] Starting brain_visualizer.py for Human MTL demo")

        # Run brain_visualizer.py with the dataset
        result = subprocess.run(
            [
                "python",
                "brain_visualizer.py",
                "--basePath", UPLOADS_DIR,
                "--file", datasetFilePath,
                "--patientId", patientId,
                "--uploadId", uploadId,
                "--historic", "false"
            ],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd="/app"
        )

        logger.info(f"[PIPELINE] Human MTL demo completed with return code: {result.returncode}")

        if result.stdout:
            logger.debug(f"[PIPELINE] STDOUT: {result.stdout[-2000:]}")
        if result.stderr:
            logger.warning(f"[PIPELINE] STDERR: {result.stderr[-2000:]}")

        if result.returncode != 0:
            logger.error(f"[PIPELINE] Pipeline failed with return code: {result.returncode}")

            # Write error to output.json
            error_data = {
                "error": "Pipeline execution failed",
                "returncode": result.returncode,
                "stderr": result.stderr[-2000:] if result.stderr else "",
                "uploadId": uploadId
            }
            write_output_json(uploadId, error_data)

            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Pipeline execution failed",
                    "details": result.stderr,
                    "uploadId": uploadId
                }
            )

        # Try to read output.json from correct location
        try:
            data = read_output_json(uploadId)

            if "error" in data:
                return JSONResponse(
                    status_code=500,
                    content={
                        "success": False,
                        "error": str(data.get("error")),
                        "uploadId": uploadId
                    }
                )

            logger.info(f"[PIPELINE] Human MTL demo analysis completed for uploadId: {uploadId}")
            return JSONResponse(
                content={
                    "success": True,
                    "message": "Human MTL demo analysis completed",
                    "data": data
                },
                status_code=status.HTTP_200_OK
            )

        except FileNotFoundError:
            logger.warning(f"[PIPELINE] No output.json found for uploadId: {uploadId}")
            return JSONResponse(
                content={
                    "success": True,
                    "message": "Pipeline completed (no output.json generated)",
                    "uploadId": uploadId
                },
                status_code=status.HTTP_200_OK
            )

    except subprocess.TimeoutExpired as e:
        logger.error(
            f"[PIPELINE] human-mtl-demo timeout (exceeded 5 minutes)",
            extra={"uploadId": uploadId, "patientId": patientId}
        )

        # Write timeout error to output.json
        timeout_data = {
            "error": "Pipeline timeout after 300 seconds",
            "uploadId": uploadId,
            "stdout": e.stdout[-2000:] if e.stdout else "",
            "stderr": e.stderr[-2000:] if e.stderr else ""
        }
        try:
            write_output_json(uploadId, timeout_data)
        except Exception:
            pass

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Pipeline execution timeout (exceeded 5 minutes)",
                "uploadId": uploadId
            }
        )

    except Exception as e:
        logger.exception(
            "[PIPELINE] human-mtl-demo failed",
            extra={
                "uploadId": uploadId,
                "patientId": patientId,
                "datasetFilePath": datasetFilePath
            }
        )

        # Write exception to output.json
        error_data = {
            "error": str(e),
            "uploadId": uploadId
        }
        try:
            write_output_json(uploadId, error_data)
        except Exception:
            pass

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Internal Server Error",
                "message": str(e),
                "uploadId": uploadId
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
