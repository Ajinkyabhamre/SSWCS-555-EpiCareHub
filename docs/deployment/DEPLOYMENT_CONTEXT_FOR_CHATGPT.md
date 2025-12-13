# EpiCareHub Deployment Context for ChatGPT

**Purpose**: This document provides comprehensive deployment context for ChatGPT to handle all Docker deployment, troubleshooting, and infrastructure tasks for EpiCareHub without requiring human intervention.

**Date**: December 11, 2025
**Repository**: SSWCS-555-EpiCareHub
**Deployment Target**: AWS EC2 (Ubuntu 22.04)

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Docker Infrastructure](#2-docker-infrastructure)
3. [Environment Variables](#3-environment-variables)
4. [Deployment Process](#4-deployment-process)
5. [Troubleshooting](#5-troubleshooting)
6. [Updating the Application](#6-updating-the-application)
7. [Network & Communication](#7-network--communication)
8. [Critical Design Decisions](#8-critical-design-decisions)
9. [Common Issues & Solutions](#9-common-issues--solutions)

---

## 1. System Architecture

### High-Level Overview

EpiCareHub is a full-stack epilepsy care management platform with 3D brain visualization:

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Frontend   │────────>│   Backend    │                │
│  │   (Nginx)    │         │ (Node/Express│                │
│  │  Port: 5173  │         │  Port: 3000  │                │
│  └──────────────┘         └──────┬───────┘                │
│                                   │                         │
│                            ┌──────▼───────┐                │
│                            │  Brain API   │                │
│                            │  (FastAPI)   │                │
│                            │  Port: 8000  │                │
│                            └──────────────┘                │
│                                                             │
│         Internal Network: epicarehub-network                │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
            MongoDB Atlas            Cloudinary CDN
            (Cloud DB)               (Cloud Storage)
```

### Component Roles

1. **Frontend (React + Vite + Nginx)**
   - Serves the React SPA
   - Handles routing with fallback to `index.html` for client-side routing
   - Provides gzip compression and caching for static assets
   - Communicates with Backend via REST API

2. **Backend (Node.js + Express)**
   - REST API for patient data, authentication, and EEG studies
   - Handles EEG file uploads and processing orchestration
   - Communicates with MongoDB Atlas for persistence
   - Calls Brain API (FastAPI) to trigger Python pipelines
   - Receives callbacks from Brain API with processing results

3. **Brain API (Python + FastAPI)**
   - Processes EEG data using MNE-Python and custom algorithms
   - Generates 3D brain visualizations and electrode localization
   - Uploads snapshots to Cloudinary
   - Callbacks to Backend with results

4. **MongoDB Atlas (Cloud)**
   - Stores patient records, EEG studies, and metadata
   - NOT containerized (cloud-hosted)

5. **Cloudinary (Cloud CDN)**
   - Stores brain visualization images, topomaps, and 3D overlays
   - NOT containerized (cloud-hosted)

---

## 2. Docker Infrastructure

### File Structure

```
SSWCS-555-EpiCareHub/
├── docker-compose.yml                  # Orchestrates all 3 services
├── .env.example                        # Template for environment variables
├── .env                                # Actual environment variables (git-ignored)
│
├── Frontend/
│   ├── Dockerfile                      # Multi-stage build: Node + Nginx
│   ├── nginx.conf                      # Nginx configuration for SPA
│   └── .dockerignore
│
├── Backend/
│   ├── Dockerfile                      # Node 20 Alpine
│   ├── server.js                       # Entry point
│   ├── app.js                          # Express app configuration
│   └── .dockerignore
│
└── Localization-Algorithm/
    ├── Dockerfile                      # Python 3.11 slim with MNE
    ├── requirements.txt                # Python dependencies
    ├── brain_visualizer.py             # Main pipeline script
    └── .dockerignore
```

### docker-compose.yml Breakdown

```yaml
version: '3.8'

services:
  # Backend - Node/Express API
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: epicarehub-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - MONGO_URL=${MONGO_URL}                      # Cloud MongoDB Atlas
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - BRAIN_API_URL=http://brain-api:8000         # Docker DNS
      - FASTAPI_URL=http://brain-api:8000
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - brain-api
    networks:
      - epicarehub-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  # Brain API - Python/FastAPI for EEG processing
  brain-api:
    build:
      context: ./Localization-Algorithm
      dockerfile: Dockerfile
    container_name: epicarehub-brain-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - KMP_DUPLICATE_LIB_OK=TRUE
      - MPLBACKEND=Agg                              # Non-interactive matplotlib
      - BASE_PATH=/app/uploads
      - NODE_API_URL=http://backend:3000           # Docker DNS for callback
      - EPICARE_INTERNAL_API_KEY=${EPICARE_INTERNAL_API_KEY}
    volumes:
      - brain-uploads:/app/uploads                  # Persist uploads
    networks:
      - epicarehub-network
    healthcheck:
      test: ["CMD", "python", "-c", "import requests; requests.get('http://localhost:8000/health').raise_for_status()"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 15s

  # Frontend - React/Vite app served by Nginx
  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://localhost:3000  # Build-time arg
    container_name: epicarehub-frontend
    restart: unless-stopped
    ports:
      - "5173:80"
    depends_on:
      - backend
    networks:
      - epicarehub-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

networks:
  epicarehub-network:
    driver: bridge

volumes:
  brain-uploads:
    driver: local
```

### Dockerfile Details

#### Frontend/Dockerfile (Multi-Stage Build)

```dockerfile
# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time argument for API URL
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Why Multi-Stage?**
- **Stage 1**: Installs Node dependencies and builds React app with Vite
- **Stage 2**: Only copies built assets to lightweight Nginx image
- **Result**: Final image is ~50MB instead of ~1GB
- **Security**: No Node.js in production, only static files + Nginx

#### Frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets (JS, CSS, images)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Why This Configuration?**
- `try_files $uri $uri/ /index.html;` enables client-side routing (critical for React Router)
- Gzip reduces bandwidth by ~70%
- Long caching for assets (1 year) improves performance
- Security headers protect against XSS and clickjacking

#### Backend/Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Production-only install (smaller image)
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

**Why This Design?**
- Alpine Linux reduces image size by ~400MB
- `npm ci --only=production` skips dev dependencies (faster, smaller)
- Health check ensures Express is responding before routing traffic

#### Localization-Algorithm/Dockerfile

```dockerfile
FROM python:3.11-slim

# Install system dependencies for MNE, NumPy, and matplotlib
RUN apt-get update && apt-get install -y \
    build-essential \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    libxrender1 \
    libxext6 \
    libsm6 \
    libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1 \
    KMP_DUPLICATE_LIB_OK=TRUE \
    MPLBACKEND=Agg \
    BASE_PATH=/app/uploads

RUN mkdir -p /app/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health').raise_for_status()"

CMD ["uvicorn", "brain_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why These System Dependencies?**
- `libgl1-mesa-glx`, `libgomp1`: Required by MNE for 3D rendering
- `libfontconfig1`: Required by matplotlib for text rendering
- `PYTHONUNBUFFERED=1`: Ensures logs are flushed immediately (critical for debugging)
- `MPLBACKEND=Agg`: Non-interactive matplotlib backend (no X11 needed)

---

## 3. Environment Variables

### .env.example Structure

```bash
# MongoDB Atlas (Cloud-hosted)
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/epicarehubData?retryWrites=true&w=majority

# Cloudinary (Cloud-hosted image storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# API URLs (Docker networking)
VITE_API_BASE_URL=http://localhost:3000        # Frontend → Backend
BRAIN_API_URL=http://brain-api:8000            # Backend → Brain API (Docker DNS)
FASTAPI_URL=http://brain-api:8000
NODE_API_URL=http://backend:3000               # Brain API → Backend (Docker DNS)

# Security
SESSION_SECRET=change-this-to-random-256-bit-string
EPICARE_INTERNAL_API_KEY=change-this-internal-api-key
```

### Environment Variable Mapping

| Variable | Used By | Purpose | Example Value |
|----------|---------|---------|---------------|
| `MONGO_URL` | Backend | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/epicarehubData` |
| `CLOUDINARY_CLOUD_NAME` | Backend, Brain API | Cloudinary account name | `dxyz123abc` |
| `CLOUDINARY_API_KEY` | Backend, Brain API | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Backend, Brain API | Cloudinary API secret | `abcdefghijklmnopqrstuvwxyz123456` |
| `VITE_API_BASE_URL` | Frontend (build-time) | Backend API URL | `http://localhost:3000` or `http://<EC2_IP>:3000` |
| `BRAIN_API_URL` | Backend | Brain API URL for internal calls | `http://brain-api:8000` |
| `NODE_API_URL` | Brain API | Backend URL for callbacks | `http://backend:3000` |
| `SESSION_SECRET` | Backend | Express session encryption | Random 64-character string |
| `EPICARE_INTERNAL_API_KEY` | Backend, Brain API | API key for Brain→Backend callbacks | Random 32-character string |

**CRITICAL**:
- `VITE_API_BASE_URL` is a **build-time** variable for frontend. If you change it, you must rebuild: `docker compose build frontend`
- `BRAIN_API_URL` and `NODE_API_URL` use Docker DNS (`brain-api`, `backend`) for internal communication
- Never expose `SESSION_SECRET` or `EPICARE_INTERNAL_API_KEY` in git

---

## 4. Deployment Process

### Prerequisites

1. **EC2 Instance**:
   - OS: Ubuntu 22.04 LTS
   - Instance Type: t3.medium (minimum)
   - Storage: 30 GB EBS
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Backend API), 5173 (Frontend)

2. **Required Services**:
   - MongoDB Atlas account with cluster created
   - Cloudinary account with credentials

### Step-by-Step Deployment

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 t3.medium instance via AWS Console
# Download .pem key file
chmod 400 your-key.pem
```

#### 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

#### 3. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt update
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes to take effect
exit
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Verify installation
docker --version
docker compose version
```

#### 4. Clone Repository

```bash
git clone https://github.com/your-org/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub
```

#### 5. Configure Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit with nano or vim
nano .env

# Required changes:
# - MONGO_URL: Replace with your MongoDB Atlas connection string
# - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: Add your Cloudinary credentials
# - SESSION_SECRET: Generate random 64-character string
# - EPICARE_INTERNAL_API_KEY: Generate random 32-character string
# - VITE_API_BASE_URL: Set to http://<EC2_PUBLIC_IP>:3000
```

**Generate Secure Secrets**:
```bash
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate EPICARE_INTERNAL_API_KEY
openssl rand -hex 16
```

#### 6. Build Docker Images

```bash
docker compose build

# Expected output:
# [+] Building X.Xs (3/3) FINISHED
#  => [frontend internal] load build definition from Dockerfile
#  => [backend internal] load build definition from Dockerfile
#  => [brain-api internal] load build definition from Dockerfile
```

**Build Time**:
- Frontend: ~2-3 minutes (npm install + Vite build + Nginx copy)
- Backend: ~1-2 minutes (npm install only)
- Brain API: ~5-7 minutes (pip install MNE + dependencies)

#### 7. Start Services

```bash
docker compose up -d

# -d flag runs in detached mode (background)
```

#### 8. Verify Deployment

```bash
# Check container status
docker compose ps

# Expected output:
# NAME                   STATUS         PORTS
# epicarehub-backend     Up X minutes   0.0.0.0:3000->3000/tcp
# epicarehub-brain-api   Up X minutes   0.0.0.0:8000->8000/tcp
# epicarehub-frontend    Up X minutes   0.0.0.0:5173->80/tcp

# Check health
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# Check logs
docker compose logs -f

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:8000/health
curl http://localhost:5173
```

#### 9. Access Application

- Frontend: `http://<EC2_PUBLIC_IP>:5173`
- Backend API: `http://<EC2_PUBLIC_IP>:3000`
- Brain API: `http://<EC2_PUBLIC_IP>:8000` (internal use only)

#### 10. Configure EC2 Security Group

In AWS Console:
1. Navigate to EC2 → Security Groups
2. Select your instance's security group
3. Add Inbound Rules:
   - HTTP: Port 80, Source: 0.0.0.0/0
   - Custom TCP: Port 3000, Source: 0.0.0.0/0
   - Custom TCP: Port 5173, Source: 0.0.0.0/0
   - Custom TCP: Port 8000, Source: <Your_IP>/32 (optional, for debugging)

---

## 5. Troubleshooting

### Common Issues & Solutions

#### Issue 1: Containers Fail to Start

**Symptoms**:
```bash
docker compose ps
# Shows "Exited" or "Restarting" status
```

**Diagnosis**:
```bash
# Check logs
docker compose logs backend
docker compose logs brain-api
docker compose logs frontend

# Common errors:
# - "MongoDB connection failed" → Check MONGO_URL in .env
# - "Cloudinary auth failed" → Check Cloudinary credentials
# - "Port already in use" → Another service is using port 3000/8000/5173
```

**Solution**:
```bash
# Fix .env file
nano .env

# Rebuild affected service
docker compose build <service_name>

# Restart
docker compose restart <service_name>
```

#### Issue 2: Frontend Can't Reach Backend

**Symptoms**:
- Frontend loads but shows "Failed to load data" errors
- Browser console shows CORS errors or 404s

**Diagnosis**:
```bash
# Check if backend is responding
curl http://localhost:3000/health

# Check frontend API URL
docker compose logs frontend | grep VITE_API_BASE_URL
```

**Solution**:
```bash
# Update .env with correct EC2 IP
nano .env
# Set: VITE_API_BASE_URL=http://<EC2_PUBLIC_IP>:3000

# Rebuild frontend (VITE_API_BASE_URL is build-time variable)
docker compose build frontend

# Restart frontend
docker compose restart frontend
```

#### Issue 3: MongoDB Connection Failed

**Symptoms**:
```bash
docker compose logs backend
# Error: MongoNetworkError: failed to connect
```

**Diagnosis**:
```bash
# Test MongoDB connection from host
curl "mongodb+srv://<username>:<password>@cluster.mongodb.net/test?retryWrites=true&w=majority"
```

**Solution**:
1. Check MongoDB Atlas network access:
   - Atlas Dashboard → Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
2. Verify connection string in `.env`:
   ```bash
   MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/epicarehubData?retryWrites=true&w=majority
   ```
3. Check username/password for special characters (URL-encode if needed)
4. Restart backend:
   ```bash
   docker compose restart backend
   ```

#### Issue 4: Brain API Processing Fails

**Symptoms**:
- EEG upload appears to hang
- No 3D visualization generated

**Diagnosis**:
```bash
# Check brain-api logs
docker compose logs brain-api | tail -50

# Check backend logs for Brain API calls
docker compose logs backend | grep ANALYSIS

# Common errors:
# - "ModuleNotFoundError: No module named 'mne'" → MNE not installed
# - "Cloudinary upload failed" → Cloudinary credentials invalid
# - "Callback failed: Connection refused" → Brain API can't reach backend
```

**Solution**:
```bash
# If MNE missing, rebuild brain-api
docker compose build brain-api
docker compose restart brain-api

# If Cloudinary issue, check credentials
nano .env
# Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# If callback issue, check NODE_API_URL
docker compose logs brain-api | grep NODE_API_URL
# Should show: NODE_API_URL=http://backend:3000

# Restart brain-api
docker compose restart brain-api
```

#### Issue 5: High Memory Usage

**Symptoms**:
- EC2 instance becomes unresponsive
- OOM (Out of Memory) errors in logs

**Diagnosis**:
```bash
# Check memory usage
docker stats

# Check EC2 instance type
# t3.micro (1 GB RAM) is insufficient
# t3.small (2 GB RAM) is minimal
# t3.medium (4 GB RAM) is recommended
```

**Solution**:
1. Upgrade EC2 instance type to t3.medium
2. Add swap space:
   ```bash
   sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

## 6. Updating the Application

### Pulling Latest Code

```bash
cd SSWCS-555-EpiCareHub

# Pull latest changes
git pull origin main

# Rebuild affected services
# If Frontend changed:
docker compose build frontend
docker compose restart frontend

# If Backend changed:
docker compose build backend
docker compose restart backend

# If Python pipeline changed:
docker compose build brain-api
docker compose restart brain-api

# If all changed:
docker compose build
docker compose restart
```

### Rolling Updates (Zero Downtime)

```bash
# Update one service at a time
docker compose build backend
docker compose up -d --no-deps backend
# --no-deps prevents restarting dependent services

# Verify new container is healthy
docker compose ps backend
docker compose logs backend | tail -20

# Repeat for other services
```

### Complete Rebuild

```bash
# Stop all services
docker compose down

# Remove all images
docker compose down --rmi all

# Remove volumes (CAUTION: deletes upload data)
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

---

## 7. Network & Communication

### Docker DNS Resolution

Docker Compose creates a custom bridge network (`epicarehub-network`) where services can communicate using container names as hostnames:

```
frontend → backend     : http://backend:3000
backend → brain-api    : http://brain-api:8000
brain-api → backend    : http://backend:3000 (callback)
```

**Why Not `localhost`?**
- Inside a container, `localhost` refers to the container itself, not the host
- Docker DNS resolves service names (`backend`, `brain-api`) to container IPs

### Port Mapping

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| frontend | 80 | 5173 | Nginx serves React app |
| backend | 3000 | 3000 | Express API |
| brain-api | 8000 | 8000 | FastAPI for Python pipeline |

**Example**:
- From host: `curl http://localhost:3000` → Backend API
- From frontend container: `http://backend:3000` → Backend API
- From backend container: `http://brain-api:8000` → Brain API

### External Services

```
┌─────────────┐
│  Frontend   │
│ (Docker)    │
└──────┬──────┘
       │
       │ HTTP (VITE_API_BASE_URL)
       ▼
┌─────────────┐
│  Backend    │────────> MongoDB Atlas (Cloud)
│ (Docker)    │   ▲
└──────┬──────┘   │
       │          └──── Cloudinary (Cloud)
       │ HTTP (BRAIN_API_URL)
       ▼
┌─────────────┐
│  Brain API  │────────> Cloudinary (Cloud)
│ (Docker)    │
└─────────────┘
```

**Key Points**:
- MongoDB and Cloudinary are accessed via internet (HTTPS)
- Backend and Brain API both have Cloudinary credentials
- Brain API posts results back to Backend via callback

---

## 8. Critical Design Decisions

### Why NOT Containerize MongoDB?

**Decision**: Use MongoDB Atlas (cloud-hosted) instead of containerizing MongoDB.

**Reasons**:
1. **Data Persistence**: Atlas handles backups, replication, disaster recovery
2. **Scalability**: Atlas auto-scales; Docker volume doesn't
3. **Security**: Atlas provides encryption at rest, network isolation, role-based access
4. **Maintenance**: Atlas handles patches, updates, monitoring
5. **Cost**: Free tier (512 MB) sufficient for development; production is cost-effective

**Trade-off**: Requires internet connectivity for Backend to reach Atlas.

### Why Multi-Stage Frontend Build?

**Decision**: Use multi-stage Dockerfile for Frontend (Node build → Nginx runtime).

**Reasons**:
1. **Image Size**: Final image is 50 MB (Nginx + static files) vs. 1 GB (Node + dependencies)
2. **Security**: No Node.js in production image reduces attack surface
3. **Performance**: Nginx is optimized for serving static files
4. **Simplicity**: Single Dockerfile handles build + serve

**Trade-off**: Longer build time (2 stages), but only happens during deployment.

### Why Docker Compose (Not Kubernetes)?

**Decision**: Use Docker Compose for orchestration instead of Kubernetes.

**Reasons**:
1. **Simplicity**: Docker Compose is easier to configure and debug
2. **Cost**: Single EC2 instance sufficient; Kubernetes requires multiple nodes
3. **Use Case**: Application doesn't require auto-scaling or complex orchestration
4. **Learning Curve**: Team is familiar with Docker Compose

**When to Migrate to Kubernetes**:
- Application scales beyond single server
- Need for auto-scaling, rolling updates, or multi-region deployment
- Budget allows for EKS cluster

### Why Volumes for Brain Uploads?

**Decision**: Use Docker volumes to persist `/app/uploads` for Brain API.

**Reasons**:
1. **Data Retention**: EEG files and processing artifacts persist across container restarts
2. **Debugging**: Allows inspection of uploaded files and intermediate results
3. **Recovery**: If Brain API crashes, files are not lost

**Alternative**: Use Cloudinary for uploads too (more scalable but higher cost).

---

## 9. Common Issues & Solutions

### Issue: "Failed to connect to MongoDB"

**Root Cause**: MongoDB Atlas network access not configured.

**Fix**:
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow from anywhere)
3. Wait 2-3 minutes for propagation
4. Restart backend: `docker compose restart backend`

### Issue: "Cloudinary authentication failed"

**Root Cause**: Incorrect Cloudinary credentials in `.env`.

**Fix**:
1. Log in to Cloudinary Dashboard → Settings → Security
2. Copy exact values for `cloud_name`, `api_key`, `api_secret`
3. Update `.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=dxyz123abc
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
   ```
4. Restart affected services:
   ```bash
   docker compose restart backend
   docker compose restart brain-api
   ```

### Issue: "Frontend shows blank page"

**Root Cause**: Nginx not configured for SPA routing.

**Fix**:
1. Verify `nginx.conf` has:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
2. Rebuild frontend:
   ```bash
   docker compose build frontend
   docker compose restart frontend
   ```

### Issue: "Brain API takes too long"

**Root Cause**: Python pipeline processing large EEG file or insufficient CPU.

**Expected Behavior**: HUMAN_MTL pipeline takes 60-180 seconds for typical .h5 file.

**Fix**:
1. Check EC2 instance type (t3.medium recommended)
2. Monitor CPU usage: `docker stats brain-api`
3. If CPU is maxed, upgrade to t3.large
4. Check logs for MNE warnings: `docker compose logs brain-api | grep WARNING`

### Issue: "Cannot connect to Docker daemon"

**Root Cause**: User not in `docker` group.

**Fix**:
```bash
sudo usermod -aG docker $USER
# Log out and back in
exit
ssh -i your-key.pem ubuntu@<EC2_IP>
docker ps  # Should work without sudo
```

### Issue: "Port already in use"

**Root Cause**: Another service is using port 3000, 5173, or 8000.

**Fix**:
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5173
sudo lsof -i :8000

# Kill process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
# Example: Map frontend to port 8080 instead
ports:
  - "8080:80"
```

---

## Quick Reference Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart specific service
docker compose restart <service_name>

# View logs
docker compose logs -f                    # All services
docker compose logs -f backend            # Specific service
docker compose logs --tail=100 brain-api  # Last 100 lines

# Check status
docker compose ps

# Rebuild service
docker compose build <service_name>
docker compose up -d --no-deps <service_name>

# Execute command in container
docker compose exec backend sh            # Open shell in backend container
docker compose exec brain-api python -c "import mne; print(mne.__version__)"

# Check resource usage
docker stats

# Prune unused images/volumes (free space)
docker system prune -a

# Full reset (CAUTION: deletes data)
docker compose down -v
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

---

## Conclusion

This document provides complete context for ChatGPT to handle all deployment tasks for EpiCareHub. For any deployment questions, refer to this document first. If issues persist, check:

1. **Container logs**: `docker compose logs <service>`
2. **Network connectivity**: `docker compose ps` and `curl` health endpoints
3. **Environment variables**: `docker compose config` to verify values
4. **.env file**: Ensure all required variables are set correctly
5. **EC2 security group**: Verify ports 3000, 5173, 8000 are open

**Last Updated**: December 11, 2025
**Author**: Claude Sonnet 4.5 (AI Assistant)
**Repository**: https://github.com/your-org/SSWCS-555-EpiCareHub
