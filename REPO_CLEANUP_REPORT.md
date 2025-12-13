# Repository Cleanup Report

**Date**: December 12, 2025
**Repository**: EpiCareHub
**Current Size**: 3.7 GB
**Target Size**: < 500 MB
**Git Object Size**: 132.58 MiB (compressed)

---

## Executive Summary

This repository contains **critical security risks** and significant bloat:

🚨 **CRITICAL**: `epicarehub-aws-key.pem` (1.6 KB) is **TRACKED BY GIT** - must be removed from history immediately
⚠️ **2.6 GB** of temporary upload files not needed in repo
⚠️ **1.5 GB** of duplicate .h5 dataset files (4 copies of same 391 MB file)
⚠️ **~1 GB** of duplicate .fif MEG files (8 copies of same 123 MB file)
⚠️ **Large binaries in git history**: brain1.gltf (37 MB), meg-fwd.fif (21 MB), model weights
⚠️ **34 markdown files** in root causing documentation confusion
⚠️ **Frontend/dist/** (35 MB+) should not be tracked

**Estimated size after cleanup**: ~300-400 MB (source code + essential assets)

---

## Scan Results Summary

### Total Size Breakdown
```
3.7 GB    Total repository
2.6 GB    Localization-Algorithm/uploads/ (temp files)
1.5 GB    Duplicate .h5 files (4 copies × 391 MB)
~1 GB     Duplicate .fif files (8 copies × 123 MB)
132 MB    Git object storage (compressed)
~400 MB   Legitimate source code, configs, essential assets
```

### Service Size Breakdown
```
2.7 GB    Localization-Algorithm/ (mostly uploads + datasets)
148 MB    Frontend/ (includes dist/ build artifacts)
112 MB    Backend/
```

### Files > 10 MB (19 files found)
| File | Size | Status | Action |
|------|------|--------|--------|
| `Localization-Algorithm/uploads/Data_Subject_01_Session_01.h5` | 391 MB × 4 | Not tracked | IGNORE |
| `Localization-Algorithm/uploads/sample_audvis_raw.fif` | 123 MB × 8 | Not tracked | IGNORE |
| `Localization-Algorithm/uploads/ECoG_data.mat` | 101 MB | Not tracked | IGNORE |
| `Frontend/dist/assets/brain1-*.js` | 35 MB | Should not track | IGNORE dist/ |
| `Frontend/public/obj/brain1.gltf` | 37 MB | **IN GIT HISTORY** | FILTER-REPO |
| `Frontend/public/models/brain_lh.obj` | 10.3 MB | Tracked (essential) | KEEP |
| `Frontend/public/models/brain_rh.obj` | 10.2 MB | Tracked (essential) | KEEP |
| `Localization-Algorithm/data/meg-fwd.fif` | 21 MB | **IN GIT HISTORY** | FILTER-REPO |
| `Localization-Algorithm/model/.../net_params_best.pkl` | 5.6 MB | **IN GIT HISTORY** | FILTER-REPO |

### Security Risks Found
```
🚨 epicarehub-aws-key.pem (1.6 KB) - TRACKED BY GIT
   Location: Root directory
   Git status: COMMITTED TO REPOSITORY
   Action: MUST remove from git history with filter-repo
   Consequence: Private key may be exposed in GitHub
```

### Build Artifacts Found
```
Frontend/dist/                    (35 MB+ build output - should not track)
Frontend/node_modules/            (ignored ✓)
Backend/node_modules/             (ignored ✓)
Localization-Algorithm/__pycache__/ (ignored ✓)
```

### Documentation Chaos
```
34 markdown files in root directory
Currently .gitignore pattern: *.md except README.md
Result: Documentation files keep getting lost
Action: Reorganize into docs/ folder, fix .gitignore pattern
```

---

## KEEP: Essential Files and Folders

### Source Code (MUST KEEP)
```
Frontend/
├── src/                          # React source code (~15 MB)
│   ├── components/               # UI components
│   ├── App.jsx                   # Root component
│   └── main.jsx                  # Entry point
├── public/                       # Static assets
│   ├── models/                   # Brain 3D models (20 MB - essential)
│   │   ├── brain_lh.obj          # 10.3 MB - required for 3D viewer
│   │   └── brain_rh.obj          # 10.2 MB - required for 3D viewer
│   ├── textures/                 # Brain textures
│   └── icons/                    # App icons
├── index.html                    # HTML entry
├── package.json                  # Dependencies
├── vite.config.js                # Build config
└── Dockerfile                    # Container definition

Backend/
├── models/                       # Mongoose schemas
├── routes/                       # Express routes
├── utils/                        # Helper functions
├── server.js                     # Entry point
├── package.json                  # Dependencies
└── Dockerfile                    # Container definition

Localization-Algorithm/
├── brain_visualizer.py           # Main MNE pipeline
├── helper.py                     # LCMV beamformer
├── run_human_mtl_pipeline.py     # 4-view pipeline
├── main.py                       # FastAPI server
├── requirements.txt              # Python dependencies
└── Dockerfile                    # Container definition
```

### Configuration Files (MUST KEEP)
```
docker-compose.yml                # Docker orchestration
.gitignore                        # Git ignore rules (will update)
package.json                      # Root workspace config (if exists)
```

### Essential Documentation (KEEP)
```
README.md                         # Main project documentation
DEPLOYMENT_CONTEXT_FOR_CHATGPT.md # Deployment guide (30 KB)
```

### Environment Templates (KEEP - recently created)
```
.env.example                      # Root template (if creating)
Frontend/.env.example             # Frontend template (1.7 KB)
Backend/.env.example              # Backend template (4.5 KB)
Localization-Algorithm/.env.example # Python template (4.2 KB)
```

### Sample Datasets (KEEP - if small reference files)
```
Localization-Algorithm/data/
└── (Small sample files < 10 MB for testing)
    Note: meg-fwd.fif (21 MB) should be regenerated or downloaded, not tracked
```

---

## IGNORE: Files to Exclude from Git

### 1. Temporary Upload Files (2.6 GB - NOT TRACKED, keep gitignored)
```
Localization-Algorithm/uploads/
├── Data_Subject_01_Session_01.h5  (391 MB × 4 copies)
├── sample_audvis_raw.fif          (123 MB × 8 copies)
└── ECoG_data.mat                  (101 MB)

Rationale: Runtime-generated temporary files from user uploads
Action: Add to .gitignore (already not tracked)
Pattern: uploads/
```

### 2. Build Artifacts (SHOULD NOT TRACK)
```
Frontend/dist/                     # Vite build output (35 MB+)
Frontend/node_modules/             # NPM dependencies (already ignored)
Backend/node_modules/              # NPM dependencies (already ignored)
Localization-Algorithm/__pycache__/ # Python bytecode (already ignored)
Localization-Algorithm/.pytest_cache/

Rationale: Generated at build time, not source code
Action: Add dist/ to .gitignore
Patterns:
  dist/
  build/
  __pycache__/
  *.pyc
  .pytest_cache/
```

### 3. Local Environment Files (NEVER COMMIT)
```
Frontend/.env                      # Contains VITE_* dev settings
Backend/.env                       # Contains MongoDB credentials
Localization-Algorithm/.env        # Contains Cloudinary secrets

Rationale: Contains real credentials (MongoDB, Cloudinary, API keys)
Action: Already gitignored ✓
Pattern: .env (already in .gitignore)
```

### 4. Private Keys and Secrets (CRITICAL)
```
🚨 epicarehub-aws-key.pem          # AWS EC2 private key (TRACKED - REMOVE!)
*.pem
*.key
*.p12
*.pfx

Rationale: Security risk - private keys expose infrastructure
Action: Add to .gitignore + remove from git history
Pattern: *.pem, *.key
```

### 5. IDE and OS Files
```
.vscode/
.idea/
.DS_Store
Thumbs.db
*.swp
*.swo
*~

Rationale: Developer-specific, not project files
Action: Add to .gitignore
```

### 6. Docker Artifacts
```
.dockerignore                      # Will create per-service
docker-compose.override.yml        # Local overrides

Rationale: Local development overrides
Action: Add override files to .gitignore
```

### 7. Logs and Debugging Files
```
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs/
*.log.*

Rationale: Runtime logs, not source
Action: Add to .gitignore
```

---

## MOVE OUT OF REPO: Large Datasets

### Large Dataset Files (Move to External Storage)

#### Option A: Keep Small Samples, Host Large Files Externally
```
Current:
  Localization-Algorithm/uploads/Data_Subject_01_Session_01.h5 (391 MB × 4)
  Localization-Algorithm/uploads/sample_audvis_raw.fif (123 MB × 8)
  Localization-Algorithm/uploads/ECoG_data.mat (101 MB)

Recommended approach:
  1. Delete duplicate copies (keep 1 of each in gitignored datasets/ folder)
  2. Add download script: scripts/download-sample-data.sh
  3. Host large files on:
     - AWS S3 (already have AWS key)
     - Cloudinary (already integrated)
     - Git LFS (if keeping in repo)
     - Google Drive / Dropbox (simple alternative)

  4. Update README with download instructions:
     "To run the brain localization demo, download sample datasets:
      ./scripts/download-sample-data.sh"
```

#### Option B: Use Git LFS (Large File Storage)
```
If you want to keep datasets version-controlled but not bloat git:

  1. Install Git LFS: brew install git-lfs
  2. Track large files:
     git lfs track "*.h5"
     git lfs track "*.fif"
     git lfs track "*.mat"
  3. Commit .gitattributes

Pros: Version control for datasets, GitHub hosts files
Cons: GitHub LFS costs money (1 GB free, then $5/mo per 50 GB)
```

#### Option C: Gitignore datasets/ Folder (Recommended)
```
Recommended structure:
  Localization-Algorithm/
  ├── datasets/                    # Gitignored folder
  │   ├── .gitkeep                 # Track empty folder
  │   ├── README.md                # Download instructions
  │   └── (user downloads files here)
  └── uploads/                     # Gitignored runtime temp files

Add to .gitignore:
  datasets/*.h5
  datasets/*.fif
  datasets/*.mat
  uploads/

Keep tracked:
  datasets/.gitkeep
  datasets/README.md (with download links)
```

### Model Weights (Move or Host Externally)
```
Current:
  Localization-Algorithm/model/sample/real_model/net_params_best.pkl (5.6 MB)
  Status: IN GIT HISTORY

Recommended:
  1. Remove from git history (filter-repo)
  2. Host on model registry or S3
  3. Add download script: scripts/download-model-weights.sh
  4. Update .gitignore to exclude *.pkl, *.pth, *.h5 (model files)

Pattern: model/**/*.pkl, model/**/*.pth, model/**/*.h5
```

---

## REORGANIZE: Documentation Files

### Current State (Causing Confusion)
```
34 markdown files in root directory
Current .gitignore: *.md (excludes all except README.md)
Result: Documentation keeps getting lost
```

### Proposed Structure
```
Root level (KEEP):
  README.md                        # Main documentation
  DEPLOYMENT_CONTEXT_FOR_CHATGPT.md # Essential deployment guide

