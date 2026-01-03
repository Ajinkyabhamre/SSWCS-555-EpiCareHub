# Load environment variables FIRST
import os
from dotenv import load_dotenv

load_dotenv()

import mne
# Set MNE logging to WARNING to reduce verbose output
mne.set_log_level("WARNING")
from mne.beamformer import make_lcmv, apply_lcmv
import scipy.io as sio
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torch.autograd import Variable
import h5py
# Removed pyvistaqt import - not needed for headless Docker operation
# MNE's plot_source_estimates() works without Qt/GUI dependencies
import cloudinary
from cloudinary import uploader
import requests
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import glob

# Configure Cloudinary with environment variables
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)


# ============================================================================
# MODE DETECTION
# ============================================================================

def detect_processing_mode(file_path):
    """
    Detect processing mode based on file extension and channel types.

    Strategy:
    1. Check file extension first (most reliable)
       - .fif → DEMO (MEG sample_audvis pipeline)
       - .h5 (in human_mtl_units_wm) → HUMAN_MTL (Human MTL Units WM dataset)
       - .vhdr, .edf, .eeg → EPILEPSY_ECOG (iEEG/ECoG pipeline)
    2. If extension is ambiguous, load file and check channel types

    Args:
        file_path: Path to the input file (str or Path)

    Returns:
        str: "DEMO", "HUMAN_MTL", or "EPILEPSY_ECOG"
    """
    import os
    file_path_str = str(file_path)
    ext = os.path.splitext(file_path_str)[1].lower()

    # ====================================================================
    # STEP 1: File extension-based detection (primary method)
    # ====================================================================

    if ext == '.fif':
        print(f"[PIPELINE] Mode: DEMO (file extension: {ext})")
        return "DEMO"

    # TASK 3: New - Human MTL mode for .h5 files
    # Recognize ALL .h5 files as HUMAN_MTL (not just those in specific directory)
    elif ext == '.h5':
        print(f"[PIPELINE] Mode: HUMAN_MTL (.h5 file detected)")
        return "HUMAN_MTL"

    elif ext in ['.vhdr', '.edf', '.eeg']:
        print(f"[PIPELINE] Mode: EPILEPSY_ECOG (file extension: {ext})")
        return "EPILEPSY_ECOG"

    # ====================================================================
    # STEP 2: Fallback to channel-type detection for unknown extensions
    # ====================================================================

    print(f"[PIPELINE] Unknown extension '{ext}', checking channel types...")

    try:
        # Load file to inspect channel types
        raw = load_data_for_mode_detection(file_path_str)
        ch_types = set(raw.get_channel_types())
        n_channels = len(raw.ch_names)

        print(f"[PIPELINE] Channel types: {ch_types}, count: {n_channels}")

        # DEMO mode: Has MEG channels (sample_audvis dataset)
        if 'mag' in ch_types or 'grad' in ch_types:
            print(f"[PIPELINE] Mode: DEMO (MEG channels detected)")
            return "DEMO"

        # EPILEPSY_ECOG mode: Only EEG/ECOG/iEEG channels, no MEG
        elif 'eeg' in ch_types or 'ecog' in ch_types or 'seeg' in ch_types:
            print(f"[PIPELINE] Mode: EPILEPSY_ECOG (EEG/ECoG/iEEG channels detected)")
            return "EPILEPSY_ECOG"

        # Unknown channel types
        else:
            print(f"[PIPELINE] WARNING: Unknown channel configuration: {ch_types}, defaulting to DEMO")
            return "DEMO"

    except Exception as e:
        print(f"[PIPELINE] WARNING: Failed to load file for channel detection: {e}")
        print(f"[PIPELINE] Defaulting to DEMO mode")
        return "DEMO"


def load_data_for_mode_detection(file_path):
    """
    Load raw data in a format-agnostic way for mode detection.

    Supports:
    - .fif (MEG/EEG)
    - .vhdr (BrainVision)
    - .edf, .eeg (EDF/iEEG)

    Args:
        file_path: Path to input file

    Returns:
        raw: MNE Raw object (preload=False for speed)

    Raises:
        ValueError: If file format is not supported
    """
    file_path_str = str(file_path)

    if file_path_str.endswith('.vhdr'):
        raw = mne.io.read_raw_brainvision(file_path_str, preload=False, verbose=False)
    elif file_path_str.endswith('.fif'):
        raw = mne.io.read_raw_fif(file_path_str, preload=False, verbose=False)
    elif file_path_str.endswith('.edf') or file_path_str.endswith('.eeg'):
        raw = mne.io.read_raw_edf(file_path_str, preload=False, verbose=False)
    else:
        # Try auto-detect
        try:
            raw = mne.io.read_raw(file_path_str, preload=False, verbose=False)
        except Exception as e:
            print(f"[ERROR] Cannot load file {file_path_str}: {e}")
            raise ValueError(f"Unsupported file format: {file_path_str}")

    return raw


device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")


event_dict = {
    "LA": 1,
    "RA": 2,
    "LV": 3,
    "RV": 4,
}


class RandomDatasetSingle(Dataset):
    def __init__(self, x_data, y_data, length):
        self.x_data = x_data.reshape(
            (x_data.shape[0], 1, x_data.shape[1], x_data.shape[2]))
        self.y_data = y_data
        self.len = length

    def __getitem__(self, index):
        x_batch = torch.Tensor(self.x_data[index, :, :, :]).float()
        y_batch = torch.Tensor(self.y_data[index, :]).float()
        return x_batch, y_batch, index

    def __len__(self):
        return self.len


class ConvDipSingleCatAtt(torch.nn.Module):
    def __init__(self, channel_num=1, output_num=1984, conv1_num=8, fc1_num=792, fc2_num=500):
        super(ConvDipSingleCatAtt, self).__init__()
        self.cnn = torch.nn.Sequential(
            torch.nn.Conv2d(channel_num, conv1_num, kernel_size=3,
                            stride=1, dilation=1, padding=1),
            torch.nn.ReLU(),
            torch.nn.MaxPool2d(kernel_size=3, stride=1, padding=1),
        )
        # Squeeze-and-Excitation module
        self.SE = torch.nn.Sequential(
            torch.nn.Linear(8, 4),
            torch.nn.ReLU(),
            torch.nn.Linear(4, 8),
            torch.nn.Sigmoid(),
        )
        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(fc1_num, fc2_num, bias=True),
            torch.nn.ReLU(),
            torch.nn.Linear(fc2_num, output_num, bias=True)
        )

    def forward(self, x):
        out = self.cnn(x)
        out = out.view(out.size(0), out.size(1), -1)
        squeeze = torch.mean(out, dim=2)
        excitation = self.SE(squeeze)
        excitation = excitation.unsqueeze(2)
        scale_out = torch.mul(out, excitation)
        flat_out = out.view(scale_out.size(0), -1)
        final_out = self.classifier(flat_out)
        return final_out


def get_stc(file):
    # Read the raw data
    raw = mne.io.read_raw_fif(file)
    raw.info['bads'] = ['MEG 2443']  # bad MEG channel

    # Set up the epoching
    event_id = 1  # those are the trials with left-ear auditory stimuli
    tmin, tmax = -0.2, 0.5
    events = mne.find_events(raw)

    # pick relevant channels
    raw.pick(['meg', 'eog'])  # pick channels of interest

    # Create epochs
    proj = False  # already applied
    epochs = mne.Epochs(raw, events, event_id, tmin, tmax,
                        baseline=(None, 0), preload=True, proj=proj,
                        reject=dict(grad=4000e-13, mag=4e-12, eog=150e-6))

    # for speed purposes, cut to a window of interest
    evoked = epochs.average().crop(0.05, 0.15)

    # Visualize averaged sensor space data
    # evoked.plot_joint()

    del raw  # save memory

    data_cov = mne.compute_covariance(epochs, tmin=0.01, tmax=0.25,
                                      method='empirical')
    noise_cov = mne.compute_covariance(epochs, tmin=tmin, tmax=0,
                                       method='empirical')
    # data_cov.plot(epochs.info)
    del epochs

    # Read forward model
    fwd_fname = './data/meg-fwd.fif'
    forward = mne.read_forward_solution(fwd_fname)

    filters = make_lcmv(evoked.info, forward, data_cov, reg=0.05,
                        noise_cov=noise_cov, pick_ori='max-power',
                        weight_norm='unit-noise-gain', rank=None)

    filters_vec = make_lcmv(evoked.info, forward, data_cov, reg=0.05,
                            noise_cov=noise_cov, pick_ori='vector',
                            weight_norm='unit-noise-gain-invariant', rank=None)

    # save a bit of memory
    src = forward['src']
    del forward

    stc = apply_lcmv(evoked, filters)
    stc_vec = apply_lcmv(evoked, filters_vec)
    del filters, filters_vec

    return stc


def load_result(task, result_path):
    if not isinstance(task, str):
        raise Exception(
            "Oops! That was not a valid type for task. Try type a 'str'!")

    if not task in ['LA', 'RA', 'LV', 'RV']:
        raise Exception(
            "Oops! That was not a valid task. Try use 'LA', 'RA', 'LV' or 'RV'!")
    else:
        print("load result for task: {}".format(task))

        fname = os.path.join(
            result_path, 'Test_EEG_' + str(task) + '.mat')
        dataset = sio.loadmat(fname)
        s_pred = dataset['s_pred']
        s_pred = np.absolute(s_pred)
        if s_pred.shape[0] != 1984:
            s_pred = s_pred.T

    return s_pred


def max_min_normalize(data):
    data_min = np.min(data, axis=1)
    data_max = np.max(data, axis=1)
    data_min = np.expand_dims(data_min, axis=1)
    data_max = np.expand_dims(data_max, axis=1)

    data_min = np.tile(data_min, (1, data.shape[1]))
    data_max = np.tile(data_max, (1, data.shape[1]))

    # data_normalized = (data - data_min) / (data_max - data_min)
    data_normalized = np.divide(data - data_min, data_max - data_min)
    return data_normalized


def input_reshape(data, fname):
    """
    change vector of EEG/MEG data to matrix.
    for ConvDip input
    """
    # load map...................
    matfile = h5py.File(fname)
    maptable = matfile['maptable'][()].T
    x = max(maptable[:, 0]) + 1
    y = max(maptable[:, 1]) + 1
    data_num = data.shape[0]
    temp_matrix = np.zeros((data_num, int(x), int(y)))
    for index in range(maptable.shape[0]):
        i = maptable[index, 0]
        j = maptable[index, 1]
        value = maptable[index, 2]
        temp_matrix[:, int(i), int(j)] = data[:, int(value)]
    return temp_matrix


