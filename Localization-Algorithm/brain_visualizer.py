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

# Configure Cloudinary with environment variables
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)


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

        data = {"uploadId": args.uploadId}
        # Print the data to stdout (can be captured by subprocess.run)
        with open("output.json", "w") as outfile:
            json.dump(data, outfile)

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

            # Prepare headers with optional API key
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["x-epicare-key"] = api_key

            # Log summary and hotspots being sent
            print(f"[EPILEPSY_ECOG] Sending {len(request['hotspots'])} hotspots to backend")

            response = requests.post(
                f"{node_api_url}/patients/upload",
                json=request,
                headers=headers
            )

            if response.status_code == 200:
                print("[EPILEPSY_ECOG] Pipeline complete")
            else:
                print(f"[ERROR] Backend callback failed: {response.status_code}")

            # Write output.json for API response
            data = {"uploadId": args.uploadId}
            with open("output.json", "w") as outfile:
                json.dump(data, outfile)

        except Exception as e:
            print(f"[ERROR] EPILEPSY_ECOG mode failed: {e}")
            import traceback
            traceback.print_exc()
            # Write error to output.json
            with open("output.json", "w") as outfile:
                json.dump({"error": str(e)}, outfile)

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

            # Prepare headers with optional API key
            headers = {"Content-Type": "application/json"}
            if api_key:
                headers["x-epicare-key"] = api_key

            # Log summary and hotspots being sent
            print(f"[HUMAN_MTL] Sending {len(request['hotspots'])} hotspots, {len(request.get('brainViews', {}))} views to backend")

            response = requests.post(
                f"{node_api_url}/patients/upload",
                json=request,
                headers=headers
            )

            if response.status_code == 200:
                print("[HUMAN_MTL] Pipeline complete")
            else:
                print(f"[ERROR] Backend callback failed: {response.status_code}")

            # Write output.json for API response
            data = {"uploadId": args.uploadId}
            with open("output.json", "w") as outfile:
                json.dump(data, outfile)

        except Exception as e:
            print(f"[ERROR] HUMAN_MTL mode failed: {e}")
            import traceback
            traceback.print_exc()
            # Write error to output.json
            with open("output.json", "w") as outfile:
                json.dump({"error": str(e)}, outfile)

    else:
        print(f"[ERROR] Unknown mode: {mode}")
        raise ValueError(f"Unknown processing mode: {mode}")
