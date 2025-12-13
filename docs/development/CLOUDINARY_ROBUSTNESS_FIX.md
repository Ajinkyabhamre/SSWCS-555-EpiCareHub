# Cloudinary Robustness Fix for EPILEPSY_ECOG Pipeline

**Date**: 2025-12-08
**Issue**: Cloudinary HTTP 413 (Request Entity Too Large) errors crash ECoG pipeline
**Solution**: Best-effort upload strategy with graceful fallback

---

## Problem Statement

When running the EPILEPSY_ECOG pipeline, Cloudinary upload was failing with:
```
[ERROR] Failed to create ECoG visualizations: Error parsing server response (413) ...
```

This caused the entire pipeline to crash BEFORE the Node backend callback, meaning:
- ❌ Study never marked as COMPLETED in database
- ❌ Summary and hotspots never saved
- ❌ Analysis results lost

---

## Solution Design

### Key Principle
**The ECoG pipeline MUST NEVER fail just because Cloudinary rejects uploads.**

Even if images/mat cannot be uploaded, the pipeline must:
1. ✅ Complete signal processing analysis
2. ✅ Generate summary and hotspots
3. ✅ POST to Node backend to mark study as COMPLETED
4. ✅ Log Cloudinary failures as warnings (not fatal errors)

---

## Changes Made

### 1. `create_ecog_visualizations()` (helper.py:972-1063)

**Before**:
- Created large PNG (12x6 inches, 150 DPI)
- Created and uploaded .mat file (very large - entire raw data array)
- Generated 11 placeholder brain view images
- Any Cloudinary failure → crash with exception

**After**:
- ✅ Creates **smaller PNG** (6x4 inches, 100 DPI) to reduce file size
- ✅ **Removed .mat upload** for ECoG (returns `matUrl = None`)
- ✅ **Removed 11 placeholder images** (returns single image or empty list)
- ✅ **Wrapped Cloudinary upload in try/except**:
  - If upload succeeds → return `figUrl` and `images = [figUrl]`
  - If upload fails (413 or any error) → return `None, None, []`
  - **Never re-raises exception**
- ✅ Added clear logging:
  ```
  [EPILEPSY_ECOG] WARNING: Cloudinary upload failed: <error>
  [EPILEPSY_ECOG] Falling back to local-only analysis (no images uploaded)
  ```

**Code Structure**:
```python
def create_ecog_visualizations(raw, activity, upload_dir, uploadId):
    # Initialize fallback defaults
    figUrl = None
    matUrl = None
    images = []

    try:
        # Create small PNG locally
        plt.figure(figsize=(6, 4))  # Smaller size
        # ... create plot ...
        plt.savefig(fig_name, dpi=100)  # Lower DPI

        # Best-effort Cloudinary upload
        try:
            figure_result = uploader.upload(fig_name, ...)
            figUrl = figure_result['secure_url']
            images = [figUrl]
            print("[EPILEPSY_ECOG] ✓ Successfully uploaded activity plot to Cloudinary")
        except Exception as upload_error:
            print(f"[EPILEPSY_ECOG] WARNING: Cloudinary upload failed: {upload_error}")
            # figUrl, matUrl, images remain None/empty
            # Don't re-raise

        return figUrl, matUrl, images

    except Exception as e:
        # Any other error in visualization
        print(f"[EPILEPSY_ECOG] WARNING: Failed to create ECoG visualizations: {e}")
        return None, None, []  # Safe defaults
```

### 2. `process_epilepsy_ecog()` (helper.py:1066-1153)

**Before**:
- Called `create_ecog_visualizations()` directly
- If it raised exception → crash entire pipeline

**After**:
- ✅ **Wrapped visualization call in try/except**:
  ```python
  figUrl = None
  matUrl = None
  images = []

  try:
      figUrl, matUrl, images = create_ecog_visualizations(...)
  except Exception as viz_error:
      print(f"[EPILEPSY_ECOG] WARNING: Visualization upload failed, continuing with summary + hotspots only: {viz_error}")
      # figUrl, matUrl, images remain None/empty - that's OK
  ```

