# Testing Guide: 4-View Brain Visualization

This document describes how to test the enhanced 4-view brain visualization system for the HUMAN_MTL pipeline.

---

## Overview

The HUMAN_MTL pipeline now generates **4 standard 3D views** instead of 2:

1. **Left Lateral View** - Side view from the left (azimuth = -90°, elevation = 0°)
2. **Right Lateral View** - Side view from the right (azimuth = 90°, elevation = 0°)
3. **Superior (Top) View** - View from above (azimuth = 0°, elevation = 90°)
4. **Anterior View** - Front view (azimuth = 180°, elevation = 0°)

Each view shows:
- All electrodes as semi-transparent markers
- Hotspot electrodes highlighted in **red** with larger markers
- MNE coordinate frame with axes

---

## Test 1: HUMAN_MTL Pipeline (Python)

### Prerequisites

1. Conda environment `brain` is activated
2. H5 data file exists: `datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5`
3. Backend is running on `http://localhost:3000`

### Command

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm

# Activate conda environment
conda activate brain

# Run HUMAN_MTL pipeline
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId 69327ccdcefcdacb1eb274de \
  --uploadId human-mtl-4views-test \
  --historic False
```

### Expected Console Output

Look for these key log lines:

```
[PIPELINE] Detecting processing mode from file: datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5
[PIPELINE] Mode: HUMAN_MTL (Human MTL Units WM .h5)
[HUMAN_MTL] ========================================
[HUMAN_MTL] Processing Human MTL Units WM dataset
[HUMAN_MTL] Loaded <N> electrode MNI coordinates
[HUMAN_MTL] Electrode labels (first 5): ['mAHL1', 'mAHL2', ...]
[HUMAN_MTL] Preprocessing...
[HUMAN_MTL] ✓ Applied 0.5 Hz high-pass filter
[HUMAN_MTL] Computing electrode activity...
[HUMAN_MTL] Computing hotspots...
[HUMAN_MTL] Hotspots: <N> detected
[HUMAN_MTL] Generating 3D brain snapshots (4 standard views)...
[BRAIN_SNAPSHOTS] Generating 3D brain snapshots for <N> hotspots
[BRAIN_SNAPSHOTS] Using explicit MNI coordinates (<N> electrodes)
[BRAIN_SNAPSHOTS] Loaded <N> electrode positions
[BRAIN_SNAPSHOTS] Matched <N> channels to montage
[BRAIN_SNAPSHOTS] Hotspot channels: ['mAHL42', 'mAHL13', ...]
[BRAIN_SNAPSHOTS] View left_lateral: elev=0, azim=-90
[BRAIN_SNAPSHOTS] ✓ Saved left_lateral view: uploads/human-mtl-4views-test/figures/brain_left_lateral.png
[BRAIN_SNAPSHOTS] ✓ Uploaded left_lateral view to Cloudinary
[BRAIN_SNAPSHOTS] View right_lateral: elev=0, azim=90
[BRAIN_SNAPSHOTS] ✓ Saved right_lateral view: uploads/human-mtl-4views-test/figures/brain_right_lateral.png
[BRAIN_SNAPSHOTS] ✓ Uploaded right_lateral view to Cloudinary
[BRAIN_SNAPSHOTS] View top: elev=90, azim=0
[BRAIN_SNAPSHOTS] ✓ Saved top view: uploads/human-mtl-4views-test/figures/brain_top.png
[BRAIN_SNAPSHOTS] ✓ Uploaded top view to Cloudinary
[BRAIN_SNAPSHOTS] View anterior: elev=0, azim=180
[BRAIN_SNAPSHOTS] ✓ Saved anterior view: uploads/human-mtl-4views-test/figures/brain_anterior.png
[BRAIN_SNAPSHOTS] ✓ Uploaded anterior view to Cloudinary
[BRAIN_SNAPSHOTS] ✓ Generated 4 brain view(s): ['left_lateral', 'right_lateral', 'top', 'anterior']
[HUMAN_MTL] ✓ Generated 4 brain view(s): ['left_lateral', 'right_lateral', 'top', 'anterior']
[HUMAN_MTL] ✓ Brain views: 4
[HUMAN_MTL] Pipeline complete!
[HUMAN_MTL] ✓ Analysis: summary=True, hotspots=<N>
[HUMAN_MTL] ✓ Brain views: 4
[HUMAN_MTL] ========================================
[HUMAN_MTL] Sending data to Node backend: http://localhost:3000/patients/upload
[HUMAN_MTL] Summary: High activity detected in <N> electrodes...
[HUMAN_MTL] Hotspots: <N>
[HUMAN_MTL] Brain views: 4
[HUMAN_MTL] ✓ Node backend callback successful!
[HUMAN_MTL] ✓ Response: {'success': True, 'message': '...'}
```

### Success Criteria

- ✅ Mode detected as `HUMAN_MTL`
- ✅ 4 views generated (left_lateral, right_lateral, top, anterior)
- ✅ All 4 views uploaded to Cloudinary successfully
- ✅ Node backend callback returns 200 OK
- ✅ Console shows: `[HUMAN_MTL] ✓ Brain views: 4`

---

## Test 2: Backend + Frontend Integration

### Start Services

**Terminal 1 - Backend:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Backend
npm start
```

