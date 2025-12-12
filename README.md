# 🧠 EpiCareHub

![CI](https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub/actions/workflows/ci.yml/badge.svg)

> **Empowering precision medicine through 3D brain visualization and AI-powered seizure localization**

---

## 🌟 Overview

**EpiCareHub** is a full-stack web platform that helps medical professionals accurately identify seizure-affected areas in the brain using advanced electrode activity analysis and 3D brain visualization. By combining machine learning algorithms with interactive 3D renderings, EpiCareHub improves surgical planning and patient outcomes for epilepsy cases.

The platform processes intracranial EEG (iEEG) data from patients with implanted electrodes, detects high-activity "hotspot" regions, and presents results through an intuitive web interface with multiple 3D brain views.

### 🎯 Key Value Proposition

- 🔬 **Automated Hotspot Detection** - ML-powered analysis identifies seizure focus regions
- 🧠 **4-View 3D Visualization** - See brain electrode positions from left, right, top, and front angles
- 📊 **Real-time Analysis** - Process clinical data and get results in seconds
- 🌐 **Web-Based Interface** - Access from any browser, no specialized software required

---

## 🧠 Features

- ✨ **Human MTL Dataset Support** - Load and process `.h5` files from the Human MTL Units WM dataset
- 🎯 **Electrode Activity Detection** - Compute normalized activity scores across all electrodes
- 🖼️ **4-View 3D Brain Visualization** - Generate left lateral, right lateral, superior (top), and anterior views
- 🧪 **MNE-Python Integration** - Leverage industry-standard neuroimaging tools for signal processing
- 🏗️ **Full-Stack Architecture** - Python ML pipeline → Node.js API → React frontend
- 🔥 **Hotspot Detection** - Identify top N electrodes with highest epileptic activity
- 📝 **Automated Summaries** - Generate clinical summaries of seizure localization
- ☁️ **Cloudinary Integration** - Store and serve brain images via CDN
- 📱 **Responsive UI** - Modern, mobile-friendly design with Tailwind CSS

---

## 📂 Project Structure

```
SSWCS-555-EpiCareHub/
│
├── Backend/                    # Node.js/Express API server
│   ├── routes/                 # API endpoints (patients, studies)
│   ├── data/                   # Database access layer (MongoDB)
│   ├── middleware/             # Auth & validation middleware
│   └── config/                 # Database connection config
│
├── Frontend/                   # React web application
│   ├── src/
│   │   ├── components/         # UI components (Brain, PatientDetails)
│   │   ├── routes/             # React Router pages
│   │   ├── features/           # Redux slices (if using)
│   │   └── utils/              # Helper functions
│   └── public/                 # Static assets
│
└── Localization-Algorithm/     # Python ML pipeline
    ├── brain_visualizer.py     # Main pipeline orchestrator
    ├── helper.py               # Core analysis functions
    ├── datasets/               # Human MTL dataset storage
    │   └── human_mtl_units_wm/ # .h5 files with electrode coords
    ├── uploads/                # Pipeline output (figures, results)
    └── environment.yml         # Conda environment spec
```

---

## 🧱 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Human MTL Dataset (.h5)                   │
│            MNI electrode coordinates + iEEG data            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│             Python ML Pipeline (brain_visualizer.py)        │
│  • Load H5 → MNE RawArray                                   │
│  • Preprocess (high-pass filter)                            │
│  • Compute electrode activity                               │
│  • Detect hotspots (top N channels)                         │
│  • Generate 4-view 3D brain images (Matplotlib + MNE)       │
│  • Upload images to Cloudinary                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP POST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (Express + MongoDB)            │
│  • Receive analysis results via /patients/upload            │
│  • Store study metadata + brainViews URLs                   │
│  • Serve API for frontend queries                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                React Frontend (Vite + Tailwind)             │
│  • Patient management UI                                    │
│  • Study list with "3D Images Ready" badges                 │
│  • Brain.jsx component renders 4 tabbed views               │
│  • Hotspot list with confidence scores                      │
│  • Localization summary display                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** (with conda for environment management)
- **Node.js 18+** and npm
- **MongoDB** (local or Atlas cloud instance)
- **Git**

