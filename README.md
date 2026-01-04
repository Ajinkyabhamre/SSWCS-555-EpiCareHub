# 🧠 EpiCareHub

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

## 💻 Local Development

### Using Helper Scripts

```bash
# Start all services
./scripts/dev-up.sh

# Stop all services
./scripts/dev-down.sh

# Rebuild brain-api after ML changes
./scripts/rebuild-brain-api.sh

# Check for large files and bloat
./scripts/check-artifacts.sh
```

### Development Workflow

1. **Make code changes** in Backend/, Frontend/, or Localization-Algorithm/
2. **Backend/Frontend:** Changes auto-reload (nodemon/Vite HMR)
3. **ML API:** Rebuild container: `./scripts/rebuild-brain-api.sh`
4. **Test pipeline:** Run `cd Localization-Algorithm && bash test_pipeline.sh`

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f brain-api
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Cannot connect to MongoDB"**
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas network access (allow your IP or `0.0.0.0/0`)
- Test: `mongosh "mongodb+srv://..."`

**Issue: "CORS errors in browser"**
- Verify `CORS_ORIGIN` in Backend `.env` matches frontend URL
- Check `VITE_API_BASE_URL` in Frontend `.env`

**Issue: "Brain images don't load"**
- Check Cloudinary credentials in ML API `.env`
- Verify Cloudinary URLs in MongoDB study records
- Check browser console for errors

**Issue: "Docker: M1 chip compatibility"**
- ML API requires x86_64 builds
- Add `platform: linux/amd64` to docker-compose.yml brain-api service if needed

**Issue: "brain-api OOM (Out of Memory)"**
- MNE-Python is memory-intensive
- Increase Docker Desktop RAM (Settings → Resources → Memory → 4GB+)

**Issue: "Build fails with 'layer too large'"**
- Run `docker system prune -a` to clean build cache
- Check that `uploads/` is empty and `.dockerignore` is present

### Reset Everything

```bash
# Stop and remove all containers + volumes
docker compose down -v

# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

---

## 🌐 Deployment

**See [deploy/deployment-plan.md](deploy/deployment-plan.md) for complete deployment guide.**

### Quick Overview

**Option A: Single VPS (Docker Compose)**
- Deploy all 3 services on one VPS (DigitalOcean, Linode, Hetzner)
- Requires: 4GB RAM, 2 vCPUs, 50GB disk
- Nginx reverse proxy for SSL + domain routing
- Cost: ~$12-24/month

**Option B: Managed Services (Recommended)**
- Frontend → Vercel (free, auto HTTPS, CDN)
- Backend → Render/Railway ($0-7/month)
- ML API → Render/Railway ($7-21/month, needs 2GB RAM)
- MongoDB → Atlas (free M0 tier)
- Cloudinary → Free tier
- Cost: ~$7-28/month

**Required Environment Variables:**
- See `.env.example` for unified config template
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