- ✅ **Always assembles request dict** with summary + hotspots:
  ```python
  request = {
      "patientId": patientId,
      "uploadId": uploadId,
      "figUrl": figUrl,      # May be None if Cloudinary failed
      "matUrl": matUrl,      # May be None if Cloudinary failed
      "images": images,      # May be [] if Cloudinary failed
      "metadata": metadata,
      "summary": summary,    # ALWAYS present
      "hotspots": hotspots   # ALWAYS present
  }
  ```

- ✅ **Returns request dict** even if Cloudinary failed
- ✅ Added logging to show analysis success status:
  ```
  [EPILEPSY_ECOG] Pipeline complete!
  [EPILEPSY_ECOG] Analysis successful: summary=True, hotspots=3
  [EPILEPSY_ECOG] Images uploaded: False
  ```

### 3. Documentation (helper.py:976-981, 1070-1076)

Added clear docstring comments explaining the best-effort strategy:

**In `create_ecog_visualizations` docstring**:
```
IMPORTANT BEHAVIOR - Best-Effort Upload Strategy:
- ECoG visualization upload is "best-effort" only
- If Cloudinary upload fails (e.g., HTTP 413 - file too large), we gracefully
  fall back to None/empty values rather than crashing the pipeline
- The critical data (summary, hotspots) is ALWAYS passed to Node backend
- Images are optional; analysis should never fail due to Cloudinary issues
```

**In `process_epilepsy_ecog` docstring**:
```
CRITICAL DESIGN PRINCIPLE:
- This pipeline MUST NEVER fail just because Cloudinary rejects uploads
- Even if images/mat cannot be uploaded, we ALWAYS:
  1. Complete the signal processing analysis
  2. Generate summary and hotspots
  3. POST to Node backend to mark study as COMPLETED
- Cloudinary failures are logged as warnings, not fatal errors
```

---

## Files Changed

| File | Lines Modified | Description |
|------|---------------|-------------|
| `helper.py` | 972-1063 | `create_ecog_visualizations()` - smaller PNG, best-effort upload |
| `helper.py` | 1066-1153 | `process_epilepsy_ecog()` - wrapped viz call, always POST to Node |

**Total lines changed**: ~180 lines
**DEMO mode**: ✅ Unchanged (no impact on MEG pipeline)

---

## Expected Behavior After Fix

### Scenario 1: Cloudinary Upload Succeeds
```
[EPILEPSY_ECOG] Created activity plot: ./uploads/ecog-test-001/figures/ECoG_activity.png
[EPILEPSY_ECOG] ✓ Successfully uploaded activity plot to Cloudinary
[EPILEPSY_ECOG] Visualization step complete (figUrl: True)
[EPILEPSY_ECOG] Pipeline complete!
[EPILEPSY_ECOG] Analysis successful: summary=True, hotspots=3
[EPILEPSY_ECOG] Images uploaded: True
[EPILEPSY_ECOG] Sending data to Node backend: http://localhost:3000/patients/upload
[EPILEPSY_ECOG] ✓ Node backend callback successful!
```

Result:
- ✅ `figUrl` = Cloudinary URL
- ✅ `images` = [Cloudinary URL]
- ✅ `summary` and `hotspots` saved to database
- ✅ Study marked as COMPLETED

### Scenario 2: Cloudinary Upload Fails (413 or any error)
```
[EPILEPSY_ECOG] Created activity plot: ./uploads/ecog-test-001/figures/ECoG_activity.png
[EPILEPSY_ECOG] WARNING: Cloudinary upload failed: Error parsing server response (413) ...
[EPILEPSY_ECOG] Falling back to local-only analysis (no images uploaded)
[EPILEPSY_ECOG] Visualization step complete (figUrl: False)
[EPILEPSY_ECOG] Pipeline complete!
[EPILEPSY_ECOG] Analysis successful: summary=True, hotspots=3
[EPILEPSY_ECOG] Images uploaded: False
[EPILEPSY_ECOG] Sending data to Node backend: http://localhost:3000/patients/upload
[EPILEPSY_ECOG] ✓ Node backend callback successful!
```

