# Installing and Setting Up Conda for EpiCareHub

**Problem:** `zsh: command not found: conda`

This guide will help you install Conda and set up the Python environment for the Localization-Algorithm service.

---

## Step 1: Install Conda (Miniconda)

### Option A: Using Homebrew (Recommended for macOS)

```bash
# Install Miniconda via Homebrew
brew install miniconda

# Initialize Conda for Zsh shell
conda init zsh

# Restart your terminal or run:
source ~/.zshrc
```

### Option B: Download Miniconda Directly

1. Go to https://docs.conda.io/en/latest/miniconda.html
2. Download the macOS installer for your architecture:
   - **Apple Silicon (M1/M2/M3):** `Miniconda3-latest-MacOSX-arm64.sh`
   - **Intel Mac:** `Miniconda3-latest-MacOSX-x86_64.sh`

3. Run the installer:
```bash
# Navigate to your Downloads folder
cd ~/Downloads

# Run the installer
bash Miniconda3-latest-MacOSX-arm64.sh  # For Apple Silicon
# OR
bash Miniconda3-latest-MacOSX-x86_64.sh  # For Intel

# Follow the prompts and accept the default installation location
```

4. Initialize Conda for your shell:
```bash
# For Zsh
conda init zsh

# For Bash (if using bash instead of zsh)
conda init bash

# Restart terminal or run
source ~/.zshrc  # For Zsh
# or
source ~/.bashrc  # For Bash
```

---

## Step 2: Verify Conda Installation

```bash
conda --version
```

**Expected output:** `conda 23.x.x` or similar version number

If you see `command not found`, restart your terminal and try again.

---

## Step 3: Create the Brain Environment

Navigate to the Localization-Algorithm directory:

```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
```

Create the conda environment from the environment.yml file:

```bash
conda env create -f environment.yml
```

This will create an environment named `brain` with all required dependencies.

**Expected output:**
```
Collecting package metadata (reading): done
Solving environment: done

==> WARNING: A newer version of conda exists. <==
...
Preparing transaction: done
Verifying transaction: done
Executing transaction: done
```

---

## Step 4: Verify Environment Creation

Check that the `brain` environment was created:

```bash
conda env list
```

**Expected output:**
```
# conda environments:
#
base                  *  /Users/ajinkyabhamre/miniconda3
brain                    /Users/ajinkyabhamre/miniconda3/envs/brain
```

The asterisk (*) shows the currently active environment. The `brain` environment should be listed.

---

## Step 5: Activate the Environment

```bash
conda activate brain
```

**Expected output:**
Your terminal prompt should now show `(brain)` at the beginning:
```
(brain) Localization-Algorithm git:(main) ✓
```

If you don't see `(brain)`, the environment isn't activated. Try restarting your terminal.

---

## Step 6: Configure Environment Variables

Create a `.env` file in the Localization-Algorithm directory:

```bash
cp .env.example .env
```

Edit `.env` with your Cloudinary credentials:

```bash
nano .env
# or
vi .env
```

Add your actual Cloudinary credentials:

```
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
BACKEND_ORIGIN=http://localhost:3000
LOG_LEVEL=INFO
```

Save and exit (for nano: Ctrl+X, then Y, then Enter)

---

## Step 7: Start the FastAPI Server

With the `brain` environment activated and in the Localization-Algorithm directory:

```bash
conda activate brain
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
uvicorn brain_api:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

---

## Step 8: Test the Service

In a new terminal (while the service is running):

```bash
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "Localization-Algorithm",
  "version": "1.0.0",
  "port": 8000
}
```

---

## Troubleshooting

### Issue: Conda command not found after installation

**Solution:**
1. Restart your terminal
2. Verify installation: `conda --version`
3. If still not found, manually initialize:
   ```bash
   # Find conda location
   which miniconda
   # Then initialize (replace path if different)
   ~/miniconda3/bin/conda init zsh
   ```

### Issue: Environment file not found

**Solution:**
Make sure you're in the correct directory:
```bash
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
ls environment.yml  # Should show the file
```

### Issue: Dependencies fail to install

**Solution:**
1. Update conda: `conda update conda`
2. Try again: `conda env create -f environment.yml`
3. If still failing, remove the environment and retry:
   ```bash
   conda env remove --name brain
   conda env create -f environment.yml
   ```

### Issue: Port 8000 already in use

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
uvicorn brain_api:app --reload --port 8001
```

### Issue: ModuleNotFoundError when running FastAPI

**Solution:**
1. Verify `brain` environment is activated: `conda activate brain`
2. Verify you're in the Localization-Algorithm directory
3. Reinstall environment:
   ```bash
   conda env remove --name brain
   conda env create -f environment.yml
   conda activate brain
   uvicorn brain_api:app --reload --port 8000
   ```

---

## Switching Between Environments

To deactivate the `brain` environment:
```bash
conda deactivate
```

To reactivate it later:
```bash
conda activate brain
```

---

## Quick Reference

### After initial setup, to start the Python service:

```bash
# Terminal 1
cd /Users/ajinkyabhamre/Projects/SSWCS-555-EpiCareHub/Localization-Algorithm
conda activate brain
uvicorn brain_api:app --reload --port 8000
```

### Keep other services in different terminals:

```bash
# Terminal 2
cd Backend
npm start

# Terminal 3
cd Frontend
npm run dev

# Terminal 4 (MongoDB)
brew services start mongodb-community
```

---

## Additional Resources

- [Conda Installation Guide](https://conda.io/projects/conda/en/latest/user-guide/install/index.html)
- [Miniconda Documentation](https://docs.conda.io/en/latest/miniconda.html)
- [Managing Conda Environments](https://conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

---

**Next Step:** Once conda is installed and the `brain` environment is activated, follow the main setup guide in `Localization-Algorithm/RUN_LOCAL.md`

