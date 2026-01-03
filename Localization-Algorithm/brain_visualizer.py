# Load environment variables FIRST
import os
from dotenv import load_dotenv

load_dotenv()

# Set MNE logging to WARNING to reduce verbose output
import mne
mne.set_log_level("WARNING")

from helper import (
    save_evoked_data, data_preprocessing, load_result, ConvDip_ESI, brain3d,
    brain3dOnlyVisualize, compute_localization_summary,
    # EPILEPSY_ECOG mode functions
    detect_processing_mode, load_data_for_mode_detection, process_epilepsy_ecog,
    # HUMAN_MTL mode functions
    process_human_mtl_dataset,
    # TASK D: Multi-band activity & improved hotspot functions
    compute_multiband_activity, compute_epileptic_index, classify_electrode_region, extract_hotspots
)
# TASK C: Import unified preprocessing layer
import preprocessing
import argparse
import json
import cloudinary
from cloudinary import uploader
import requests
import traceback
import sys

# Configure Cloudinary with environment variables
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)


# ============================================================================
# OUTPUT JSON UTILITIES - Write to correct location
# ============================================================================

def get_output_json_path(basePath, uploadId):
    """Get the canonical path to output.json for a given uploadId."""
    upload_dir = os.path.join(basePath, uploadId)
    return os.path.join(upload_dir, "output.json")


def write_output_json(basePath, uploadId, data):
    """
    Write output.json to the correct location: /app/uploads/<uploadId>/output.json
    This ensures brain_api.py can find it.
    """
    output_path = get_output_json_path(basePath, uploadId)
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        with open(output_path, "w") as outfile:
            json.dump(data, outfile, indent=2)
        print(f"[ARTIFACT] Wrote output.json to: {output_path}")
        return output_path
    except Exception as e:
        print(f"[ERROR] Failed to write output.json to {output_path}: {e}")
        traceback.print_exc()
        raise