### Quick Start

```bash
# Clone the repository
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub

# Set up all three components (see detailed instructions below)
# 1. Python ML Pipeline
# 2. Node.js Backend
# 3. React Frontend
```

---

## 🔐 Environment Configuration Overview

**IMPORTANT**: EpiCareHub requires environment variables for database connections, API keys, and service configuration. **Never commit real secrets to git**.

### Which Services Require Environment Files?

| Service | Environment File | Required For |
|---------|------------------|--------------|
| **Frontend** | `Frontend/.env` | Local development, Docker builds |
| **Backend** | `Backend/.env` | Local development, Docker runtime |
| **Python API** | `Localization-Algorithm/.env` | Local development, Docker runtime |

### Setup Instructions

#### For Local Development:

1. **Copy the template files** for each service:
   ```bash
   # Frontend
   cp Frontend/.env.example Frontend/.env

   # Backend
   cp Backend/.env.example Backend/.env

   # Python API
   cp Localization-Algorithm/.env.example Localization-Algorithm/.env
   ```

2. **Edit each `.env` file** and replace placeholders with your real values:
   - `<YOUR_MONGODB_URI>` → MongoDB Atlas connection string
   - `<YOUR_CLOUDINARY_*>` → Cloudinary credentials (get free account at [cloudinary.com](https://cloudinary.com))
   - `<YOUR_SESSION_SECRET>` → Generate with `openssl rand -hex 32`
   - `<YOUR_SECURE_API_KEY>` → Generate with `openssl rand -hex 16` (must match in Backend and Python API)

3. **Verify setup**: Each service will fail to start if required environment variables are missing.

#### For Docker / EC2 Deployment:

- Use the **root-level** `.env.example` as a template
- Set Docker-specific URLs (e.g., `http://backend:3000` instead of `http://localhost:3000`)
- See [DEPLOYMENT_CONTEXT_FOR_CHATGPT.md](./DEPLOYMENT_CONTEXT_FOR_CHATGPT.md) for full deployment guide

### Security Best Practices

⚠️ **NEVER commit these files to git**:
- `Frontend/.env`
- `Backend/.env`
- `Localization-Algorithm/.env`

✅ **Safe to commit**:
- `Frontend/.env.example`
- `Backend/.env.example`
- `Localization-Algorithm/.env.example`

All `.env` files are already in `.gitignore` to prevent accidental commits.

### Quick Reference: Required Variables

**Backend** (most critical):
- `MONGODB_URI` - Database connection
- `MONGODB_DB_NAME` - Database name
- `SESSION_SECRET` - Session encryption
- `EPICARE_INTERNAL_API_KEY` - Service authentication

**Python API**:
- `CLOUDINARY_CLOUD_NAME` - Image hosting
- `CLOUDINARY_API_KEY` - Image hosting
- `CLOUDINARY_API_SECRET` - Image hosting
- `EPICARE_INTERNAL_API_KEY` - Service authentication (must match Backend)

**Frontend** (build-time only):
- `VITE_API_BASE_URL` - Backend URL
- `VITE_PYTHON_API_URL` - Python API URL

---

## 🐍 ML Pipeline Setup

The Python pipeline processes brain data and generates 3D visualizations.

### 1. Create Conda Environment

```bash
cd Localization-Algorithm

# Create environment from spec
conda env create -f environment.yml

# Activate environment
conda activate brain
```

**Manual Installation (if environment.yml fails):**

```bash
conda create --name brain python=3.11
conda activate brain

# Install core dependencies
conda install -c conda-forge mne numpy scipy matplotlib h5py
pip install python-dotenv cloudinary requests
```

### 2. Configure Environment Variables

Create a `.env` file in `Localization-Algorithm/`:

```bash
# Cloudinary credentials (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Backend API endpoint
NODE_API_URL=http://localhost:3000
EPICARE_INTERNAL_API_KEY=your_internal_api_key
```

### 3. Download Dataset

The pipeline requires the **Human MTL Units WM dataset**:

```bash
# Download the H5 file manually from:
# https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM

# Place it in:
# Localization-Algorithm/datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5
```

### 4. Run the Pipeline

```bash
# Make sure conda environment is active
conda activate brain

# Run analysis on Human MTL dataset
python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId <patient-mongodb-id> \
  --uploadId human-mtl-test-001 \
  --historic False
```

**Expected Output:**
```
[PIPELINE] Mode: HUMAN_MTL
[HUMAN_MTL] Loaded 48 electrode MNI coordinates
[HUMAN_MTL] Computing electrode activity...
[HUMAN_MTL] Hotspots: 5 detected
[BRAIN_SNAPSHOTS] ✓ Generated 4 brain view(s): ['left_lateral', 'right_lateral', 'top', 'anterior']
[HUMAN_MTL] ✓ Node backend callback successful!
```

---

## 🖥️ Backend Setup

The Node.js backend serves the REST API and stores analysis results.

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment

Create `.env` file in `Backend/`:

```bash
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/epicarehub
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/epicarehub

# Server config
PORT=3000
NODE_ENV=development

# Internal API key (match with Python .env)
EPICARE_INTERNAL_API_KEY=your_internal_api_key
```

### 3. Start the Server

```bash
npm start
```

**Expected Output:**
```
Server running on port 3000
Connected to MongoDB
```

**API Endpoints:**
- `GET /patients` - List all patients
- `GET /patients/:id` - Get patient details
- `GET /patients/:id/studies` - Get patient's EEG studies
- `POST /patients/upload` - Receive ML pipeline results (internal)

---

## 💻 Frontend Setup

The React frontend provides the web interface for viewing results.

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure Environment

Create `.env` file in `Frontend/`:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Navigate the UI

1. Open browser to `http://localhost:5173`
2. Browse patient list
3. Click a patient to view details
4. Studies with brain images show badge: **"📍 3D Images Ready (4)"**
5. Click "View 3D Brain" to see electrode positions and hotspots

---

## 🧪 Running a Full End-to-End Test

### Step 1: Start All Services

**Terminal 1 - Backend:**
```bash
cd Backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

### Step 2: Run ML Pipeline

**Terminal 3 - Python:**
```bash
cd Localization-Algorithm
conda activate brain

python3 brain_visualizer.py \
  --basePath ./uploads \
  --file "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5" \
  --patientId <existing-patient-id> \
  --uploadId e2e-test-$(date +%s) \
  --historic False
```

### Step 3: Verify in Browser

1. Navigate to `http://localhost:5173`
2. Find the patient by ID
3. Locate the new study (uploadId: `e2e-test-...`)
4. Verify badge shows: **"📍 3D Images Ready (4)"**
5. Click into Brain view
6. See 4 tabs:
   - **Left Lateral View**
   - **Right Lateral View**
   - **Superior (Top) View**
   - **Anterior View**
7. Verify hotspots are highlighted in red

**Success Criteria:**
- ✅ All 4 images load from Cloudinary
- ✅ Hotspot list shows confidence scores
- ✅ Summary text displays correctly
- ✅ Metadata shows "4 available" brain views

---

## 📸 Screenshots

> **Coming Soon** - Add screenshots of:
> - Patient list view
> - Study detail with 3D Images badge
> - Brain visualization component (4 views)
> - Hotspot detection results

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### ML Pipeline
- **Python 3.11** - Language
- **MNE-Python** - Neuroimaging toolkit
- **NumPy/SciPy** - Numerical computing
- **Matplotlib** - Plotting
- **h5py** - HDF5 file I/O
- **Cloudinary** - Image CDN

---

## 📚 Dataset Information

### Human MTL Units WM Dataset

**Source:** Boran et al. (2019) - Human MTL Units scalp EEG and iEEG verbal WM dataset

**Repository:** https://gin.g-node.org/USZ_NCH/Human_MTL_units_scalp_EEG_and_iEEG_verbal_WM

**Features:**
- Intracranial EEG (iEEG) recordings
- MNI-space electrode coordinates (mm)
- Anatomical electrode labels
- Working memory task data

**Why This Dataset?**
- ✅ Includes precise 3D electrode coordinates
- ✅ High-quality clinical data
- ✅ Open-source and well-documented
- ✅ Perfect for testing seizure localization algorithms

---

## 🧪 Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests
```bash
cd Frontend
npm test
```

### Python Tests
```bash
cd Localization-Algorithm
pytest
```

---

## 🐳 Docker & Deployment

### Local Docker Run

EpiCareHub is fully containerized for easy deployment. All services (Frontend, Backend, Brain API) run in Docker containers while connecting to cloud-hosted MongoDB and Cloudinary.

**Prerequisites:**
- Docker Engine 20.10+ and Docker Compose 2.0+
- Cloud MongoDB instance (MongoDB Atlas recommended)
- Cloudinary account for image storage

**Quick Start:**

```bash
# 1. Clone the repository
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub

# 2. Create environment file
cp .env.example .env

# 3. Edit .env and fill in your credentials:
#    - MONGO_URL (your MongoDB Atlas connection string)
#    - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
#    - SESSION_SECRET (random secret key)

# 4. Build and start all services
docker compose build
docker compose up -d

# 5. Check service health
docker compose ps

# 6. View logs
docker compose logs -f
```

**Access the application:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Brain API:** http://localhost:8000 (optional)

**Stop services:**
```bash
docker compose down

# To also remove volumes (uploaded data):
docker compose down -v
```

### Docker Architecture

The Docker setup includes three services:

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| **frontend** | epicarehub-frontend | 5173 → 80 | React app (Nginx) |
| **backend** | epicarehub-backend | 3000 | Node/Express API |
| **brain-api** | epicarehub-brain-api | 8000 | Python/FastAPI for EEG processing |

**Key Points:**
- Services communicate via Docker network (`epicarehub-network`)
- MongoDB and Cloudinary are **cloud-hosted** (not in containers)
- Frontend calls backend at `http://localhost:3000`
- Backend calls brain-api at `http://brain-api:8000` (Docker network)
- Brain API calls backend at `http://backend:3000` for callbacks

### EC2 Deployment

Deploy all services on a single EC2 instance:

**1. Launch EC2 Instance**
- **OS:** Ubuntu 22.04 LTS
- **Instance Type:** t3.medium or larger (2 vCPU, 4 GB RAM minimum)
- **Storage:** 30 GB or more
- **Security Group:**
  - Inbound: Port 80 (HTTP), Port 443 (HTTPS), Port 22 (SSH)
  - Optionally: Port 3000 (Backend API), Port 5173 (Frontend dev)

**2. Install Docker on EC2**

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Log out and back in for group changes to take effect
exit
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

**3. Deploy Application**

```bash
# Clone repository
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub

# Create .env file
cp .env.example .env
nano .env  # or vim .env

# Edit .env with your cloud credentials:
# - MONGO_URL=mongodb+srv://...  (your Atlas connection string)
# - CLOUDINARY_* credentials
# - SESSION_SECRET (generate a strong random key)

# Build and start services
docker compose build
docker compose up -d

# Check logs
docker compose logs -f backend
docker compose logs -f brain-api
docker compose logs -f frontend
```

**4. Access Application**

- Frontend: http://\<EC2_PUBLIC_IP\>:5173
- Backend API: http://\<EC2_PUBLIC_IP\>:3000

**5. Production Improvements (Optional)**

For production, consider:

**A. Nginx Reverse Proxy**

Configure Nginx on EC2 host to:
- Serve frontend on port 80/443
- Proxy `/api` requests to backend:3000
- Handle SSL/TLS certificates (Let's Encrypt)

**B. Domain Name**

- Register a domain and point it to your EC2 Elastic IP
- Update `VITE_API_BASE_URL` in docker-compose.yml build args

**C. HTTPS with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**D. Docker Health Checks**

Services include health checks by default:
```bash
docker compose ps  # Shows service health status
```

**E. Monitoring & Logging**

```bash
# View logs
docker compose logs -f

# Monitor resource usage
docker stats

# Auto-restart on failure
# (already configured with "restart: unless-stopped" in docker-compose.yml)
```

**6. Updating the Application**

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker compose down
docker compose build
docker compose up -d
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/epicarehub` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef123456` |
| `SESSION_SECRET` | Express session secret | Random 32+ char string |
| `EPICARE_INTERNAL_API_KEY` | Internal API key for service communication | Random string |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:3000` or `http://your-domain.com/api` |

### Troubleshooting Docker Deployment

**Issue: Services fail to start**
```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs backend
docker compose logs brain-api
```

**Issue: Backend can't connect to MongoDB**
- Verify `MONGO_URL` in `.env` is correct
- Ensure MongoDB Atlas allows connections from EC2 IP
- Check network access in Atlas: Network Access → Add IP Address → Allow from Anywhere (or specific EC2 IP)

**Issue: Frontend can't reach backend**
- Verify `VITE_API_BASE_URL` is set correctly
- Frontend must use EC2 public IP or domain (not `localhost` when accessed remotely)
- Check EC2 security group allows inbound traffic on port 3000

**Issue: Brain API fails to start**
- Check for Python dependency errors in logs
- Verify system dependencies are installed (handled by Dockerfile)
- Ensure sufficient disk space for pip packages

**Issue: Permission denied errors**
```bash
# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock
# or restart Docker daemon
sudo systemctl restart docker
```

---

## 🐛 Troubleshooting

### Issue: Python pipeline fails with "No module named 'mne'"

**Solution:**
```bash
conda activate brain
conda install -c conda-forge mne
```

### Issue: Backend can't connect to MongoDB

**Solution:**
- Ensure MongoDB is running: `mongod --version`
- Check connection string in Backend/.env
- For Atlas, verify network access and credentials

### Issue: Frontend shows "3D Images Ready (0)"

**Possible Causes:**
- Cloudinary upload failed (check credentials)
- Python pipeline didn't generate images (check logs)
- Backend didn't receive brainViews (check POST /patients/upload logs)

### Issue: Images don't load in Brain view

**Solution:**
- Open browser console for errors
- Verify Cloudinary URLs are valid
- Check CORS settings if images hosted externally

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 EpiCareHub Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests:** Ensure all tests pass
5. **Commit changes:** `git commit -m 'Add amazing feature'`
6. **Push to branch:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Contribution Guidelines

- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Follow existing code style
- Be respectful and professional

---

## 🙏 Acknowledgements

This project wouldn't be possible without:

- **Human MTL Units WM Dataset** - Boran et al. (2019) for providing high-quality clinical data with electrode coordinates
- **MNE-Python** - For the excellent neuroimaging toolkit that powers our signal processing
- **OpenNeuro** - For hosting open-source neuroscience datasets
- **Cloudinary** - For reliable image hosting and CDN services
- **MongoDB** - For flexible document storage
- **React Community** - For amazing UI components and tools

### Research Citation

If you use the Human MTL dataset, please cite:

```
Boran, E., Fedele, T., Steiner, A. et al. (2020).
Human MTL Units scalp EEG and iEEG verbal WM dataset.
GIN Repository. https://doi.org/10.12751/g-node.a09sd5
```

---

## 📞 Contact & Support

- **Project Repository:** https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub
- **Issues:** https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub/issues
- **Discussions:** https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub/discussions

---

<div align="center">

**Built with ❤️ by the EpiCareHub Team**

🧠 Making seizure localization more accurate, one electrode at a time 🎯

</div>