Result:
- ⚠️ `figUrl` = None
- ⚠️ `images` = []
- ✅ `summary` and `hotspots` saved to database
- ✅ Study marked as COMPLETED
- 📁 PNG saved locally in `./uploads/ecog-test-001/figures/ECoG_activity.png`

---

## Benefits of This Approach

1. **Pipeline Never Crashes on Cloudinary Errors**
   - 413 errors are warnings, not fatal
   - Analysis always completes

2. **Critical Data Always Saved**
   - Summary and hotspots ALWAYS reach Node backend
   - Study ALWAYS marked as COMPLETED
   - Users see results even without images

3. **Graceful Degradation**
   - If Cloudinary works → full experience with images
   - If Cloudinary fails → analysis-only experience (no images)
   - Better than total failure

4. **Reduced File Size**
   - Smaller PNG (6x4 @ 100 DPI vs 12x6 @ 150 DPI)
   - No .mat upload (was uploading entire raw data array)
   - No 11 placeholder images
   - Less likely to hit 413 errors in future

5. **Clear Logging**
   - Easy to debug Cloudinary issues
   - Users/admins can see what succeeded/failed
   - Distinguishes between analysis failure vs upload failure

---

## Testing Recommendations

### Test 1: DEMO Mode Still Works
```bash
cd Localization-Algorithm
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file ~/mne_data/MNE-sample-data/MEG/sample/sample_audvis_raw.fif \
  --patientId test-patient \
  --uploadId demo-test \
  --historic False
```

**Expected**: Should work exactly as before (no changes to DEMO mode)

### Test 2: EPILEPSY_ECOG with Real Upload
```bash
cd Localization-Algorithm
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file ~/mne_data/MNE-epilepsy-ecog-data/sub-pt1/ses-presurgery/ieeg/sub-pt1_ses-presurgery_task-ictal_ieeg.vhdr \
  --patientId 69327ccdcefcdacb1eb274de \
  --uploadId ecog-test-002 \
  --historic False
```

**Expected**:
- If Cloudinary accepts smaller PNG → `figUrl` populated, `images` has 1 URL
- If Cloudinary still rejects → `figUrl` = None, `images` = [], but pipeline completes
- In BOTH cases → Node backend receives summary + hotspots, study marked COMPLETED

### Test 3: Verify Database
After test 2, check MongoDB:
```javascript
db.eegStudies.findOne({uploadId: "ecog-test-002"})
```

**Expected**:
- `status: "completed"`
- `summary: "Strongest activity in ..."`
- `hotspots: [{region: "...", hemisphere: "...", confidence: ...}]`
- `figUrl: null or "cloudinary_url"`
- `images: [] or ["cloudinary_url"]`

---

## Future Improvements (Optional)

1. **Local File Server**: If Cloudinary continues to fail, serve local PNGs via Express static middleware
2. **Compression**: Further reduce PNG file size (optimize PNG, use lower color depth)
3. **Chunked Upload**: Use Cloudinary's chunked upload API for large files
4. **Alternative Storage**: Consider AWS S3, Azure Blob, or local filesystem
5. **Lazy Loading**: Upload images asynchronously AFTER Node callback completes

---

## Summary

**Problem**: Cloudinary 413 errors crashed ECoG pipeline before saving results

**Solution**: Best-effort upload with graceful fallback

**Result**:
- ✅ Analysis ALWAYS completes
- ✅ Summary + hotspots ALWAYS saved
- ✅ Study ALWAYS marked as COMPLETED
- ⚠️ Images optional (None if upload fails)

**Status**: ✅ Ready for testing
