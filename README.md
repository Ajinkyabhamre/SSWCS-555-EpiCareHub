# 🧠 EpiCareHub

![CI](https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub/actions/workflows/ci.yml/badge.svg)

**EpiCareHub** is a medical platform for epilepsy seizure localization using 3D brain visualization and AI-powered analysis of intracranial EEG data. The system processes electrode recordings, identifies seizure hotspots using ML algorithms, and presents results through an interactive web interface with 4-view 3D brain renderings.

---

## ✨ Key Features

- 🎯 **AI-Powered Hotspot Detection** - Identifies seizure focus regions from iEEG data
- 🧠 **4-View 3D Visualization** - Interactive brain views (left, right, superior, anterior)
- 📊 **Real-Time Analysis** - Process clinical data and get results in seconds
- 🔬 **MNE-Python Pipeline** - Industry-standard neuroimaging signal processing
- 📱 **Responsive Web UI** - Modern interface with patient/study management
- ☁️ **Cloud Storage** - Cloudinary CDN for brain images

---

## 🛠️ Tech Stack

**Frontend:** React 18 + Vite 5 + Tailwind CSS + WebGL (Three.js)
**Backend:** Node.js 20 + Express 4.18 + MongoDB (sessions + data)
**ML Pipeline:** Python 3.11 + FastAPI + MNE-Python + NumPy + Matplotlib

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB (local or Atlas)
- Docker + Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repo
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub

# 2. Copy environment templates
cp Frontend/.env.example Frontend/.env
cp Backend/.env.example Backend/.env
cp Localization-Algorithm/.env.example Localization-Algorithm/.env

# 3. Edit .env files with your MongoDB URI, Cloudinary credentials, etc.

# 4. Start all services
docker compose up -d

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
# ML API:   http://localhost:8000
```

### Option 2: Manual Setup

**Backend:**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm start  # Runs on port 3000
```

**Frontend:**
```bash
cd Frontend
npm install
cp .env.example .env
# Edit .env with API URLs
npm run dev  # Runs on port 5173
```

**ML API:**
```bash
cd Localization-Algorithm
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Cloudinary credentials
uvicorn brain_api:app --reload  # Runs on port 8000
```

---

## 🌐 Deployment

**Production Stack:**
- **Frontend** → Vercel (static build, auto-deploy from GitHub)
- **Backend** → Render/Railway (Docker, requires MongoDB URI + env vars)
- **ML API** → Render/Railway (Docker, requires persistent disk for `/app/uploads`, min 2GB RAM)

**Required Environment Variables:**
- See `Frontend/.env.example`, `Backend/.env.example`, `Localization-Algorithm/.env.example`
- Generate secrets: `openssl rand -hex 32`
- MongoDB: Use Atlas free tier (M0, 512MB)
- Cloudinary: Free tier (25GB storage/bandwidth)

---

## 📖 Documentation

- **CLAUDE.md** - Comprehensive project context and architecture
- **docs/legacy-summaries/** - Detailed setup guides and implementation notes
- **Backend/routes/** - API endpoint documentation in code
- **Localization-Algorithm/README.md** - ML pipeline details

---

## 🧪 Testing

```bash
# Backend tests
cd Backend && npm test

# Frontend tests
cd Frontend && npm test

# Python syntax check
python -m py_compile Localization-Algorithm/brain_api.py
```

---

## 📂 Project Structure

```
SSWCS-555-EpiCareHub/
├── Backend/                   # Node.js API (Express + MongoDB)
├── Frontend/                  # React app (Vite + Tailwind)
├── Localization-Algorithm/    # Python ML pipeline (FastAPI + MNE)
├── docker-compose.yml         # Full stack orchestration
└── docs/legacy-summaries/     # Detailed documentation
```

---

## 🤝 Contributing

This is an academic project for Stevens Institute of Technology (SSW-555).
For issues or questions, please open a GitHub issue.

---

## 📄 License

[Add your license here]

---

**Built with ❤️ for precision epilepsy care**