docs/ folder (CREATE):
  docs/
  ├── deployment/
  │   └── (move deployment docs here if creating more)
  ├── development/
  │   └── (architecture, dev guides)
  └── internal/
      ├── IMPLEMENTATION_SUMMARY.md  # Move here
      ├── ENV_CLEANUP_SUMMARY.md     # Move here
      └── (other session summaries)

Delete or move:
  *.md files that are session notes/summaries → docs/internal/
  *.md files that are duplicates → delete
```

### Updated .gitignore Pattern
```
Change from:
  *.md
  !README.md

Change to:
  # Keep documentation organized
  docs/internal/*.md          # Internal session notes (optional tracking)

  # OR keep all docs tracked, just organize them:
  (remove *.md pattern entirely, let developers decide what to commit)
```

---

## GIT HISTORY CLEANUP PLAN

### ⚠️ CRITICAL: Files to Remove from Git History

These files were committed in the past and are inflating the git object database:

#### 🚨 Security Risk (MUST REMOVE)
```
epicarehub-aws-key.pem (1.6 KB)
- Private AWS EC2 key
- Currently tracked by git
- May be exposed when pushing to GitHub
- CRITICAL: Remove from all commits
```

#### Large Binary Files (SHOULD REMOVE)
```
Frontend/public/obj/brain1.gltf (37 MB)
- 3D brain model in GLTF format
- Currently in git history
- Should be regenerated or downloaded, not tracked

Localization-Algorithm/data/meg-fwd.fif (21 MB)
- MEG forward solution file
- Currently in git history
- Should be regenerated from MNE sample data

Localization-Algorithm/model/.../net_params_best.pkl (5.6 MB)
- Model weights
- Should be hosted externally

Other large files found in history:
- Frontend/dist/assets/brain1-*.js (35 MB) - build artifact
```

### Git Filter-Repo Commands (WAIT FOR APPROVAL)

**⚠️ WARNING: These commands REWRITE GIT HISTORY. All developers must re-clone after this.**

```bash
# 1. BACKUP FIRST
git clone /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub /tmp/epicarehub-backup

# 2. Install git-filter-repo
brew install git-filter-repo  # macOS
# or: pip3 install git-filter-repo

# 3. Remove private key (CRITICAL)
git filter-repo --path epicarehub-aws-key.pem --invert-paths --force

# 4. Remove large binary files
git filter-repo --path Frontend/public/obj/brain1.gltf --invert-paths --force
git filter-repo --path Localization-Algorithm/data/meg-fwd.fif --invert-paths --force
git filter-repo --path Localization-Algorithm/model/sample/real_model/net_params_best.pkl --invert-paths --force

# 5. Remove build artifacts if tracked
git filter-repo --path Frontend/dist/ --invert-paths --force

# 6. Verify size reduction
git count-objects -vH

# 7. Force push to remote (if already pushed)
git push origin --force --all
git push origin --force --tags

# 8. Notify all developers to re-clone
echo "All developers must delete local repo and re-clone"
```

**Estimated size reduction**: ~100 MB from git object database

**Consequences**:
- ✅ Repository becomes smaller and faster to clone
- ✅ Private key no longer in git history
- ⚠️ All commit SHAs will change
- ⚠️ All developers must re-clone the repository
- ⚠️ Open pull requests will break
- ⚠️ Cannot be undone without restoring from backup

**Recommendation**: Only run this BEFORE first GitHub push, or coordinate with entire team.

---

## Action Plan Summary

### Phase 1: Immediate Actions (No History Rewrite)
```
1. ✅ Scan completed - all issues identified
2. ⏳ Create this cleanup report (REPO_CLEANUP_REPORT.md)
3. ⏳ Update .gitignore with comprehensive patterns
4. ⏳ Delete local duplicates in uploads/ folder (not tracked)
5. ⏳ Create .dockerignore files
6. ⏳ Reorganize markdown files into docs/ folder
7. ⏳ Create unified root .env structure
8. ⏳ Update docker-compose.yml for root .env
```

### Phase 2: Git History Cleanup (REQUIRES APPROVAL)
```
⚠️ WAIT FOR USER APPROVAL BEFORE RUNNING

1. Backup repository to /tmp
2. Install git-filter-repo
3. Remove epicarehub-aws-key.pem from history
4. Remove large binaries (brain1.gltf, meg-fwd.fif, *.pkl)
5. Verify size reduction
6. Force push to remote (if applicable)
```

### Phase 3: External Dataset Hosting (OPTIONAL)
```
1. Create scripts/download-sample-data.sh
2. Upload datasets to S3 or Cloudinary
3. Add download instructions to README
4. Create Localization-Algorithm/datasets/.gitkeep
5. Add datasets/README.md with download links
```

---

## Expected Size After Cleanup

### Before Cleanup
```
3.7 GB    Total size
2.6 GB    Uploads (temp files)
1.5 GB    Duplicate .h5 files
~1 GB     Duplicate .fif files
132 MB    Git object storage
```

### After Phase 1 (Gitignore Updates)
```
~400 MB   Total size (working directory)
  - Uploads folder gitignored (no change to disk, but won't be committed)
  - Build artifacts gitignored
  - Private key still in history (Phase 2 needed)
132 MB    Git object storage (no change until Phase 2)
```

### After Phase 2 (History Cleanup)
```
~300 MB   Total size
~30 MB    Git object storage (reduced by 100 MB)
  - Private key removed from all commits
  - Large binaries removed from history
  - Clean state for GitHub push
```

### Git Clone Size (Fresh Clone)
```
Current:  ~3.7 GB (if uploads were tracked)
After:    ~300 MB (source code + essential assets)
Reduction: 92% smaller
```

---

## Recommendations

### 1. CRITICAL: Remove Private Key from Git History
```
🚨 HIGHEST PRIORITY: epicarehub-aws-key.pem is in git
Action: Run git filter-repo before pushing to GitHub
Consequence: If pushed to GitHub, key is exposed forever (even if deleted later)
```

### 2. Do NOT Track Build Artifacts
```
Frontend/dist/ should NEVER be committed
Add to .gitignore immediately
```

### 3. Use Gitignored datasets/ Folder
```
Keep large datasets (*.h5, *.fif, *.mat) in gitignored folders
Provide download script for developers
Host files on S3, Cloudinary, or Google Drive
```

### 4. Organize Documentation
```
Create docs/ folder structure
Keep README.md in root
Move session summaries to docs/internal/
Fix .gitignore to allow tracking important docs
```

### 5. Unified Environment Configuration
```
Create root .env (not committed)
Create root .env.example (committed)
Update docker-compose.yml to use root env file
Keep service-specific .env.example for documentation
```

---

## Size Comparison Table

| Category | Current Size | After Cleanup | Keep/Ignore |
|----------|--------------|---------------|-------------|
| Source Code (Frontend/Backend/Python) | ~100 MB | ~100 MB | KEEP |
| Essential 3D Models (brain_lh/rh.obj) | 20 MB | 20 MB | KEEP |
| Build Artifacts (dist/) | 35 MB | 0 MB | IGNORE |
| Uploads (temp files) | 2.6 GB | 0 MB | IGNORE |
| Duplicate Datasets (.h5/.fif) | 2.5 GB | 0 MB | IGNORE/MOVE |
| Git History Bloat | 132 MB | ~30 MB | FILTER |
| **Total** | **3.7 GB** | **~300 MB** | **92% reduction** |

---

**Next Steps**: Proceed with Phase 1 actions (update .gitignore, create .dockerignore, reorganize docs, unify env config).
**STOP before Phase 2**: Present git filter-repo plan and wait for explicit user approval.