def ConvDip_ESI(task_id, path):
    """
    EEG source imaging with ConvDip framework
    task_id: str or list ['LA', 'RA', 'LV', 'RV']
    result_path: path to model output
    """
    data_name = 'sample'
    map_dir = './data/eeg_maptable.mat'

    model_flag = 'real_model'
    model_dir = './model/' + data_name + '/' + model_flag

    test_data = os.path.join(path, "data")

    result_path = os.path.join(path, "result")
    if not os.path.exists(result_path):
        os.makedirs(result_path)

    # data: EEG/MEG & source
    # size: (dim, nsample)

    if isinstance(task_id, str):
        task_set = [task_id]
    elif isinstance(task_id, list):
        task_set = task_id
    else:
        raise Exception(
            "Oops! That was not a valid type for task id. Try use 'str' or 'list'!")

    for run in task_set:
        print('processing task:', str(run))

        if not run in ['LA', 'RA', 'LV', 'RV']:
            raise Exception(
                "Oops! That was not a valid task id. Try use 'LA', 'RA', 'LV' or 'RV'!")
        else:
            data_mat = test_data + '/EEG_' + str(run) + '.mat'
            result_mat = result_path + '/Test_EEG_' + str(run) + '.mat'

            # load the real dataset
            dataset = sio.loadmat(data_mat)
            test_input = dataset['eeg'].T

            test_input = max_min_normalize(test_input)

            # change to [timepoint, 12, 14]:
            test_input_matrix = input_reshape(test_input, map_dir)

            # get the number of samples:
            ntest = test_input_matrix.shape[0]
            test_output = test_input

            # change to [timepoint, 1, 12, 14]:
            RandomDataset_test = RandomDatasetSingle(
                test_input_matrix, test_output, ntest)
            rand_loader_test = DataLoader(dataset=RandomDataset_test, batch_size=ntest, num_workers=0,
                                          shuffle=False)

            # Build model: Model_EEG
            model = ConvDipSingleCatAtt()

            model = model.to(device)
            # load pretrained model...
            model.load_state_dict(torch.load(
                '%s/net_params_best.pkl' % (model_dir)))
            # model prediction...
            model.eval()
            with torch.no_grad():
                for data in rand_loader_test:
                    batch_X_eeg, _, _ = data
                    batch_X_eeg = batch_X_eeg.to(device)

                    X_eeg = Variable(batch_X_eeg)

                    # forward propagation
                    Y_pred = model(X_eeg)
                    Y_pred = Y_pred.cpu().detach().numpy().T

            # ================== save test result: ==================
            sio.savemat(result_mat, {'s_pred': Y_pred})
            Y_pred = np.absolute(Y_pred)
            if Y_pred.shape[0] != 1984:
                Y_pred = Y_pred.T
            return Y_pred
            # print("======== test finished!! ========")


def data_preprocessing(file):
    """
    Preprocess FIF files for DEMO mode (MEG sample_audvis pipeline).

    IMPORTANT: This function is ONLY for .fif files in DEMO mode.
    For .vhdr/.edf ECoG files, use data_preprocessing_ecog() in EPILEPSY_ECOG mode.

    Args:
        file: Path to .fif file

    Returns:
        tuple: (raw, events)

    Raises:
        ValueError: If file is not a .fif file
    """
    # Safety check: ensure this is a .fif file
    if not str(file).endswith('.fif'):
        raise ValueError(
            f"[ERROR] data_preprocessing() is only for .fif files (DEMO mode). "
            f"Got: {file}. For .vhdr/.edf files, use EPILEPSY_ECOG mode pipeline."
        )

    raw = mne.io.read_raw_fif(file, preload=True)
    l_freq, h_freq = 1, 30
    raw.filter(l_freq, h_freq, method='fir', fir_design='firwin')
    sfreq_resample = 480
    raw = raw.resample(sfreq_resample)
    events = mne.find_events(raw, stim_channel="STI 014")
    return raw, events


def save_evoked_data(uploadId, file, event, path):
    raw, events = data_preprocessing(file)

    fig_path = os.path.join(path, "figures")
    data_path = os.path.join(path, "data")
    if not os.path.exists(fig_path):
        os.makedirs(fig_path)
    if not os.path.exists(data_path):
        os.makedirs(data_path)

    fig_name = os.path.join(fig_path, 'EEG_'+str(event)+'.png')
    mat_name = os.path.join(data_path, 'EEG_'+str(event)+'.mat')

    tmin = -0.1  # start of each epoch (100ms before the event)
    tmax = 0.4  # end of each epoch (400ms after the event)
    raw.info['bads'] = ['MEG 2443', 'EEG 053']
    baseline = (None, 0)  # means from the first instant to t = 0
    reject = dict(grad=4000e-13, mag=4e-12, eog=150e-6)
    picks = mne.pick_types(raw.info, meg=True, eeg=True,
                           eog=True, exclude='bads')
    epochs = mne.Epochs(raw, events, event_dict, tmin, tmax, proj=True,
                        picks=picks, baseline=baseline, reject=reject)
    epoch_use = epochs[event]
    evoked_use = epoch_use.average()

    fig = evoked_use.plot_topomap(
        times=[0.0, 0.08, 0.1, 0.12, 0.2], ch_type="eeg")
    fig.savefig(fig_name, dpi=300, bbox_inches='tight')
    # evoked_use_path = os.path.join(data_path, 'evoked_use.npy')
    # np.save(evoked_use_path, evoked_use)

    data = evoked_use.data[:, :]
    sio.savemat(mat_name, {'eeg': data})
    figure_result = uploader.upload(
        fig_name, folder=f"{uploadId}/figures",
        public_id='EEG_'+str(event)+'.png'
    )
    mat_result = uploader.upload(
        mat_name, folder=f"{uploadId}/data",
        public_id='EEG_'+str(event)+'.mat',
        resource_type="raw"
    )
    figure_url = figure_result['secure_url']
    mat_url = mat_result['secure_url']

    return raw, events, evoked_use, fig_name, figure_url, mat_url


def brain3d(file, uploadId, s_pred, directory, request, hemi):
    print(f"[brain3d] START - uploadId={uploadId}, hemi={hemi}")
    request['images'] = []
    stc = get_stc(file)
    stc.data = s_pred
    data_path = mne.datasets.sample.data_path()
    subjects_dir = data_path / 'subjects'

    # Removed BackgroundPlotter() - not needed for headless PNG generation
    # MNE Brain object handles image saving via brain.save_image()
    brain = mne.viz.plot_source_estimates(
        stc,
        views='lateral',
        hemi=hemi,
        surface='white',
        background='white',
        size=(1000, 400),
        subjects_dir=subjects_dir,
    )
    print(f"[brain3d] Created MNE Brain object, generating {11} view snapshots...")

    views = ['medial', 'rostral', 'caudal', 'dorsal', 'ventral',
             'frontal', 'parietal', 'axial', 'sagittal', 'coronal', 'lateral']
    for view in views:
        view_filename = f'{view}.png'
        view_path = os.path.join(directory, '', view_filename)
        brain.show_view(view)
        brain.save_image(view_path)
        response = uploader.upload(
            view_path, public_id=f'{uploadId}/figures/{view_filename}')
        cloudinary_url = response['secure_url']
        request['images'].append(cloudinary_url)
        os.remove(view_path)

    print(f"[brain3d] Uploaded {len(request['images'])} brain images to Cloudinary")

    # Get Node backend URL and API key from environment
    node_api_url = os.environ.get("NODE_API_URL", "http://localhost:3000")
    api_key = os.environ.get("EPICARE_INTERNAL_API_KEY", "")

    # Prepare headers with optional API key
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["x-epicare-key"] = api_key

    # PHASE 5: Log summary and hotspots being sent
    if 'summary' in request:
        print(f"[PHASE 5] Sending summary to Node: {request['summary']}")
    if 'hotspots' in request:
        print(f"[PHASE 5] Sending {len(request['hotspots'])} hotspots to Node")

    print(f"[brain3d] POSTing to Node backend: {node_api_url}/patients/upload")
    response = requests.post(
        f"{node_api_url}/patients/upload",
        json=request,
        headers=headers
    )

    if response.status_code == 200:
        print(f"[brain3d] ✓ Node backend callback SUCCESS (200)")
    else:
        print(f"[brain3d] ✗ Node backend callback FAILED: {response.status_code}")
        print(f"[brain3d] Response: {response.text[:200]}")

    # CRITICAL: Removed plotter.app.exec_() - this was blocking the container forever!
    # In headless Docker mode, we don't need Qt event loops
    print(f"[brain3d] COMPLETE - returning control (headless mode, no GUI blocking)")


def brain3dOnlyVisualize(file, s_pred, directory, hemi):
    """
    Headless brain visualization (local snapshots only, no Cloudinary upload).
    Saves PNG files to directory for manual inspection.
    """
    print(f"[brain3dOnlyVisualize] START - Generating local brain snapshots to {directory}")
    stc = get_stc(file)
    stc.data = s_pred
    data_path = mne.datasets.sample.data_path()
    subjects_dir = data_path / 'subjects'

    # Removed BackgroundPlotter() - not needed for headless PNG generation
    brain = mne.viz.plot_source_estimates(
        stc,
        views='lateral',
        hemi=hemi,
        surface='white',
        background='white',
        size=(1000, 400),
        subjects_dir=subjects_dir,
    )

    # Save 5 key views to directory (no upload)
    views = ['lateral', 'medial', 'rostral', 'caudal', 'dorsal']
    saved_files = []
    for view in views:
        view_filename = f'brain_{view}.png'
        view_path = os.path.join(directory, view_filename)
        brain.show_view(view)
        brain.save_image(view_path)
        saved_files.append(view_path)

    print(f"[brain3dOnlyVisualize] COMPLETE - Saved {len(saved_files)} snapshots (headless mode, no GUI)")
    # CRITICAL: Removed plotter.app.exec_() - this was blocking the container forever!