if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description='Brain Visualizer Script')

    # Add arguments
    parser.add_argument('--historic', type=str,
                        help='Path to the uploaded file')

    args, remaining_args = parser.parse_known_args()

    historic_bool = args.historic and args.historic.lower() == "true"
    if historic_bool:
        parser.add_argument('--upload_dir', type=str,
                            help='For historic file directory')
    else:
        parser.add_argument('--basePath', type=str,
                            help='Root Path to the upload directory')
        parser.add_argument('--file', type=str,
                            help='Path to the uploaded file')
        parser.add_argument('--patientId', type=str,
                            help='Patient ID of the uploaded file')
        parser.add_argument('--uploadId', type=str,
                            help='New ID for the uploaded file')

    # Parse arguments
    args = parser.parse_args(remaining_args)
    event_id = "LA"

    # ====================================================================
    # MODE DETECTION (for non-historic processing)
    # ====================================================================
    if not historic_bool:
        try:
            mode = detect_processing_mode(args.file)
            print(f"[PIPELINE] Mode: {mode}")
        except Exception as e:
            print(f"[ERROR] Mode detection failed: {e}, defaulting to DEMO")
            mode = "DEMO"
    else:
        mode = "DEMO"
        print(f"[PIPELINE] Historic mode")

    # ====================================================================
    # ROUTE TO APPROPRIATE PIPELINE
    # ====================================================================

    if historic_bool:
        result_path = os.path.join(args.upload_dir, "result")
        s_pred = load_result(event_id, result_path)
        files_in_folder = os.listdir(args.upload_dir)

        fif_file_path = None

        for file in files_in_folder:
            if file.endswith('.fif'):
                fif_file_path = os.path.join(args.upload_dir, file)
                break
        if fif_file_path is None:
            raise FileNotFoundError("No .fif file found in the folder.")

        raw, events = data_preprocessing(fif_file_path)

        fig = raw.plot(
            events=events,
            start=5,
            duration=10,
            color="gray",
            event_color={1: "r", 2: "g", 3: "b", 4: "m", 5: "y",
                         32: "k"},  # set color according to events id
        )

        brain3dOnlyVisualize(fif_file_path, s_pred,
                             args.upload_dir, hemi='both')

    elif not historic_bool and mode == "DEMO":
        # ====================================================================
        # DEMO MODE: Original MEG pipeline (sample_audvis dataset)
        # ====================================================================
        try:
            print("[PIPELINE] Starting DEMO pipeline")
            root_path = os.path.join(args.basePath, args.uploadId)

            # set path to save data
            raw, events, evoked_use, fig_name, figure_url, mat_url = save_evoked_data(args.uploadId,
                                                                                      args.file, event_id, root_path)

            # set your result path
            result_path = os.path.join(root_path, "result")
            s_pred = ConvDip_ESI(event_id, root_path)

            # s_pred = load_result(event_id, result_path)

            # ====================================================
            # PHASE 5: Compute localization summary and hotspots
            # ====================================================
            summary, hotspots = compute_localization_summary(s_pred, n_top=3)
            print(f"[PIPELINE] Detected {len(hotspots)} hotspots")

            # Call the brain3d function with the provided arguments

            fig = raw.plot(
                events=events,
                start=5,
                duration=10,
                color="gray",
                event_color={1: "r", 2: "g", 3: "b", 4: "m", 5: "y",
                             32: "k"},  # set color according to events id
            )
            # Prepare metadata
            import mne
            metadata = {
                "modelVersion": "ConvDip-1.0",  # Update with actual model version
                "mneVersion": mne.__version__
            }

            brain3d(args.file, args.uploadId, s_pred, root_path, {
                "patientId": args.patientId,
                "uploadId": args.uploadId,
                "figUrl": figure_url,
                "matUrl": mat_url,
                "metadata": metadata,
                "summary": summary,
                "hotspots": hotspots,
                "brainViews": {}  # DEMO mode doesn't generate brainViews currently
            }, hemi='both')

            print("[DEMO] Pipeline complete, writing output.json")
            data = {"uploadId": args.uploadId}
            # Write to correct location
            write_output_json(args.basePath, args.uploadId, data)

        except Exception as e:
            print(f"[ERROR] DEMO mode failed: {e}")
            traceback.print_exc()
            # CRITICAL: Always write output.json even on failure
            error_data = {
                "error": str(e),
                "uploadId": args.uploadId if hasattr(args, 'uploadId') else None,
                "traceback": traceback.format_exc(),
                "mode": "DEMO"
            }
            if hasattr(args, 'basePath') and hasattr(args, 'uploadId'):
                write_output_json(args.basePath, args.uploadId, error_data)
            else:
                # Fallback to CWD if args not available
                with open("output.json", "w") as outfile:
                    json.dump(error_data, outfile)

    elif not historic_bool and mode == "EPILEPSY_ECOG":
        # ====================================================================
        # EPILEPSY_ECOG MODE: ECoG pipeline for epilepsy dataset
        # ====================================================================
        root_path = os.path.join(args.basePath, args.uploadId)

        try:
            # Process using EPILEPSY_ECOG pipeline
            request = process_epilepsy_ecog(
                file_path=args.file,
                uploadId=args.uploadId,
                patientId=args.patientId,
                upload_dir=root_path
            )

            # POST to Node backend
            node_api_url = os.environ.get("NODE_API_URL", "http://localhost:3000")
            api_key = os.environ.get("EPICARE_INTERNAL_API_KEY", "")

            print(f"[BACKEND] Callback URL: {node_api_url}/patients/upload")
            print(f"[BACKEND] API key configured: {bool(api_key)}")

            # Prepare headers with optional API key
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["x-epicare-key"] = api_key

            # Log summary and hotspots being sent
            print(f"[EPILEPSY_ECOG] Sending {len(request['hotspots'])} hotspots to backend")

            response = requests.post(
                f"{node_api_url}/patients/upload",
                json=request,
                headers=headers,
                timeout=30  # 30 second timeout for backend callback
            )

            print(f"[BACKEND] Response status: {response.status_code}")

            if response.status_code == 200:
                print("[EPILEPSY_ECOG] ✓ Backend callback successful")
                print(f"[BACKEND] Response: {response.json()}")
            else:
                print(f"[BACKEND] ✗ Backend callback failed: {response.status_code}")
                print(f"[BACKEND] Response body: {response.text[:500]}")

            # Write output.json for API response
            data = {"uploadId": args.uploadId}
            write_output_json(args.basePath, args.uploadId, data)

        except Exception as e:
            print(f"[ERROR] EPILEPSY_ECOG mode failed: {e}")
            traceback.print_exc()
            # Write error to output.json
            error_data = {
                "error": str(e),
                "uploadId": args.uploadId if hasattr(args, 'uploadId') else None,
                "traceback": traceback.format_exc(),
                "mode": "EPILEPSY_ECOG"
            }
            if hasattr(args, 'basePath') and hasattr(args, 'uploadId'):
                write_output_json(args.basePath, args.uploadId, error_data)
            else:
                with open("output.json", "w") as outfile:
                    json.dump(error_data, outfile)

    elif not historic_bool and mode == "HUMAN_MTL":
        # ====================================================================
        # HUMAN_MTL MODE: Human MTL Units WM dataset pipeline
        # ====================================================================
        root_path = os.path.join(args.basePath, args.uploadId)

        try:
            # Process using HUMAN_MTL pipeline
            request = process_human_mtl_dataset(
                file_path=args.file,
                uploadId=args.uploadId,
                patientId=args.patientId,
                upload_dir=root_path,
                basePath=args.basePath,
                historic=historic_bool
            )

            # POST to Node backend
            node_api_url = os.environ.get("NODE_API_URL", "http://localhost:3000")
            api_key = os.environ.get("EPICARE_INTERNAL_API_KEY", "")

            print(f"[BACKEND] Callback URL: {node_api_url}/patients/upload")
            print(f"[BACKEND] API key configured: {bool(api_key)}")

            # Prepare headers with optional API key
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["x-epicare-key"] = api_key

            # Log summary and hotspots being sent
            print(f"[HUMAN_MTL] Sending {len(request['hotspots'])} hotspots, {len(request.get('brainViews', {}))} views to backend")

            response = requests.post(
                f"{node_api_url}/patients/upload",
                json=request,
                headers=headers,
                timeout=30  # 30 second timeout for backend callback
            )

            print(f"[BACKEND] Response status: {response.status_code}")

            if response.status_code == 200:
                print("[HUMAN_MTL] ✓ Backend callback successful")
                print(f"[BACKEND] Response: {response.json()}")
            else:
                print(f"[BACKEND] ✗ Backend callback failed: {response.status_code}")
                print(f"[BACKEND] Response body: {response.text[:500]}")

            # Write output.json for API response
            data = {"uploadId": args.uploadId}
            write_output_json(args.basePath, args.uploadId, data)

        except Exception as e:
            print(f"[ERROR] HUMAN_MTL mode failed: {e}")
            traceback.print_exc()
            # Write error to output.json
            error_data = {
                "error": str(e),
                "uploadId": args.uploadId if hasattr(args, 'uploadId') else None,
                "traceback": traceback.format_exc(),
                "mode": "HUMAN_MTL"
            }
            if hasattr(args, 'basePath') and hasattr(args, 'uploadId'):
                write_output_json(args.basePath, args.uploadId, error_data)
            else:
                with open("output.json", "w") as outfile:
                    json.dump(error_data, outfile)

    else:
        # Unknown mode - write error to output.json
        error_msg = f"Unknown processing mode: {mode}"
        print(f"[ERROR] {error_msg}")
        error_data = {
            "error": error_msg,
            "uploadId": args.uploadId if hasattr(args, 'uploadId') else None,
            "mode": mode
        }
        if hasattr(args, 'basePath') and hasattr(args, 'uploadId'):
            write_output_json(args.basePath, args.uploadId, error_data)
        else:
            with open("output.json", "w") as outfile:
                json.dump(error_data, outfile)
        raise ValueError(error_msg)