**Terminal 2 - Python Pipeline:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
conda activate brain

python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId 69327ccdcefcdacb1eb274de \
  --uploadId human-mtl-4views-test \
  --historic False
```

**Terminal 3 - Frontend:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Frontend
npm run dev
```

### Browser Testing

1. **Open the application:**
   ```
   http://localhost:5173
   ```

2. **Navigate to patient:**
   - Click on patient with ID: `69327ccdcefcdacb1eb274de`
   - Or search for the patient by name

3. **Verify study badge:**
   - Find the study with uploadId: `human-mtl-4views-test`
   - Verify badge shows: **"📍 3D Images Ready (4)"**

4. **Click into Brain View:**
   - Click "View 3D Brain" or similar button
   - Should navigate to the Brain component

5. **Verify 4 Tabs Exist:**
   - ✅ **Left Lateral View** (default selected)
   - ✅ **Right Lateral View**
   - ✅ **Superior (Top) View**
   - ✅ **Anterior View**

6. **Test Each Tab:**
   - Click each tab
   - Verify the image loads from Cloudinary
   - Verify each view shows electrodes
   - Verify hotspots are highlighted in **red**

7. **Verify Metadata Panel:**
   - Check the right sidebar shows:
     - "Brain Views: **4 available**"
   - Check hotspots list shows confidence scores
   - Check summary text displays correctly

### Success Criteria

- ✅ Badge shows "(4)" count
- ✅ 4 tabs visible in Brain view
- ✅ All 4 images load successfully
- ✅ Hotspots are highlighted in red in each view
- ✅ Tabs switch smoothly between views
- ✅ Metadata panel shows "4 available"

---

## Test 3: Regression Tests

### Test 3A: EPILEPSY_ECOG Mode (No Brain Views)

**Command:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
conda activate brain

# Run with a .edf or .vhdr file (if you have one)
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "path/to/ecog_file.edf" \
  --patientId <patient-id> \
  --uploadId ecog-regression-test \
  --historic False
```

**Expected:**
```
[PIPELINE] Mode: EPILEPSY_ECOG (file extension: .edf)
...
[BRAIN_SNAPSHOTS] WARNING: No electrode positions found, cannot generate brain views
[EPILEPSY_ECOG] ✓ Brain views: 0
```

**Success Criteria:**
- ✅ Pipeline completes without errors
- ✅ `brainViews: {}` sent to backend
- ✅ Frontend shows "No 3D Brain Images Available" message
- ✅ No badge appears on study card

### Test 3B: DEMO Mode (No Brain Views)

**Command:**
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
conda activate brain

# Run with a .fif file
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "path/to/sample_audvis-ave.fif" \
  --patientId <patient-id> \
  --uploadId demo-regression-test \
  --historic False
```