def compute_localization_summary(stc_or_data, n_top=3):
    """
    PHASE 5: Compute seizure localization summary and hotspots from source estimate.

    Given an MNE SourceEstimate (stc) or a 1984-dim ConvDip prediction vector (s_pred),
    this function computes a simple heuristic localization summary and list of hotspots.

    **IMPORTANT**: This is a heuristic approximation for demonstration purposes.
    Do NOT use for clinical diagnosis without proper validation.

    Args:
        stc_or_data: Either an MNE SourceEstimate object or a numpy array (1984,) from ConvDip
        n_top: Number of top hotspots to return (default 3)

    Returns:
        tuple: (summary_str, hotspots_list)
            - summary_str (str): Human-readable summary text
            - hotspots_list (list[dict]): List of hotspot dicts with:
                - region (str): Brain region name
                - hemisphere (str): "L" or "R"
                - confidence (float): 0-1 normalized score
                - coordinates (list[float]): [x, y, z] in MNI/MRI space

    Example:
        summary, hotspots = compute_localization_summary(stc, n_top=3)
        # summary: "Strongest activity in left temporal (0.85), followed by..."
        # hotspots: [{"region": "left temporal", "hemisphere": "L", ...}, ...]
    """
    try:
        # ====================================================
        # Step 1: Extract activation data and source space
        # ====================================================

        # Check if input is an MNE SourceEstimate or raw numpy array
        if hasattr(stc_or_data, 'data'):
            # It's an MNE SourceEstimate
            stc = stc_or_data
            activation = np.abs(stc.data[:, :]).mean(axis=1)  # Average across time

            # Get source space positions (MNI coordinates)
            # Load the forward solution to get source positions
            fwd_fname = './data/meg-fwd.fif'
            forward = mne.read_forward_solution(fwd_fname)
            src = forward['src']

            # Get vertex positions in MRI coordinates
            lh_vertno = src[0]['vertno']  # Left hemisphere vertices
            rh_vertno = src[1]['vertno']  # Right hemisphere vertices
            lh_pos = src[0]['rr'][lh_vertno] * 1000  # Convert to mm
            rh_pos = src[1]['rr'][rh_vertno] * 1000  # Convert to mm

            # Combine positions
            all_positions = np.vstack([lh_pos, rh_pos])

        else:
            # It's a raw numpy array from ConvDip (1984 sources)
            activation = np.abs(stc_or_data.flatten())

            # Load source space for coordinate mapping
            fwd_fname = './data/meg-fwd.fif'
            forward = mne.read_forward_solution(fwd_fname)
            src = forward['src']

            # Get all source positions
            lh_vertno = src[0]['vertno']
            rh_vertno = src[1]['vertno']
            lh_pos = src[0]['rr'][lh_vertno] * 1000  # mm
            rh_pos = src[1]['rr'][rh_vertno] * 1000  # mm
            all_positions = np.vstack([lh_pos, rh_pos])

        # Ensure we have the right number of sources
        if len(activation) != all_positions.shape[0]:
            print(f"[WARNING] Activation dim ({len(activation)}) != positions dim ({all_positions.shape[0]}), truncating")
            min_len = min(len(activation), all_positions.shape[0])
            activation = activation[:min_len]
            all_positions = all_positions[:min_len]

        # ====================================================
        # Step 2: Normalize and find top N activated sources
        # ====================================================

        # Normalize to [0, 1]
        if activation.max() > 0:
            activation_norm = activation / activation.max()
        else:
            activation_norm = activation

        # Find top N indices
        top_indices = np.argsort(activation_norm)[-n_top:][::-1]  # Descending order

        # ====================================================
        # Step 3: Build hotspot list
        # ====================================================

        hotspots = []
        for idx in top_indices:
            pos = all_positions[idx]
            x, y, z = pos[0], pos[1], pos[2]
            confidence = float(activation_norm[idx])

            # Determine hemisphere by X coordinate (left = negative, right = positive)
            hemisphere = "L" if x < 0 else "R"
            hemi_name = "left" if hemisphere == "L" else "right"

            # Simple region heuristic based on Y and Z coordinates
            # This is a ROUGH approximation - real parcellation would use atlas labels
            region_name = _estimate_region_from_coords(x, y, z)
            full_region = f"{hemi_name} {region_name}"

            hotspots.append({
                "region": full_region,
                "hemisphere": hemisphere,
                "confidence": confidence,
                "coordinates": [float(x), float(y), float(z)]
            })

        # ====================================================
        # Step 4: Generate summary string
        # ====================================================

        if len(hotspots) > 0:
            # Build summary from top hotspots
            parts = []
            for i, hs in enumerate(hotspots):
                conf_pct = int(hs['confidence'] * 100)
                if i == 0:
                    parts.append(f"Strongest activity in {hs['region']} ({hs['confidence']:.2f})")
                else:
                    parts.append(f"{hs['region']} ({hs['confidence']:.2f})")

            if len(parts) == 1:
                summary = parts[0] + "."
            elif len(parts) == 2:
                summary = f"{parts[0]}, followed by {parts[1]}."
            else:
                summary = f"{parts[0]}, followed by {', '.join(parts[1:-1])}, and {parts[-1]}."
        else:
            summary = "No reliable localization summary available."

        return summary, hotspots

    except Exception as e:
        # On any error, return safe fallback
        print(f"[ERROR] compute_localization_summary failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return "No reliable localization summary available.", []


def _estimate_region_from_coords(x, y, z):
    """
    PHASE 5 Helper: Heuristic brain region estimation from MRI coordinates.

    **DISCLAIMER**: This is a VERY rough approximation based on coordinate ranges.
    Real anatomical parcellation requires atlas labels (e.g., Desikan-Killiany, Destrieux).

    Args:
        x, y, z (float): Coordinates in mm (MRI/MNI space)

    Returns:
        str: Region name (e.g., "temporal", "frontal", "parietal", "occipital")
    """
    # Convert to absolute for some checks
    abs_x = abs(x)
    abs_y = abs(y)
    abs_z = abs(z)

    # Rough heuristic based on typical MNI coordinate ranges:
    # - Temporal: high |x| (lateral), mid y (around 0 to -50)
    # - Frontal: positive y (anterior), variable z
    # - Parietal: mid-high z (superior), near midline y
    # - Occipital: negative y (posterior)

    if y < -40:
        # Posterior → likely occipital or posterior temporal
        if abs_x > 35:
            return "temporal"  # lateral + posterior
        else:
            return "occipital"
    elif y > 10:
        # Anterior → frontal
        return "frontal"
    elif z > 40:
        # Superior → parietal
        return "parietal"
    elif abs_x > 35:
        # Lateral → temporal
        return "temporal"
    else:
        # Default to central/parietal
        return "central"


# ============================================================================
# TASK D: MULTI-BAND ACTIVITY EXTRACTION & IMPROVED HOTSPOT DETECTION
# ============================================================================

def compute_multiband_activity(data_window: np.ndarray, sfreq: float) -> dict:
    """
    Compute multi-band activity extraction for epileptic signal analysis.

    Extracts power in frequency bands commonly associated with epileptic activity:
    - Delta (1-4 Hz): Slow wave activity
    - Theta (4-8 Hz): Drowsiness, focal slowing
    - Alpha (8-13 Hz): Background rhythm
    - Beta (13-30 Hz): Motor activity, seizure onset
    - Gamma (30-80 Hz): High-frequency oscillations, seizure core

    Args:
        data_window: Data array of shape (n_channels, n_samples)
        sfreq: Sampling frequency in Hz

    Returns:
        dict: Dictionary with keys:
            - 'delta': np.ndarray (n_channels,) - delta band power
            - 'theta': np.ndarray (n_channels,) - theta band power
            - 'alpha': np.ndarray (n_channels,) - alpha band power
            - 'beta': np.ndarray (n_channels,) - beta band power
            - 'gamma': np.ndarray (n_channels,) - gamma band power
            - 'all_bands': dict - all band powers for reference
    """
    print(f"[ACTIVITY] Computing multi-band activity for {data_window.shape[0]} channels")

    # Define frequency bands
    bands = {
        'delta': (1, 4),
        'theta': (4, 8),
        'alpha': (8, 13),
        'beta': (13, 30),
        'gamma': (30, 80)
    }

    result = {}

    for band_name, (low_freq, high_freq) in bands.items():
        try:
            # Create MNE info object for filtering
            info = mne.create_info(
                ch_names=[f'CH{i}' for i in range(data_window.shape[0])],
                sfreq=sfreq,
                ch_types='eeg'
            )

            # Create RawArray
            raw_temp = mne.io.RawArray(data_window, info, verbose=False)

            # Band-pass filter
            raw_filtered = raw_temp.copy().filter(
                low_freq, high_freq,
                method='fir',
                fir_design='firwin',
                verbose=False
            )

            # Compute power (RMS)
            filtered_data = raw_filtered.get_data()
            band_power = np.sqrt(np.mean(filtered_data ** 2, axis=1))

            # Normalize to [0, 1]
            if band_power.max() > 0:
                band_power = band_power / band_power.max()

            result[band_name] = band_power
            print(f"[ACTIVITY]   {band_name.capitalize()} ({low_freq}-{high_freq} Hz): mean power = {band_power.mean():.3f}")

        except Exception as e:
            print(f"[ACTIVITY] Warning: Failed to compute {band_name} band: {e}")
            result[band_name] = np.zeros(data_window.shape[0])

    result['all_bands'] = result.copy()
    return result


def compute_epileptic_index(multiband_activity: dict, weights: dict = None) -> np.ndarray:
    """
    Compute epileptic activity index from multi-band power.

    Combines band powers with clinical weights to create an "epileptic activity index"
    that emphasizes frequencies most relevant for seizure localization.

    Default weights (based on clinical literature):
    - Delta: 0.5 (low-frequency slowing)
    - Theta: 0.7 (focal slowing marker)
    - Alpha: 0.3 (disrupted background)
    - Beta: 1.0 (seizure onset marker)
    - Gamma: 1.5 (high-frequency oscillations, seizure core)

    Args:
        multiband_activity: Output from compute_multiband_activity()
        weights: Optional dict of band weights (default: clinical weights)

    Returns:
        np.ndarray: Epileptic activity index (n_channels,), normalized to [0, 1]
    """
    if weights is None:
        # Default clinical weights
        weights = {
            'delta': 0.5,
            'theta': 0.7,
            'alpha': 0.3,
            'beta': 1.0,
            'gamma': 1.5
        }

    print(f"[ACTIVITY] Computing epileptic activity index with weights:")
    for band, weight in weights.items():
        print(f"[ACTIVITY]   {band}: {weight}")

    # Weighted sum
    epileptic_index = np.zeros(len(multiband_activity['delta']))

    for band, weight in weights.items():
        if band in multiband_activity:
            epileptic_index += weight * multiband_activity[band]

    # Normalize to [0, 1]
    if epileptic_index.max() > 0:
        epileptic_index = epileptic_index / epileptic_index.max()

    print(f"[ACTIVITY] Epileptic index computed: mean={epileptic_index.mean():.3f}, max={epileptic_index.max():.3f}")

    return epileptic_index


def classify_electrode_region(ch_name: str, position: tuple = None) -> tuple:
    """
    Classify electrode region using channel label and/or 3D position.

    Strategy:
    1. Parse channel name for anatomical hints (F=frontal, T=temporal, etc.)
    2. Use 3D coordinates if available
    3. Fallback to generic quadrant classification

    Args:
        ch_name: Channel name (e.g., 'Fp1', 'T3', 'G12')
        position: Optional (x, y, z) coordinates in MNI/MRI space

    Returns:
        tuple: (region_name, hemisphere)
            - region_name: str (e.g., 'left frontal', 'right temporal')
            - hemisphere: str ('L' or 'R')

    Examples:
        >>> classify_electrode_region('Fp1')
        ('left frontal', 'L')
        >>> classify_electrode_region('T4')
        ('right temporal', 'R')
    """
    ch_name_upper = ch_name.upper()

    # ====================================================
    # Strategy 1: Parse channel name for standard EEG labels
    # ====================================================

    # Determine hemisphere from label
    hemisphere = None
    if ch_name_upper.endswith('1') or ch_name_upper.endswith('3') or ch_name_upper.endswith('5') or ch_name_upper.endswith('7'):
        hemisphere = 'L'
    elif ch_name_upper.endswith('2') or ch_name_upper.endswith('4') or ch_name_upper.endswith('6') or ch_name_upper.endswith('8'):
        hemisphere = 'R'
    elif 'L' in ch_name_upper or 'LEFT' in ch_name_upper:
        hemisphere = 'L'
    elif 'R' in ch_name_upper or 'RIGHT' in ch_name_upper:
        hemisphere = 'R'

    # Parse region from prefix
    region = None
    if ch_name_upper.startswith('FP'):
        region = 'frontal pole'
    elif ch_name_upper.startswith('F'):
        region = 'frontal'
    elif ch_name_upper.startswith('T'):
        region = 'temporal'
    elif ch_name_upper.startswith('P'):
        region = 'parietal'
    elif ch_name_upper.startswith('O'):
        region = 'occipital'
    elif ch_name_upper.startswith('C'):
        region = 'central'

    # ====================================================
    # Strategy 2: Use 3D coordinates if available
    # ====================================================
    if position is not None:
        x, y, z = position
        # Override hemisphere from coordinates
        hemisphere = 'L' if x < 0 else 'R'

        # Use coordinate-based region if channel name didn't give us one
        if region is None:
            region = _estimate_region_from_coords(x, y, z)

    # ====================================================
    # Fallback
    # ====================================================
    if hemisphere is None:
        hemisphere = 'L'  # Default
    if region is None:
        region = 'unknown'

    hemi_name = 'left' if hemisphere == 'L' else 'right'
    full_region = f"{hemi_name} {region}"

    return full_region, hemisphere


def extract_hotspots(activity_index: np.ndarray,
                    ch_names: list,
                    electrode_positions: dict = None,
                    n_top: int = 3,
                    confidence_threshold: float = 0.3) -> list:
    """
    Extract and rank hotspots from activity index with improved region classification.

    Args:
        activity_index: Normalized activity index per channel (n_channels,)
        ch_names: List of channel names
        electrode_positions: Optional dict {ch_name: (x, y, z)} in MNI space
        n_top: Number of top hotspots to return
        confidence_threshold: Minimum activity threshold to consider (default: 0.3)

    Returns:
        list: List of hotspot dicts sorted by confidence (highest first):
            - region (str): Brain region name
            - hemisphere (str): 'L' or 'R'
            - confidence (float): Normalized activity score [0, 1]
            - coordinates (list): [x, y, z] in MNI space (or [0, 0, 0] if unavailable)
            - channel (str): Channel name
            - z_score (float): Z-scored activity relative to mean
    """
    print(f"[HOTSPOT] Extracting top {n_top} hotspots from {len(activity_index)} channels")
    print(f"[HOTSPOT] Confidence threshold: {confidence_threshold}")

    # Compute Z-scores for confidence assessment
    mean_activity = activity_index.mean()
    std_activity = activity_index.std()

    if std_activity == 0:
        z_scores = np.zeros(len(activity_index))
    else:
        z_scores = (activity_index - mean_activity) / std_activity

    # Filter by threshold
    above_threshold = activity_index >= confidence_threshold
    n_above = above_threshold.sum()

    print(f"[HOTSPOT] {n_above} channels above threshold")

    # Get indices of top N channels
    top_indices = np.argsort(activity_index)[-n_top:][::-1]  # Descending order

    hotspots = []

    for idx in top_indices:
        ch_name = ch_names[idx]
        confidence = float(activity_index[idx])

        # Skip if below threshold
        if confidence < confidence_threshold:
            continue

        # Get electrode position if available
        position = None
        if electrode_positions and ch_name in electrode_positions:
            position = electrode_positions[ch_name]

        # Classify region
        region, hemisphere = classify_electrode_region(ch_name, position=position)

        # Get coordinates
        if position:
            coords = [float(position[0]), float(position[1]), float(position[2])]
        else:
            coords = [0.0, 0.0, 0.0]

        hotspot = {
            'region': region,
            'hemisphere': hemisphere,
            'confidence': confidence,
            'coordinates': coords,
            'channel': ch_name,
            'z_score': float(z_scores[idx])
        }

        hotspots.append(hotspot)
        print(f"[HOTSPOT]   [{len(hotspots)}] {ch_name} ({region}) - confidence: {confidence:.3f}, z-score: {z_scores[idx]:.2f}")

    if len(hotspots) == 0:
        print(f"[HOTSPOT] Warning: No hotspots above threshold, returning top {n_top} anyway")
        # Return top N regardless of threshold
        for idx in top_indices:
            ch_name = ch_names[idx]
            confidence = float(activity_index[idx])

            position = None
            if electrode_positions and ch_name in electrode_positions:
                position = electrode_positions[ch_name]

            region, hemisphere = classify_electrode_region(ch_name, position=position)

            if position:
                coords = [float(position[0]), float(position[1]), float(position[2])]
            else:
                coords = [0.0, 0.0, 0.0]

            hotspots.append({
                'region': region,
                'hemisphere': hemisphere,
                'confidence': confidence,
                'coordinates': coords,
                'channel': ch_name,
                'z_score': float(z_scores[idx])
            })

    print(f"[HOTSPOT] Extracted {len(hotspots)} hotspots")
    return hotspots


# ============================================================================
# EPILEPSY ECOG MODE FUNCTIONS
# ============================================================================

def data_preprocessing_ecog(file_path):
    """
    Preprocess ECoG data (simpler than MEG preprocessing).

    - Load BrainVision or .fif format
    - Band-pass filter: 1-30 Hz (same as DEMO for consistency)
    - Resample to 500 Hz (optional, for faster processing)
    - Use annotations instead of find_events

    Args:
        file_path: Path to .vhdr or .fif file

    Returns:
        raw: MNE Raw object (preprocessed)
        annotations: MNE Annotations object
    """
    try:
        print(f"[EPILEPSY_ECOG] Loading file: {file_path}")

        # Load data
        if file_path.endswith('.vhdr'):
            raw = mne.io.read_raw_brainvision(file_path, preload=True, verbose=False)
        elif file_path.endswith('.fif'):
            raw = mne.io.read_raw_fif(file_path, preload=True, verbose=False)
        else:
            raw = mne.io.read_raw(file_path, preload=True, verbose=False)

        print(f"[EPILEPSY_ECOG] Loaded {len(raw.ch_names)} channels, {raw.times[-1]:.2f}s duration")

        # Filter
        l_freq, h_freq = 1, 30
        print(f"[EPILEPSY_ECOG] Applying band-pass filter: {l_freq}-{h_freq} Hz")
        raw.filter(l_freq, h_freq, method='fir', fir_design='firwin', verbose=False)

        # Resample (optional)
        sfreq_resample = 500
        if raw.info['sfreq'] != sfreq_resample:
            print(f"[EPILEPSY_ECOG] Resampling from {raw.info['sfreq']} Hz to {sfreq_resample} Hz")
            raw = raw.resample(sfreq_resample, verbose=False)

        # Get annotations
        annotations = raw.annotations

        return raw, annotations

    except Exception as e:
        print(f"[ERROR] EPILEPSY_ECOG preprocessing failed: {e}")
        import traceback
        traceback.print_exc()
        raise


def select_activity_window(raw, annotations, window_duration=2.0):
    """
    Select a time window for analysis.

    Strategy:
    1. If annotations exist, use first annotation as marker
    2. Otherwise, compute global RMS and select highest activity window

    Args:
        raw: MNE Raw object
        annotations: MNE Annotations object
        window_duration: Duration in seconds (default 2.0)

    Returns:
        tmin, tmax: Time window in seconds
    """
    try:
        if len(annotations) > 0:
            # Use first annotation as reference
            t_ref = annotations.onset[0]
            tmin = max(0, t_ref - 0.5)  # 0.5s before marker
            tmax = min(raw.times[-1], t_ref + window_duration - 0.5)
            print(f"[EPILEPSY_ECOG] Using annotation-based window: {tmin:.2f}s - {tmax:.2f}s")
        else:
            # Use middle of recording
            t_mid = raw.times[-1] / 2
            tmin = max(0, t_mid - window_duration / 2)
            tmax = min(raw.times[-1], t_mid + window_duration / 2)
            print(f"[EPILEPSY_ECOG] No annotations found, using middle window: {tmin:.2f}s - {tmax:.2f}s")

        return tmin, tmax

    except Exception as e:
        print(f"[WARNING] Error selecting activity window: {e}, using default")
        # Fallback to first 2 seconds
        return 0.0, min(2.0, raw.times[-1])


def compute_electrode_activity(raw, tmin, tmax):
    """
    Compute per-electrode activity in time window.

    Simple metric: RMS (root mean square) of signal in window

    Args:
        raw: MNE Raw object
        tmin, tmax: Time window in seconds

    Returns:
        activity: np.array of shape (n_channels,), normalized to [0, 1]
    """
    try:
        # Get data in window
        start_sample = raw.time_as_index(tmin)[0]
        stop_sample = raw.time_as_index(tmax)[0]
        data = raw.get_data(start=start_sample, stop=stop_sample)

        # Compute RMS per channel
        rms = np.sqrt(np.mean(data ** 2, axis=1))

        # Normalize to [0, 1]
        if rms.max() > 0:
            activity_norm = rms / rms.max()
        else:
            activity_norm = rms

        return activity_norm

    except Exception as e:
        print(f"[ERROR] Failed to compute electrode activity: {e}")
        # Return zeros as fallback
        return np.zeros(len(raw.ch_names))


def load_electrode_positions(file_path):
    """
    Load electrode positions from BIDS sidecar TSV.

    DEPRECATED: Use load_electrode_positions_from_bids() instead for better ds003029 support.

    Args:
        file_path: Path to original data file

    Returns:
        dict: {channel_name: (x, y, z)} or None if not found
    """
    try:
        # Try to find electrodes.tsv in same directory
        directory = os.path.dirname(file_path)

        # Common BIDS naming patterns
        patterns = [
            os.path.join(directory, "*_electrodes.tsv"),
            os.path.join(directory, "*_space-fsaverage_electrodes.tsv"),
        ]

        electrodes_file = None
        for pattern in patterns:
            matches = glob.glob(pattern)
            if matches:
                electrodes_file = matches[0]
                break

        if electrodes_file is None:
            print("[EPILEPSY_ECOG] No electrode positions file found")
            return None

        print(f"[EPILEPSY_ECOG] Loading electrode positions from: {electrodes_file}")

        # Read TSV manually (no pandas dependency)
        positions = {}
        with open(electrodes_file, 'r') as f:
            lines = f.readlines()
            header = lines[0].strip().split('\t')

            # Find column indices
            name_idx = header.index('name')
            x_idx = header.index('x')
            y_idx = header.index('y')
            z_idx = header.index('z')

            for line in lines[1:]:
                parts = line.strip().split('\t')
                if len(parts) <= max(name_idx, x_idx, y_idx, z_idx):
                    continue  # Skip malformed lines

                name = parts[name_idx]
                try:
                    x = float(parts[x_idx])
                    y = float(parts[y_idx])
                    z = float(parts[z_idx])
                    positions[name] = (x, y, z)
                except ValueError:
                    # Skip lines with non-numeric coordinates
                    continue

        print(f"[EPILEPSY_ECOG] Loaded {len(positions)} electrode positions")
        return positions

    except Exception as e:
        print(f"[WARNING] Failed to load electrode positions: {e}")
        return None


def load_electrode_positions_from_bids(ieeg_file_path: str) -> dict:
    """
    Load electrode 3D positions from BIDS ds003029 dataset metadata.

    This function locates and parses the electrodes.tsv and coordsystem.json files
    that accompany a BIDS-compliant iEEG recording, extracting 3D coordinates
    for each electrode/channel.

    Strategy:
    1. Parse the iEEG filename to extract subject, session, and base name
    2. Look for matching electrodes.tsv in the same directory:
       - Session-level: {subject}_{session}_electrodes.tsv
       - Session-level with space: {subject}_{session}_space-*_electrodes.tsv
    3. Look for coordsystem.json to identify coordinate space and units
    4. Parse electrodes.tsv and extract (x, y, z) coordinates per channel
    5. Handle channel name mismatches between raw data and TSV (e.g., "$LAF9" vs "LAF9")

    Args:
        ieeg_file_path: Full path to the iEEG data file (.vhdr, .edf, etc.)
                       Example: ".../sub-jh101/ses-presurgery/ieeg/sub-jh101_ses-presurgery_task-ictal_acq-ecog_run-01_ieeg.vhdr"

    Returns:
        dict: Mapping of channel names to 3D coordinates:
              {
                  "channel_name": (x, y, z),
                  ...
              }
              Returns empty dict {} if electrodes.tsv not found or on error.
              Coordinates are in the native space/units from the BIDS dataset (typically mm).

    Coordinate Systems (from coordsystem.json):
    - ACPC: Anterior Commissure - Posterior Commissure space
    - T1w: Native T1-weighted MRI space
    - MNI152NLin2009bAsym: MNI template space
    - Units: typically "mm" (millimeters)

    Example:
        >>> positions = load_electrode_positions_from_bids("/path/to/sub-jh101_ses-presurgery_task-ictal_ieeg.vhdr")
        >>> print(positions.get("LAF9"))
        (-45.2, 12.1, 58.7)

    Notes:
    - If electrodes.tsv or coordsystem.json is missing, logs a warning and returns {}
    - If channel names don't match exactly, tries fuzzy matching (strips "$" prefix, case-insensitive)
    - Uses the first available space if multiple electrodes.tsv files exist
    """
    try:
        import os
        import glob
        import json

        # ====================================================================
        # Step 1: Parse filename and locate directory
        # ====================================================================

        ieeg_file_path = str(ieeg_file_path)  # Ensure string
        directory = os.path.dirname(ieeg_file_path)
        basename = os.path.basename(ieeg_file_path)

        # Extract subject and session from filename
        # Example: sub-jh101_ses-presurgery_task-ictal_acq-ecog_run-01_ieeg.vhdr
        parts = basename.split('_')
        subject = None
        session = None

        for part in parts:
            if part.startswith('sub-'):
                subject = part
            elif part.startswith('ses-'):
                session = part

        if not subject or not session:
            print(f"[BIDS] WARNING: Could not parse subject/session from filename: {basename}")
            print(f"[BIDS] Expected BIDS naming like: sub-XX_ses-YY_..._ieeg.ext")
            return {}

        print(f"[BIDS] Parsed: {subject}, {session}")

        # ====================================================================
        # Step 2: Find electrodes.tsv file
        # ====================================================================

        # BIDS naming conventions for electrodes.tsv:
        # - Session-level (no space suffix): {subject}_{session}_electrodes.tsv
        # - Session-level with space: {subject}_{session}_space-{label}_electrodes.tsv

        electrodes_patterns = [
            os.path.join(directory, f"{subject}_{session}_electrodes.tsv"),
            os.path.join(directory, f"{subject}_{session}_space-*_electrodes.tsv"),
        ]

        electrodes_file = None
        for pattern in electrodes_patterns:
            matches = glob.glob(pattern)
            if matches:
                electrodes_file = matches[0]  # Use first match
                break

        if not electrodes_file:
            print(f"[BIDS] WARNING: No electrodes.tsv found for {subject}/{session}")
            print(f"[BIDS] Searched patterns: {electrodes_patterns}")
            return {}

        print(f"[BIDS] Found electrodes file: {os.path.basename(electrodes_file)}")

        # ====================================================================
        # Step 3: Check for coordsystem.json (optional, for metadata)
        # ====================================================================

        coordsystem_file = os.path.join(directory, f"{subject}_{session}_coordsystem.json")
        coordinate_system = "unknown"
        coordinate_units = "mm"  # Default assumption

        if os.path.exists(coordsystem_file):
            try:
                with open(coordsystem_file, 'r') as f:
                    coordsystem_data = json.load(f)
                    coordinate_system = coordsystem_data.get("iEEGCoordinateSystem", "unknown")
                    coordinate_units = coordsystem_data.get("iEEGCoordinateUnits", "mm")
                    print(f"[BIDS] Coordinate system: {coordinate_system}, units: {coordinate_units}")
            except Exception as e:
                print(f"[BIDS] WARNING: Could not parse coordsystem.json: {e}")
        else:
            print(f"[BIDS] WARNING: No coordsystem.json found, assuming space=unknown, units=mm")

        # ====================================================================
        # Step 4: Parse electrodes.tsv
        # ====================================================================

        positions = {}

        with open(electrodes_file, 'r') as f:
            lines = f.readlines()

            if len(lines) == 0:
                print(f"[BIDS] WARNING: electrodes.tsv is empty")
                return {}

            # Parse header
            header = lines[0].strip().split('\t')

            # Find required columns
            try:
                name_idx = header.index('name')
                x_idx = header.index('x')
                y_idx = header.index('y')
                z_idx = header.index('z')
            except ValueError as e:
                print(f"[BIDS] ERROR: Missing required column in electrodes.tsv: {e}")
                print(f"[BIDS] Header: {header}")
                return {}

            # Parse data rows
            n_valid = 0
            n_invalid = 0

            for line_num, line in enumerate(lines[1:], start=2):
                line = line.strip()
                if not line:
                    continue  # Skip empty lines

                parts = line.split('\t')

                # Check if we have enough columns
                if len(parts) <= max(name_idx, x_idx, y_idx, z_idx):
                    n_invalid += 1
                    continue

                name = parts[name_idx].strip()

                try:
                    x = float(parts[x_idx])
                    y = float(parts[y_idx])
                    z = float(parts[z_idx])

                    # Check for n/a or nan values
                    if any(val != val for val in [x, y, z]):  # NaN check
                        print(f"[BIDS] WARNING: Line {line_num}: NaN coordinate for electrode '{name}', skipping")
                        n_invalid += 1
                        continue

                    positions[name] = (x, y, z)
                    n_valid += 1

                except (ValueError, IndexError) as e:
                    print(f"[BIDS] WARNING: Line {line_num}: Invalid coordinate for electrode '{name}': {e}")
                    n_invalid += 1
                    continue

        print(f"[BIDS] Loaded {n_valid} electrode positions from {os.path.basename(electrodes_file)}")
        if n_invalid > 0:
            print(f"[BIDS] WARNING: Skipped {n_invalid} electrodes with invalid/missing coordinates")

        return positions

    except Exception as e:
        print(f"[BIDS] ERROR: Failed to load electrode positions: {e}")
        import traceback
        traceback.print_exc()
        return {}


def map_electrode_to_region(x, y, z):
    """
    Map electrode MNI coordinate to brain region (heuristic).

    Uses same logic as _estimate_region_from_coords() from Phase 5.

    Args:
        x, y, z: MNI coordinates in mm

    Returns:
        tuple: (full_region_name, hemisphere)
            e.g., ("left temporal", "L")
    """
    abs_x = abs(x)

    # Determine hemisphere
    hemisphere = "L" if x < 0 else "R"
    hemi_name = "left" if hemisphere == "L" else "right"

    # Heuristic region mapping (same as _estimate_region_from_coords)
    region_name = _estimate_region_from_coords(x, y, z)

    return f"{hemi_name} {region_name}", hemisphere


def compute_ecog_summary(raw, activity, electrode_positions, n_top=3):
    """
    Generate summary and hotspots for ECoG data.

    Args:
        raw: MNE Raw object
        activity: np.array (n_channels,) normalized activity
        electrode_positions: dict {ch_name: (x, y, z)} or None
        n_top: Number of top hotspots

    Returns:
        summary: str
        hotspots: list[dict]
    """
    try:
        # Find top N channels by activity
        top_indices = np.argsort(activity)[-n_top:][::-1]

        hotspots = []
        for idx in top_indices:
            ch_name = raw.ch_names[idx]
            confidence = float(activity[idx])

            # Get coordinates if available
            if electrode_positions and ch_name in electrode_positions:
                x, y, z = electrode_positions[ch_name]
                region, hemisphere = map_electrode_to_region(x, y, z)
                coords = [float(x), float(y), float(z)]
            else:
                # Try fuzzy matching for channel names (e.g., "$LAF9" vs "LAF9")
                ch_name_clean = ch_name.lstrip("$").upper()
                matched = False

                if electrode_positions:
                    for tsv_name, tsv_coords in electrode_positions.items():
                        if tsv_name.upper() == ch_name_clean:
                            x, y, z = tsv_coords
                            region, hemisphere = map_electrode_to_region(x, y, z)
                            coords = [float(x), float(y), float(z)]
                            matched = True
                            break

                if not matched:
                    # Fallback if no positions
                    region = f"electrode {ch_name}"
                    hemisphere = "L"  # default
                    coords = [0.0, 0.0, 0.0]

            hotspots.append({
                "region": region,
                "hemisphere": hemisphere,
                "confidence": confidence,
                "coordinates": coords,
                "channel": ch_name  # Include channel name for 3D overlay
            })

        # Generate summary string
        if len(hotspots) > 0:
            parts = []
            for i, hs in enumerate(hotspots):
                if i == 0:
                    parts.append(f"Strongest activity in {hs['region']} ({hs['confidence']:.2f})")
                else:
                    parts.append(f"{hs['region']} ({hs['confidence']:.2f})")

            if len(parts) == 1:
                summary = parts[0] + "."
            elif len(parts) == 2:
                summary = f"{parts[0]}, followed by {parts[1]}."
            else:
                summary = f"{parts[0]}, followed by {', '.join(parts[1:-1])}, and {parts[-1]}."
        else:
            summary = "No reliable localization summary available."

        return summary, hotspots

    except Exception as e:
        print(f"[ERROR] Failed to compute ECoG summary: {e}")
        import traceback
        traceback.print_exc()
        return "No reliable localization summary available.", []


# ============================================================================
# TASK 1 & 2: Human MTL Dataset Loader Functions
# ============================================================================

def load_human_mtl_ieeg_with_coords(h5_file_path):
    """
    Load iEEG data + MNI electrode coordinates + labels from the
    Human MTL Units WM dataset (Boran et al. 2019).

    Args:
        h5_file_path: Path to .h5 file (e.g., Data_Subject_01_Session_01.h5)

    Returns:
        dict with keys:
            "data": np.ndarray (n_channels, n_samples)
            "sfreq": float (sampling frequency in Hz)
            "ch_names": List[str] (channel names)
            "coords_mm": np.ndarray (n_channels, 3) - MNI coordinates in mm
            "labels": List[str] (electrode labels, same as ch_names)

    Raises:
        ValueError: If channels/coords/labels don't match
    """
    import h5py
    import numpy as np

    print(f"[HUMAN_MTL] Loading {h5_file_path}")

    with h5py.File(h5_file_path, 'r') as f:
        # Navigate to session block
        session_name = list(f['data'].keys())[0]
        block = f['data'][session_name]

        # ====================================================================
        # Step 1: Load MNI coordinates
        # ====================================================================
        elec_info = block['groups']['iEEG electrode information']
        data_arrays = elec_info['data_arrays']

        # Find coordinate array (shape N x 3)
        coords_mm = None
        for key, arr in data_arrays.items():
            if 'data' in arr:
                data = arr['data'][()]
                if len(data.shape) == 2 and data.shape[1] == 3:
                    coords_mm = data
                    break

        if coords_mm is None:
            raise ValueError("[HUMAN_MTL] ERROR: Could not find MNI coordinates (Nx3 array)")

        n_electrodes = coords_mm.shape[0]
        print(f"[HUMAN_MTL] Loaded {n_electrodes} electrode MNI coordinates")

        # ====================================================================
        # Step 2: Load electrode labels
        # ====================================================================
        ieeg_data = block['groups']['iEEG data']
        first_trial_key = list(ieeg_data['data_arrays'].keys())[0]
        first_trial = ieeg_data['data_arrays'][first_trial_key]

        labels_ds = first_trial['dimensions']['1']['labels']
        labels = [lbl.decode() if isinstance(lbl, bytes) else lbl for lbl in labels_ds[()]]

        if len(labels) != n_electrodes:
            raise ValueError(f"[HUMAN_MTL] ERROR: Mismatch - {len(labels)} labels vs {n_electrodes} coordinates")

        print(f"[HUMAN_MTL] Electrode labels (first 5): {labels[:5]}")

        # ====================================================================
        # Step 3: Load iEEG signal data
        # ====================================================================
        # For now, use first trial data
        # TODO: Could concatenate multiple trials if needed
        trial_data = first_trial['data'][()]  # Shape: (n_channels, n_samples)

        if trial_data.shape[0] != n_electrodes:
            raise ValueError(f"[HUMAN_MTL] ERROR: Mismatch - {trial_data.shape[0]} data channels vs {n_electrodes} electrodes")

        n_samples = trial_data.shape[1]
        print(f"[HUMAN_MTL] Loaded iEEG data: {trial_data.shape[0]} channels × {n_samples} samples")

        # ====================================================================
        # Step 4: Extract sampling frequency
        # ====================================================================
        # Sampling interval is in dimensions/2
        dim2 = first_trial['dimensions']['2']

        # Try to find sampling_interval
        if 'sampling_interval' in dim2:
            sampling_interval = dim2['sampling_interval'][()]
            print(f"[HUMAN_MTL] Sampling interval: {sampling_interval}")
        else:
            # Fallback: check attributes
            sampling_interval = 1.0 / 1024.0  # Default fallback
            print(f"[HUMAN_MTL] WARNING: Could not find sampling_interval, using default")

        sfreq = 1.0 / sampling_interval
        print(f"[HUMAN_MTL] Sampling frequency: {sfreq} Hz")

        # ====================================================================
        # Step 5: Validate and return
        # ====================================================================
        assert trial_data.shape[0] == coords_mm.shape[0] == len(labels), \
            f"Shape mismatch: data={trial_data.shape[0]}, coords={coords_mm.shape[0]}, labels={len(labels)}"

        print(f"[HUMAN_MTL] ✓ Successfully loaded {n_electrodes} channels, {n_samples} samples, sfreq={sfreq:.1f} Hz")
        print(f"[HUMAN_MTL] First electrode: {labels[0]} at MNI [{coords_mm[0][0]:.1f}, {coords_mm[0][1]:.1f}, {coords_mm[0][2]:.1f}] mm")

        return {
            "data": trial_data,
            "sfreq": sfreq,
            "ch_names": labels,
            "coords_mm": coords_mm,
            "labels": labels,
        }


def human_mtl_to_mne_raw(h5_file_path):
    """
    Load Human MTL dataset .h5 and wrap it into an MNE RawArray.

    Args:
        h5_file_path: Path to .h5 file

    Returns:
        tuple: (raw, coords_mm, labels)
            raw: mne.io.RawArray
            coords_mm: np.ndarray (n_channels, 3) - MNI coordinates in mm
            labels: List[str] - electrode labels
    """
    import mne

    # Load data using helper
    mtl_data = load_human_mtl_ieeg_with_coords(h5_file_path)

    data = mtl_data["data"]
    sfreq = mtl_data["sfreq"]
    ch_names = mtl_data["ch_names"]
    coords_mm = mtl_data["coords_mm"]
    labels = mtl_data["labels"]

    # Create MNE info
    info = mne.create_info(ch_names=ch_names, sfreq=sfreq, ch_types='seeg')

    # Create RawArray
    raw = mne.io.RawArray(data, info, verbose=False)

    n_channels = len(ch_names)
    n_samples = data.shape[1]
    print(f"[HUMAN_MTL] Created RawArray with {n_channels} channels, {n_samples} samples, sfreq={sfreq:.1f} Hz")

    return raw, coords_mm, labels


def generate_ecog_brain_snapshots(raw, hotspots, file_path, upload_dir, uploadId,
                                   electrode_coords_mm=None, electrode_labels=None):
    """
    Generate 3D brain snapshots with electrodes and highlighted hotspots using MNE.

    This function creates 4 standard 3D views of the brain with electrode positions overlaid.
    Hotspot electrodes are highlighted with larger red markers.

    Args:
        raw: MNE Raw object (preprocessed ECoG data)
        hotspots: List of hotspot dicts with 'channel' and 'confidence' keys
        file_path: Original iEEG file path (used to locate BIDS metadata if coords not provided)
        upload_dir: Directory to save output files
        uploadId: Unique ID for this upload (for Cloudinary folder naming)
        electrode_coords_mm: Optional np.ndarray (n_channels, 3) - MNI coordinates in mm
                            If provided, uses these instead of BIDS loader
        electrode_labels: Optional List[str] - electrode labels matching coords
                         Required if electrode_coords_mm is provided

    Returns:
        dict: brainViews with keys like 'left_lateral', 'right_lateral', 'top', 'anterior'
              mapping to Cloudinary URLs. Returns {} if visualization fails (non-fatal)

    Strategy:
        1. If electrode_coords_mm provided: Use explicit coordinates (HUMAN_MTL mode)
        2. Otherwise: Load electrode positions from BIDS electrodes.tsv (EPILEPSY_ECOG mode)
        3. Create montage from electrode positions
        4. Use MNE's plot_sensors with kind='3d' or plot_alignment
        5. Generate 4 standard views: left lateral, right lateral, superior (top), anterior
        6. Highlight hotspot channels with different colors/sizes
        7. Save as PNGs and upload to Cloudinary
    """
    try:
        print(f"[BRAIN_SNAPSHOTS] Generating 3D brain snapshots for {len(hotspots)} hotspots")

        # ====================================================================
        # Step 1: Get electrode positions (explicit coords or BIDS)
        # ====================================================================
        # TASK 5: Support explicit coordinates
        if electrode_coords_mm is not None and electrode_labels is not None:
            # Use explicit coordinates (HUMAN_MTL mode)
            print(f"[BRAIN_SNAPSHOTS] Using explicit MNI coordinates ({electrode_coords_mm.shape[0]} electrodes)")
            electrode_positions = {}
            for label, coords in zip(electrode_labels, electrode_coords_mm):
                electrode_positions[label] = tuple(coords)  # (x, y, z) in mm
        else:
            # Fall back to BIDS loader (EPILEPSY_ECOG mode)
            electrode_positions = load_electrode_positions_from_bids(file_path)

        if not electrode_positions:
            print(f"[BRAIN_SNAPSHOTS] WARNING: No electrode positions found, cannot generate brain views")
            return {}

        print(f"[BRAIN_SNAPSHOTS] Loaded {len(electrode_positions)} electrode positions")

        # ====================================================================
        # Step 2: Create MNE montage from electrode positions
        # ====================================================================
        # Convert electrode positions to MNE format
        # MNE expects positions in meters, BIDS typically uses mm
        ch_names = []
        ch_pos = []

        for ch_name, (x, y, z) in electrode_positions.items():
            ch_names.append(ch_name)
            # Convert mm to meters for MNE
            ch_pos.append([x / 1000.0, y / 1000.0, z / 1000.0])

        # Create montage
        montage = mne.channels.make_dig_montage(
            ch_pos=dict(zip(ch_names, ch_pos)),
            coord_frame='head'  # or 'mri' depending on coordsystem
        )

        # Create a copy of raw to set montage
        raw_copy = raw.copy()

        # Match channel names (handle $ prefix variations)
        montage_ch_names = set(ch_names)
        raw_ch_names = set(raw_copy.ch_names)

        # Find matching channels
        matching_channels = []
        for raw_ch in raw_ch_names:
            # Try exact match
            if raw_ch in montage_ch_names:
                matching_channels.append(raw_ch)
            else:
                # Try without $ prefix
                clean_ch = raw_ch.lstrip('$')
                if clean_ch in montage_ch_names:
                    matching_channels.append(raw_ch)

        if not matching_channels:
            print(f"[BRAIN_SNAPSHOTS] WARNING: No matching channels between raw data and montage")
            return {}

        print(f"[BRAIN_SNAPSHOTS] Matched {len(matching_channels)} channels to montage")

        # Pick only channels with positions
        raw_copy.pick_channels(matching_channels, ordered=False)
        raw_copy.set_montage(montage)

        # ====================================================================
        # Step 3: Identify hotspot channel indices for highlighting
        # ====================================================================
        hotspot_channels = [hs.get('channel') for hs in hotspots if hs.get('channel')]
        print(f"[BRAIN_SNAPSHOTS] Hotspot channels: {hotspot_channels}")

        # ====================================================================
        # Step 4: Generate brain snapshots using MNE
        # ====================================================================
        # Create output directory
        fig_dir = os.path.join(upload_dir, "figures")
        os.makedirs(fig_dir, exist_ok=True)

        brain_views = {}

        # Configure matplotlib for offscreen rendering
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt

        # Define 4 standard 3D views
        # Format: (view_name, title, {"elev": elevation, "azim": azimuth})
        views_to_create = [
            ("left_lateral",  "Left Lateral View - ECoG Electrodes",  {"elev": 0,  "azim": -90}),
            ("right_lateral", "Right Lateral View - ECoG Electrodes", {"elev": 0,  "azim": 90}),
            ("top",           "Superior View - ECoG Electrodes",      {"elev": 90, "azim": 0}),
            ("anterior",      "Anterior View - ECoG Electrodes",      {"elev": 0,  "azim": 180}),
        ]

        for view_name, title, view_params in views_to_create:
            try:
                print(f"[BRAIN_SNAPSHOTS] View {view_name}: elev={view_params['elev']}, azim={view_params['azim']}")

                fig = plt.figure(figsize=(10, 8))
                ax = fig.add_subplot(111, projection='3d')

                # Plot sensors
                fig_mne = mne.viz.plot_sensors(
                    raw_copy.info,
                    kind='3d',
                    show_names=True,
                    axes=ax,
                    show=False
                )

                # Set view angle
                ax.view_init(elev=view_params['elev'], azim=view_params['azim'])

                # Highlight hotspots by replotting them with different colors
                # Get sensor positions
                pos = np.array([raw_copy.info['chs'][i]['loc'][:3] for i in range(len(raw_copy.ch_names))])

                # Find hotspot indices
                hotspot_indices = []
                for hs_ch in hotspot_channels:
                    try:
                        idx = raw_copy.ch_names.index(hs_ch)
                        hotspot_indices.append(idx)
                    except ValueError:
                        # Try without $ prefix
                        clean_ch = hs_ch.lstrip('$')
                        for i, ch in enumerate(raw_copy.ch_names):
                            if ch.lstrip('$') == clean_ch:
                                hotspot_indices.append(i)
                                break

                # Overlay hotspots with red markers
                if hotspot_indices:
                    hotspot_pos = pos[hotspot_indices]
                    ax.scatter(
                        hotspot_pos[:, 0],
                        hotspot_pos[:, 1],
                        hotspot_pos[:, 2],
                        c='red',
                        s=200,
                        marker='o',
                        edgecolors='darkred',
                        linewidths=2,
                        alpha=0.8,
                        label='Hotspots'
                    )
                    ax.legend()

                ax.set_title(title, fontsize=14, fontweight='bold')

                # Save figure
                fig_path = os.path.join(fig_dir, f'brain_{view_name}.png')
                plt.savefig(fig_path, dpi=150, bbox_inches='tight', facecolor='white')
                plt.close(fig)

                print(f"[BRAIN_SNAPSHOTS] ✓ Saved {view_name} view: {fig_path}")

                # Upload to Cloudinary
                try:
                    result = uploader.upload(
                        fig_path,
                        folder=f"{uploadId}/brain_views",
                        public_id=f'brain_{view_name}.png'
                    )
                    brain_views[view_name] = result['secure_url']
                    print(f"[BRAIN_SNAPSHOTS] ✓ Uploaded {view_name} view to Cloudinary")
                except Exception as upload_err:
                    print(f"[BRAIN_SNAPSHOTS] WARNING: Cloudinary upload failed for {view_name}: {upload_err}")

            except Exception as view_err:
                print(f"[BRAIN_SNAPSHOTS] WARNING: Failed to create {view_name} view: {view_err}")
                continue

        if brain_views:
            print(f"[BRAIN_SNAPSHOTS] ✓ Generated {len(brain_views)} brain view(s): {list(brain_views.keys())}")
        else:
            print(f"[BRAIN_SNAPSHOTS] WARNING: No brain views were successfully generated")

        return brain_views

    except Exception as e:
        print(f"[BRAIN_SNAPSHOTS] ERROR: Brain snapshot generation failed: {e}")
        import traceback
        traceback.print_exc()
        return {}


def create_ecog_visualizations(raw, activity, upload_dir, uploadId):
    """
    Create visualizations for ECoG data.

    IMPORTANT BEHAVIOR - Best-Effort Upload Strategy:
    - ECoG visualization upload is "best-effort" only
    - If Cloudinary upload fails (e.g., HTTP 413 - file too large), we gracefully
      fall back to None/empty values rather than crashing the pipeline
    - The critical data (summary, hotspots) is ALWAYS passed to Node backend
    - Images are optional; analysis should never fail due to Cloudinary issues

    Since we can't use ConvDip or brain3d(), create:
    1. Simple activity bar chart (lightweight, small file size)
    2. No .mat file upload for ECoG (currently disabled to avoid 413 errors)
    3. No additional brain view images (to keep upload minimal)

    Args:
        raw: MNE Raw object
        activity: np.array (n_channels,) normalized activity
        upload_dir: Directory to save files
        uploadId: Unique ID for this upload

    Returns:
        tuple: (figUrl, matUrl, images)
            - figUrl: Cloudinary URL to main figure (or None if upload failed)
            - matUrl: Always None for ECoG (mat upload disabled)
            - images: List with single image URL (or empty list if upload failed)
    """
    # Initialize return values (fallback defaults)
    figUrl = None
    matUrl = None  # Mat upload disabled for ECoG to avoid 413 errors
    images = []

    try:
        # Create directories
        fig_path = os.path.join(upload_dir, "figures")
        os.makedirs(fig_path, exist_ok=True)

        # ===== Figure 1: Activity bar chart (SMALL & LIGHTWEIGHT) =====
        fig_name = os.path.join(fig_path, 'ECoG_activity.png')

        # Use smaller figure size and lower DPI to keep file size small
        plt.figure(figsize=(6, 4))
        top_n = min(20, len(activity))
        top_indices = np.argsort(activity)[-top_n:][::-1]
        top_channels = [raw.ch_names[i] for i in top_indices]
        top_activity = [activity[i] for i in top_indices]

        plt.barh(range(len(top_channels)), top_activity, color='teal')
        plt.yticks(range(len(top_channels)), top_channels, fontsize=8)
        plt.xlabel('Normalized Activity', fontsize=9)
        plt.ylabel('Electrode', fontsize=9)
        plt.title('Top 20 Most Active Electrodes', fontsize=10)
        plt.tight_layout()
        plt.savefig(fig_name, dpi=100, bbox_inches='tight')  # Lower DPI for smaller file
        plt.close()

        print(f"[EPILEPSY_ECOG] Created activity plot: {fig_name}")

        # ===== Best-Effort Cloudinary Upload =====
        try:
            # Try to upload the PNG
            figure_result = uploader.upload(
                fig_name,
                folder=f"{uploadId}/figures",
                public_id='ECoG_activity.png'
            )
            figUrl = figure_result['secure_url']
            images = [figUrl]  # Single image for now
            print(f"[EPILEPSY_ECOG] ✓ Successfully uploaded activity plot to Cloudinary")

        except Exception as upload_error:
            # Cloudinary upload failed (e.g., 413 Request Entity Too Large)
            print(f"[EPILEPSY_ECOG] WARNING: Cloudinary upload failed: {upload_error}")
            print(f"[EPILEPSY_ECOG] Falling back to local-only analysis (no images uploaded)")
            # Keep figUrl=None, matUrl=None, images=[]
            # Don't re-raise - continue with analysis

        # NOTE: .mat file upload is DISABLED for ECoG to avoid 413 errors
        # If needed in future, add similar try/except wrapper
        # For now, matUrl stays None

        print(f"[EPILEPSY_ECOG] Visualization step complete (figUrl: {figUrl is not None})")
        return figUrl, matUrl, images

    except Exception as e:
        # Catch any other errors in visualization creation
        print(f"[EPILEPSY_ECOG] WARNING: Failed to create ECoG visualizations: {e}")
        import traceback
        traceback.print_exc()
        # Return safe defaults rather than crashing
        return None, None, []


def process_epilepsy_ecog(file_path, uploadId, patientId, upload_dir):
    """
    Main pipeline for EPILEPSY_ECOG mode.

    CRITICAL DESIGN PRINCIPLE:
    - This pipeline MUST NEVER fail just because Cloudinary rejects uploads
    - Even if images/mat cannot be uploaded, we ALWAYS:
      1. Complete the signal processing analysis
      2. Generate summary and hotspots
      3. POST to Node backend to mark study as COMPLETED
    - Cloudinary failures are logged as warnings, not fatal errors

    NEW: MNE BRAIN SNAPSHOTS
    - Loads electrode 3D positions from BIDS electrodes.tsv
    - Generates 3D brain view images using MNE
    - Highlights hotspot electrodes in visualizations
    - Uploads images to Cloudinary

    Args:
        file_path: Path to ECoG data file
        uploadId: Unique ID for this upload
        patientId: Patient ID
        upload_dir: Directory to save outputs

    Returns:
        request: dict ready to POST to Node backend, including:
            - summary: str (localization text)
            - hotspots: list[dict] (channel-level hotspots with coords)
            - brainViews: dict (MNE-generated 3D brain snapshots {view_name: url})
    """
    try:
        print(f"[PIPELINE] Mode: EPILEPSY_ECOG")
        print(f"[EPILEPSY_ECOG] Processing file: {file_path}")

        # Step 1: Load and preprocess
        raw, annotations = data_preprocessing_ecog(file_path)

        # Step 2: Select activity window
        tmin, tmax = select_activity_window(raw, annotations, window_duration=2.0)

        # Step 3: Compute electrode activity
        activity = compute_electrode_activity(raw, tmin, tmax)
        print(f"[EPILEPSY_ECOG] Top 5 active channels:")
        top5 = np.argsort(activity)[-5:][::-1]
        for i, idx in enumerate(top5):
            print(f"  {i+1}. {raw.ch_names[idx]}: {activity[idx]:.3f}")

        # Step 4: Load electrode positions from BIDS dataset
        print(f"[EPILEPSY_ECOG] Loading electrode 3D positions from BIDS metadata...")
        electrode_positions = load_electrode_positions_from_bids(file_path)

        if electrode_positions:
            print(f"[EPILEPSY_ECOG] ✓ Loaded {len(electrode_positions)} electrode positions")
        else:
            print(f"[EPILEPSY_ECOG] ⚠ No electrode positions found, using fallback (0,0,0) coordinates")

        # Step 5: Generate summary and hotspots
        summary, hotspots = compute_ecog_summary(raw, activity, electrode_positions, n_top=3)
        print(f"[EPILEPSY_ECOG] Summary: {summary}")
        print(f"[EPILEPSY_ECOG] Hotspots: {len(hotspots)} detected")

        # Step 6: Generate 3D brain snapshots with electrodes + highlighted hotspots
        print(f"[EPILEPSY_ECOG] Generating 3D brain snapshots...")
        brainViews = generate_ecog_brain_snapshots(
            raw=raw,
            hotspots=hotspots,
            file_path=file_path,
            upload_dir=upload_dir,
            uploadId=uploadId
        )

        if brainViews:
            print(f"[EPILEPSY_ECOG] ✓ Generated {len(brainViews)} brain view(s): {list(brainViews.keys())}")
        else:
            print(f"[EPILEPSY_ECOG] ⚠ No brain views generated (electrodes.tsv may be missing or rendering failed)")

        # Step 7: Create activity visualizations (BEST-EFFORT, non-blocking)
        figUrl = None
        matUrl = None
        images = []

        try:
            figUrl, matUrl, images = create_ecog_visualizations(raw, activity, upload_dir, uploadId)
        except Exception as viz_error:
            # Visualization failed, but we continue with analysis
            print(f"[EPILEPSY_ECOG] WARNING: Visualization upload failed, continuing with summary + hotspots only: {viz_error}")
            # figUrl, matUrl, images remain None/empty - that's OK

        # Step 8: Prepare metadata
        metadata = {
            "modelVersion": "ECoG-Activity-1.0",
            "mneVersion": mne.__version__
        }

        # Step 9: Assemble request (ALWAYS includes summary + hotspots + brainViews, images optional)
        request = {
            "patientId": patientId,
            "uploadId": uploadId,
            "figUrl": figUrl,      # May be None if Cloudinary failed
            "matUrl": matUrl,      # May be None if Cloudinary failed
            "images": images,      # May be [] if Cloudinary failed
            "metadata": metadata,
            "summary": summary,    # ALWAYS present
            "hotspots": hotspots,  # ALWAYS present
            "brainViews": brainViews  # NEW: MNE-generated 3D brain snapshots (dict of view_name: url)
        }

        print(f"[EPILEPSY_ECOG] Pipeline complete!")
        print(f"[EPILEPSY_ECOG] ✓ Analysis: summary={summary is not None}, hotspots={len(hotspots)}")
        print(f"[EPILEPSY_ECOG] ✓ Brain views: {len(brainViews)}")
        print(f"[EPILEPSY_ECOG] ✓ Activity images: {len(images) > 0}")

        return request

    except Exception as e:
        print(f"[ERROR] EPILEPSY_ECOG pipeline failed critically: {e}")
        import traceback
        traceback.print_exc()
        raise


# ============================================================================
# TASK 4: Human MTL Processing Pipeline
# ============================================================================

def save_webgl_overlay_json(
    upload_dir: str,
    uploadId: str,
    coords_mm,
    labels,
    activity,
    hotspots,
):
    """
    Create a JSON overlay file for a WebGL 3D brain viewer with enhanced metadata.

    COORDINATE SYSTEM DOCUMENTATION:
    --------------------------------
    Input (MNI RAS, mm):
      - coords_mm: MNI coordinates in millimeters
      - X-axis: Right (+) / Left (-)
      - Y-axis: Anterior (+) / Posterior (-)
      - Z-axis: Superior (+) / Inferior (-)
      - Units: millimeters (mm)

    Output JSON:
      - Contains explicit metadata for coordinate transformation
      - Electrode types (depth/grid/strip) with shaft grouping
      - mniToScene transform documentation

    Args:
        upload_dir: Base upload directory (already used for figures).
        uploadId: Unique ID of this upload/study.
        coords_mm: (n_channels, 3) array of MNI coordinates in millimeters.
        labels: List of channel labels, same length as coords_mm.
        activity: (n_channels,) array of activity values (e.g. RMS or z-scores).
        hotspots: List of hotspot dicts (each should contain at least 'channel' and 'confidence').

    Returns:
        dict with:
            {
              "overlay_path": "<local path to overlay.json>",
              "overlay_url": "<URL to access overlay.json or None>"
            }
    """
    try:
        import json
        import os
        import numpy as np
        import re

        # Create webgl subdirectory
        webgl_dir = os.path.join(upload_dir, uploadId, "webgl")
        os.makedirs(webgl_dir, exist_ok=True)

        overlay_path = os.path.join(webgl_dir, "overlay.json")

        # Normalize activity to [0, 1]
        activity_arr = np.array(activity)
        min_val = np.min(activity_arr)
        max_val = np.max(activity_arr)

        if max_val - min_val > 1e-10:  # Avoid division by zero
            normalized_activity = (activity_arr - min_val) / (max_val - min_val)
        else:
            # All values are the same
            normalized_activity = np.ones_like(activity_arr) * 0.5

        print(f"[WEBGL_OVERLAY] Normalized activity range: min={np.min(normalized_activity):.3f}, max={np.max(normalized_activity):.3f}")

        # Extract hotspot labels set for quick lookup
        hotspot_labels_set = {hs.get("channel", "") for hs in hotspots if "channel" in hs}
        print(f"[WEBGL_OVERLAY] Hotspot labels: {list(hotspot_labels_set)}")

        # ====================================================================
        # TASK A & B: Build enhanced electrodes list with type and shaft info
        # ====================================================================
        electrodes = []
        shaft_groups = {}  # Track contact indices per shaft

        for i, (label, coord, value) in enumerate(zip(labels, coords_mm, normalized_activity)):
            # Extract shaft ID from label (e.g., "mPHL1" -> "mPHL")
            # Assumes labels follow pattern: <prefix><number>
            match = re.match(r'^([a-zA-Z]+)(\d+)$', label)
            if match:
                shaft_id = match.group(1)
                contact_number = int(match.group(2))
            else:
                # Fallback: use full label as shaft_id
                shaft_id = label
                contact_number = 0

            # Track contact index within shaft
            if shaft_id not in shaft_groups:
                shaft_groups[shaft_id] = []
            shaft_groups[shaft_id].append(contact_number)
            contact_index = len(shaft_groups[shaft_id]) - 1

            # All Human MTL electrodes are depth electrodes (SEEG)
            electrode_type = "depth"

            # Build electrode entry with enhanced metadata
            electrode_entry = {
                "label": label,
                "coord_mni_mm": [float(coord[0]), float(coord[1]), float(coord[2])],
                "activity": float(value),
                "isHotspot": label in hotspot_labels_set,
                "type": electrode_type,
                "shaftId": shaft_id,
                "contactIndex": contact_index
            }

            electrodes.append(electrode_entry)

        print(f"[WEBGL_OVERLAY] Identified {len(shaft_groups)} electrode shafts")

        # ====================================================================
        # TASK A: Build coordinate transform metadata
        # ====================================================================
        # Document the transformation from MNI mm to Three.js scene coordinates
        # This matches the implementation in BrainWebGLViewer.jsx:
        #
        # MNI (mm) → Scene transform:
        #   scale = 0.01 (1mm = 0.01 scene units)
        #   X_scene = X_mni * scale  (Right stays Right)
        #   Y_scene = Z_mni * scale  (Superior becomes Up)
        #   Z_scene = -Y_mni * scale (Anterior becomes Backward)
        #
        # This can be represented as:
        #   [X_scene]   [scale    0       0    ] [X_mni]
        #   [Y_scene] = [0        0       scale] [Y_mni]
        #   [Z_scene]   [0      -scale    0    ] [Z_mni]

        mni_to_scene_transform = {
            "description": "Linear transform from MNI RAS (mm) to Three.js scene coordinates",
            "scale": 0.01,
            "matrix": [
                [0.01,  0.00,  0.00],  # X_scene = X_mni * 0.01
                [0.00,  0.00,  0.01],  # Y_scene = Z_mni * 0.01
                [0.00, -0.01,  0.00]   # Z_scene = -Y_mni * 0.01
            ],
            "notes": [
                "MNI: X=Right, Y=Anterior, Z=Superior",
                "Three.js: X=Right, Y=Up, Z=Backward",
                "Apply: scene_pos = matrix @ mni_pos (element-wise)"
            ]
        }

        # Build overlay JSON structure with enhanced metadata
        overlay_data = {
            "space": "MNI",
            "units": "mm",
            "uploadId": uploadId,
            "electrodes": electrodes,
            "hotspots": list(hotspot_labels_set),
            "mniToScene": mni_to_scene_transform,
            "meta": {
                "nElectrodes": len(electrodes),
                "nShafts": len(shaft_groups),
                "nHotspots": len(hotspot_labels_set),
                "activityRange": {
                    "min": float(min_val),
                    "max": float(max_val),
                    "normalized": True
                }
            }
        }

        # Save JSON file
        with open(overlay_path, 'w') as f:
            json.dump(overlay_data, f, indent=2)

        print(f"[WEBGL_OVERLAY] ✓ Saved overlay JSON to: {overlay_path}")
        print(f"[WEBGL_OVERLAY] ✓ Electrodes: {len(electrodes)} total, {len(shaft_groups)} shafts")

        # Upload to Cloudinary as raw resource
        overlay_url = None
        try:
            from cloudinary import uploader
            upload_result = uploader.upload(
                overlay_path,
                folder=f"{uploadId}/webgl",
                public_id="overlay",
                resource_type="raw"  # Important: JSON is a raw file, not an image
            )
            overlay_url = upload_result['secure_url']
            print(f"[WEBGL_OVERLAY] ✓ Uploaded overlay to Cloudinary: {overlay_url}")
        except Exception as upload_err:
            print(f"[WEBGL_OVERLAY] WARNING: Cloudinary upload failed: {upload_err}")
            print(f"[WEBGL_OVERLAY] Continuing with local path only (overlay_url=None)")
            # Non-fatal - continue with overlay_url=None

        return {
            "overlay_path": overlay_path,
            "overlay_url": overlay_url
        }

    except Exception as e:
        print(f"[WEBGL_OVERLAY] ERROR: Failed to create overlay JSON: {e}")
        import traceback
        traceback.print_exc()
        return {}


def process_human_mtl_dataset(file_path, uploadId, patientId, upload_dir, basePath=None, historic=None):
    """
    Main pipeline for HUMAN_MTL mode (Human MTL Units WM dataset).

    This pipeline processes .h5 files from the Boran et al. Human MTL Units WM dataset,
    which includes MNI electrode coordinates and iEEG data.

    Strategy:
        1. Load .h5 file using human_mtl_to_mne_raw()
        2. Run preprocessing & activity analysis (reuse existing functions)
        3. Compute hotspots
        4. Generate MNE brain snapshots with explicit MNI coordinates
        5. Return request dict for Node backend

    Args:
        file_path: Path to .h5 file
        uploadId: Unique ID for this upload
        patientId: Patient ID
        upload_dir: Directory to save outputs
        basePath: Root path (unused, for compatibility)
        historic: Historic flag (unused, for compatibility)

    Returns:
        request: dict ready to POST to Node backend, including:
            - summary: str (localization text)
            - hotspots: list[dict] (channel-level hotspots with coords)
            - brainViews: dict (MNE-generated 3D brain snapshots {view_name: url})
    """
    try:
        print(f"[HUMAN_MTL] ========================================")
        print(f"[HUMAN_MTL] Processing Human MTL Units WM dataset")
        print(f"[HUMAN_MTL] File: {file_path}")
        print(f"[HUMAN_MTL] ========================================")

        # ====================================================================
        # Step 1: Load .h5 file and create MNE Raw object
        # ====================================================================
        raw, coords_mm, labels = human_mtl_to_mne_raw(file_path)

        # ====================================================================
        # Step 2: Preprocessing (minimal - data is already clean)
        # ====================================================================
        print(f"[HUMAN_MTL] Preprocessing...")

        # Basic filtering (if needed)
        try:
            # Apply high-pass filter to remove slow drifts
            raw_filtered = raw.copy().filter(l_freq=0.5, h_freq=None, verbose=False)
            print(f"[HUMAN_MTL] ✓ Applied 0.5 Hz high-pass filter")
        except Exception as e:
            print(f"[HUMAN_MTL] WARNING: Filtering failed, using raw data: {e}")
            raw_filtered = raw

        # ====================================================================
        # Step 3: Select activity window
        # ====================================================================
        # For Human MTL dataset, use the entire trial (already short ~1-2s)
        tmin = 0.0
        tmax = min(raw_filtered.times[-1], 2.0)  # Use max 2 seconds
        print(f"[HUMAN_MTL] Using time window: {tmin:.2f} - {tmax:.2f} s")

        # ====================================================================
        # Step 4: Compute electrode activity
        # ====================================================================
        print(f"[HUMAN_MTL] Computing electrode activity...")
        activity = compute_electrode_activity(raw_filtered, tmin, tmax)

        print(f"[HUMAN_MTL] Top 5 active channels:")
        top5 = np.argsort(activity)[-5:][::-1]
        for i, idx in enumerate(top5):
            print(f"  {i+1}. {raw_filtered.ch_names[idx]}: {activity[idx]:.3f}")

        # ====================================================================
        # Step 5: Compute hotspots (with MNI coordinates)
        # ====================================================================
        print(f"[HUMAN_MTL] Computing hotspots...")

        # Convert coords_mm and labels to electrode_positions dict
        electrode_positions = {}
        for label, coords in zip(labels, coords_mm):
            electrode_positions[label] = tuple(coords)  # (x, y, z) in mm

        summary, hotspots = compute_ecog_summary(
            raw_filtered, activity, electrode_positions, n_top=5
        )

        print(f"[HUMAN_MTL] Summary: {summary}")
        print(f"[HUMAN_MTL] Hotspots: {len(hotspots)} detected")
        for i, hs in enumerate(hotspots):
            print(f"  [{i+1}] {hs['channel']} - confidence: {hs['confidence']:.3f}")

        # ====================================================================
        # Step 6: Generate MNE brain snapshots with MNI coordinates (4 standard views)
        # ====================================================================
        print(f"[HUMAN_MTL] Generating 3D brain snapshots (4 standard views)...")
        brainViews = generate_ecog_brain_snapshots(
            raw=raw_filtered,
            hotspots=hotspots,
            file_path=file_path,
            upload_dir=upload_dir,
            uploadId=uploadId,
            electrode_coords_mm=coords_mm,  # Pass explicit coordinates
            electrode_labels=labels          # Pass labels
        )

        if brainViews:
            print(f"[HUMAN_MTL] ✓ Generated {len(brainViews)} brain view(s): {list(brainViews.keys())}")
        else:
            print(f"[HUMAN_MTL] ⚠ No brain views generated")

        # ====================================================================
        # Step 7: Generate activity plot (optional)
        # ====================================================================
        # For now, skip activity plot generation (can add later if needed)
        figUrl = None
        matUrl = None
        images = []

        # ====================================================================
        # Step 7.5: Create WebGL overlay JSON for interactive 3D viewer
        # ====================================================================
        print(f"[HUMAN_MTL] Generating WebGL overlay JSON...")
        webgl_overlay_info = {}
        try:
            webgl_overlay_info = save_webgl_overlay_json(
                upload_dir=upload_dir,
                uploadId=uploadId,
                coords_mm=coords_mm,      # MNI mm coords from HUMAN_MTL loader
                labels=labels,            # electrode labels
                activity=activity,        # electrode activity values
                hotspots=hotspots,
            )
            if webgl_overlay_info.get("overlay_path"):
                print(f"[HUMAN_MTL] ✓ WebGL overlay JSON created at: {webgl_overlay_info['overlay_path']}")
            if webgl_overlay_info.get("overlay_url"):
                print(f"[HUMAN_MTL] ✓ WebGL overlay URL: {webgl_overlay_info['overlay_url']}")
            else:
                print(f"[HUMAN_MTL] WebGL overlay URL: None (Cloudinary upload may have failed)")
        except Exception as e:
            print(f"[HUMAN_MTL] WARNING: Failed to generate WebGL overlay JSON: {e}")
            webgl_overlay_info = {}

        webgl_overlay_url = webgl_overlay_info.get("overlay_url")
        print(f"[HUMAN_MTL] Final webglOverlayUrl for payload: {webgl_overlay_url}")

        # ====================================================================
        # Step 8: Prepare metadata
        # ====================================================================
        import mne
        metadata = {
            "modelVersion": "Human-MTL-Activity-1.0",
            "mneVersion": mne.__version__,
            "datasetSource": "Human MTL Units WM (Boran et al. 2019)",
            "nElectrodes": len(labels),
            "samplingFreq": raw.info['sfreq']
        }

        # ====================================================================
        # Step 9: Build request for Node backend
        # ====================================================================
        request = {
            "patientId": patientId,
            "uploadId": uploadId,
            "figUrl": figUrl,
            "matUrl": matUrl,
            "images": images,
            "metadata": metadata,
            "summary": summary,
            "hotspots": hotspots,
            "brainViews": brainViews,
            "webglOverlayUrl": webgl_overlay_url  # NEW: WebGL overlay JSON URL (or None)
        }

        print(f"[HUMAN_MTL] Pipeline complete!")
        print(f"[HUMAN_MTL] ✓ Analysis: summary={summary is not None}, hotspots={len(hotspots)}")
        print(f"[HUMAN_MTL] ✓ Brain views: {len(brainViews)}")
        print(f"[HUMAN_MTL] ========================================")

        return request

    except Exception as e:
        print(f"[ERROR] HUMAN_MTL pipeline failed critically: {e}")
        import traceback
        traceback.print_exc()
        raise