**Expected:**
```
[PIPELINE] Mode: DEMO (file extension: .fif)
...
```

**Success Criteria:**
- ✅ DEMO pipeline runs as before
- ✅ `brainViews: {}` in response
- ✅ No errors introduced by 4-view changes

---

## Test 4: Local File Verification

### Check Generated Files

After running the HUMAN_MTL pipeline, verify local files exist:

```bash
cd uploads/human-mtl-4views-test/figures

ls -lh brain_*.png
```

**Expected Output:**
```
-rw-r--r--  brain_anterior.png      (~300-500 KB)
-rw-r--r--  brain_left_lateral.png  (~300-500 KB)
-rw-r--r--  brain_right_lateral.png (~300-500 KB)
-rw-r--r--  brain_top.png           (~300-500 KB)
```

### Manually Inspect Images

Open each PNG file to verify:
- ✅ All electrodes are visible
- ✅ Hotspots are highlighted in red
- ✅ Each view shows a different camera angle
- ✅ Titles match the view type

---

## Test 5: Database Verification

### Check Backend Storage

If you have debug routes or direct DB access, verify the study document:

**Option A - Debug Route (if available):**
```bash
curl http://localhost:3000/debug/studies?uploadId=human-mtl-4views-test | jq '.brainViews'
```

**Expected Output:**
```json
{
  "left_lateral": "https://res.cloudinary.com/.../brain_left_lateral.png",
  "right_lateral": "https://res.cloudinary.com/.../brain_right_lateral.png",
  "top": "https://res.cloudinary.com/.../brain_top.png",
  "anterior": "https://res.cloudinary.com/.../brain_anterior.png"
}
```

**Option B - MongoDB Direct:**
```javascript
db.eegStudies.findOne({ uploadId: "human-mtl-4views-test" })
```

Check the `brainViews` field has 4 keys.

---

## Troubleshooting

### Issue: Only 2 views generated (left/right)

**Cause:** Using old code before 4-view enhancement

**Solution:**
- Pull latest changes
- Verify `helper.py` has 4 views in `views_to_create`

### Issue: Views not uploading to Cloudinary

**Cause:** Cloudinary credentials missing or incorrect

**Solution:**
- Check `.env` file has:
  ```
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```
- Verify credentials are valid

### Issue: Frontend shows "No 3D Brain Images Available"

**Possible Causes:**
1. Backend didn't receive brainViews
2. Study not found
3. uploadId mismatch

**Debug Steps:**
- Check browser console for errors
- Verify study exists in DB
- Check uploadId matches exactly

### Issue: Images load but hotspots not highlighted

**Cause:** Hotspot channel names don't match electrode labels

**Solution:**
- Check console logs for hotspot channels
- Verify they match the channel names in the raw data

---

## Performance Benchmarks

Expected processing times for HUMAN_MTL pipeline:

| Component | Time |
|-----------|------|
| Load H5 file | ~1-2s |
| Preprocessing | ~0.5s |
| Compute activity | ~0.2s |
| Generate 4 views | ~8-12s (2-3s per view) |
| Upload to Cloudinary | ~2-4s |
| **Total** | **~12-20s** |

---

## Summary Checklist

Before marking the 4-view enhancement as complete, verify:

- [ ] Python logs show all 4 views generated
- [ ] All 4 views uploaded to Cloudinary
- [ ] Backend stores 4 URLs in `brainViews`
- [ ] Frontend badge shows "(4)"
- [ ] Frontend displays 4 tabs
- [ ] All 4 images load correctly
- [ ] Hotspots visible in all views
- [ ] EPILEPSY_ECOG mode still works (0 views)
- [ ] DEMO mode still works (0 views)
- [ ] No new dependencies added
- [ ] No breaking changes to existing pipelines

---

**Last Updated:** December 9, 2025
**Version:** 4-View Enhancement v1.0
