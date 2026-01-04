# EpiCareHub - Production Deployment Plan

**Last Updated:** 2026-01-03
**Target:** Production-ready deployment with SSL, monitoring, backups

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Option A: Single VPS (Docker Compose)](#option-a-single-vps-docker-compose)
3. [Option B: Managed Services](#option-b-managed-services-recommended)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Secrets Management](#secrets-management)
6. [Monitoring & Observability](#monitoring--observability)
7. [Backup Strategy](#backup-strategy)
8. [Post-Deployment Validation](#post-deployment-validation)

---

## Deployment Options

| Feature | Option A: Single VPS | Option B: Managed Services |
|---------|---------------------|---------------------------|
| **Cost** | $12-24/month | $7-28/month |
| **Complexity** | Medium (manual setup) | Low (automated) |
| **Scalability** | Manual (upgrade VPS) | Auto-scaling built-in |
| **SSL** | Manual (Certbot) | Automatic |
| **Monitoring** | Manual setup | Built-in dashboards |
| **Recommended For** | Teams with DevOps experience | Fast deployment, minimal ops |

---

## Option A: Single VPS (Docker Compose)

Deploy all 3 services on a single server using Docker Compose + Nginx reverse proxy.

### Infrastructure Requirements

**VPS Specs:**
- **Provider:** DigitalOcean, Linode, Hetzner, Vultr
- **CPU:** 2 vCPUs (4 vCPUs recommended for heavy loads)
- **RAM:** 4GB minimum (brain-api needs 2GB+)
- **Disk:** 50GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Cost:** ~$12-24/month

### Step-by-Step Deployment

#### 1. Provision VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Install Nginx and Certbot
apt install nginx certbot python3-certbot-nginx -y
```

#### 2. Clone Repository

```bash
# Create app user (security best practice)
adduser epicare
usermod -aG docker epicare
su - epicare

# Clone repo
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub
git checkout main  # or your production branch
```

#### 3. Configure Environment

```bash
# Copy unified .env template
cp .env.example .env
nano .env
```

**Fill in .env:**
```bash
# Frontend (build-time)
VITE_API_BASE_URL=https://api.epicarehub.com
VITE_PYTHON_API_URL=https://api.epicarehub.com/brain
VITE_EPICARE_DEV_MODE=false
VITE_ENABLE_WEBGL_BRAIN=true

# Backend
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/epicarehub
MONGODB_DB_NAME=epicarehub
SESSION_SECRET=<generate-with-openssl-rand-hex-32>
ADMIN_REGISTRATION_SECRET=<your-admin-secret>
EPICARE_INTERNAL_API_KEY=<generate-with-openssl-rand-hex-16>
PYTHON_API_URL=http://brain-api:8000
NODE_API_URL=http://backend:3000
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://epicarehub.com

# Python ML API
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
HOST=0.0.0.0
LOG_LEVEL=WARNING
```

**Generate secrets:**
```bash
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 16  # EPICARE_INTERNAL_API_KEY
```

#### 4. Configure Nginx Reverse Proxy

```bash
# Copy provided config
sudo cp deploy/nginx-vps.conf /etc/nginx/sites-available/epicarehub
sudo ln -s /etc/nginx/sites-available/epicarehub /etc/nginx/sites-enabled/

# Edit with your domain
sudo nano /etc/nginx/sites-available/epicarehub
# Replace epicarehub.com with your actual domain

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 5. Set Up SSL (Let's Encrypt)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d epicarehub.com -d www.epicarehub.com

# Auto-renewal is enabled by default
# Test renewal: sudo certbot renew --dry-run
```

#### 6. Build and Start Services

```bash
# Build images
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### 7. Configure Firewall

```bash
# Install UFW
sudo apt install ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

#### 8. Set Up Auto-Restart

```bash
# Create systemd service
sudo nano /etc/systemd/system/epicarehub.service
```

**Service file:**
```ini
[Unit]
Description=EpiCareHub Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/epicare/SSWCS-555-EpiCareHub
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
User=epicare
Group=epicare

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl enable epicarehub.service
sudo systemctl start epicarehub.service
```

### Monitoring & Logs

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f brain-api

# Resource usage
docker stats

# System resources
htop
df -h
```

### Backup Strategy

**Daily MongoDB Backups:**
```bash
# Create backup script
nano ~/backup-mongo.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/epicare/backups/mongo
mkdir -p $BACKUP_DIR

# Backup using mongodump (requires MongoDB URI)
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
chmod +x ~/backup-mongo.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/epicare/backup-mongo.sh
```

**Docker Volume Backups:**
```bash
# Backup brain-uploads volume
docker run --rm -v epicarehub_brain-uploads:/data -v ~/backups/volumes:/backup \
  alpine tar czf /backup/brain-uploads-$(date +%Y%m%d).tar.gz -C /data .
```

---

## Option B: Managed Services (Recommended)

Deploy each service to specialized managed platforms.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VERCEL (Frontend)                                          │
│  - React static build                                       │
│  - Auto HTTPS + global CDN                                  │
│  - Free tier: 100GB bandwidth/month                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS API calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RENDER/RAILWAY (Backend API)                               │
│  - Node.js Express (Docker)                                 │
│  - Health check: /health                                    │
│  - Cost: $0-7/month (free tier available)                   │
└────────────────┬────────────────────────────────────────────┘
                 │ Internal callback
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  RENDER/RAILWAY (ML API)                                    │
│  - Python FastAPI + MNE (Docker)                            │
│  - Persistent Disk: /app/uploads (1-5GB)                    │
│  - Min 2GB RAM (MNE memory-intensive)                       │
│  - Cost: $7-21/month                                        │
└─────────────────────────────────────────────────────────────┘

External Services (Cloud):
- MongoDB Atlas (Free M0: 512MB)
- Cloudinary (Free: 25GB storage/bandwidth)
```

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. **Network Access:** Add `0.0.0.0/0` (allow all IPs) or specific service IPs
4. **Database Access:** Create user with read/write permissions
5. **Get Connection String:** `mongodb+srv://user:pass@cluster.mongodb.net/epicarehub`

### 2. Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. **Dashboard:** Note `Cloud Name`, `API Key`, `API Secret`
4. **Settings → Upload:** Set unsigned upload preset (if needed)

### 3. Deploy Backend (Render/Railway)

#### Option 3A: Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. **New → Web Service**
3. Connect GitHub repo: `SSWCS-555-EpiCareHub`
4. **Settings:**
   - **Name:** `epicarehub-backend`
   - **Root Directory:** `Backend`
   - **Environment:** `Docker`
   - **Instance Type:** Free or Starter ($7/month for always-on)
   - **Health Check Path:** `/health` ⚠️ (must add endpoint first!)

5. **Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://...
   MONGODB_DB_NAME=epicarehub
   SESSION_SECRET=<32-char-hex>
   ADMIN_REGISTRATION_SECRET=<your-secret>
   EPICARE_INTERNAL_API_KEY=<16-char-hex>
   PYTHON_API_URL=https://epicarehub-brain-api.onrender.com
   NODE_API_URL=https://epicarehub-backend.onrender.com
   PORT=3000
   NODE_ENV=production
   CORS_ORIGIN=https://epicarehub.vercel.app
   ```

6. **Deploy**

#### Option 3B: Railway

1. Go to [Railway](https://railway.app/)
2. **New Project → Deploy from GitHub**
3. Select repo and service: `Backend`
4. **Settings:**
   - **Root Directory:** `Backend`
   - **Dockerfile Path:** `Backend/Dockerfile`
   - **Port:** 3000
   - **Health Check:** `/health`

5. Add environment variables (same as Render)
6. **Deploy**

### 4. Deploy ML API (Render/Railway)

#### Render Setup

1. **New → Web Service**
2. **Settings:**
   - **Name:** `epicarehub-brain-api`
   - **Root Directory:** `Localization-Algorithm`
   - **Environment:** `Docker`
   - **Instance Type:** Starter ($7/month) or Standard ($21/month) - needs 2GB RAM
   - **Health Check Path:** `/health`

3. **Add Persistent Disk:**
   - **Mount Path:** `/app/uploads`
   - **Size:** 5GB

4. **Environment Variables:**
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   NODE_API_URL=https://epicarehub-backend.onrender.com
   EPICARE_INTERNAL_API_KEY=<must-match-backend>
   HOST=0.0.0.0
   LOG_LEVEL=WARNING
   PYTHONUNBUFFERED=1
   MPLBACKEND=Agg
   ```

5. **Deploy**

#### Railway Setup

Similar to backend, but:
- **Instance Size:** 2GB RAM minimum
- **Volume:** Add persistent volume mounted to `/app/uploads`

### 5. Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/)
2. **Import Project** from GitHub
3. **Framework Preset:** Vite
4. **Root Directory:** `Frontend`
5. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

6. **Environment Variables (Build-time):**
   ```
   VITE_API_BASE_URL=https://epicarehub-backend.onrender.com
   VITE_PYTHON_API_URL=https://epicarehub-brain-api.onrender.com
   VITE_EPICARE_DEV_MODE=false
   VITE_ENABLE_WEBGL_BRAIN=true
   ```

7. **Deploy**

8. **Custom Domain (Optional):**
   - Go to Settings → Domains
   - Add your domain (e.g., `epicarehub.com`)
   - Update DNS records as instructed

### 6. Update Backend CORS_ORIGIN

After frontend deploys, update backend `CORS_ORIGIN` to match Vercel URL:
```
CORS_ORIGIN=https://epicarehub.vercel.app,https://epicarehub.com
```

---

## Pre-Deployment Checklist

### Code Fixes (CRITICAL)

- [ ] **Fix CORS in Backend/app.js:44**
  ```javascript
  // Change from:
  app.use(cors({ origin: "*" }));

  // To:
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:5173"],
    credentials: true
  }));
  ```

- [ ] **Add /health endpoint to Backend**
  - Add to `Backend/routes/index.js`:
  ```javascript
  router.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "epicarehub-backend" });
  });
  ```

- [ ] **Add upload size limits (Backend/app.js:42)**
  ```javascript
  app.use(fileUpload({
    limits: { fileSize: 500 * 1024 * 1024 },  // 500MB
    abortOnLimit: true
  }));
  ```

### Data Cleanup

- [ ] Delete `Localization-Algorithm/uploads/*` (if any test data exists)
- [ ] Verify `.gitignore` patterns are correct
- [ ] Run `./scripts/check-artifacts.sh` to verify no bloat

### Secrets Generation

```bash
# Generate all secrets at once
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "ADMIN_REGISTRATION_SECRET=$(openssl rand -hex 16)"
echo "EPICARE_INTERNAL_API_KEY=$(openssl rand -hex 16)"
```

### External Services

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Cloudinary account set up, credentials obtained
- [ ] Domain name registered (if using custom domain)
- [ ] DNS configured

---

## Secrets Management

### Development
- Use `.env` files (gitignored)
- Never commit secrets to git

### Production

**Option A (VPS):**
- Store `.env` file on server only
- Set file permissions: `chmod 600 .env`
- Use environment variables in systemd service

**Option B (Managed Services):**
- Use platform's environment variable UI (encrypted at rest)
- Render/Railway: Secrets are encrypted and injected at runtime
- Vercel: Build-time env vars are embedded in static files (OK for public API URLs)

### Secret Rotation

1. Generate new secrets
2. Update in all platforms simultaneously
3. Restart services
4. Verify connectivity

---

## Monitoring & Observability

### Option A (VPS)

**Logs:**
```bash
# Docker logs
docker compose logs -f [service-name]

# System logs
journalctl -u epicarehub.service -f
```

**Resource Monitoring:**
- Install `htop`: `sudo apt install htop`
- Docker stats: `docker stats`
- Disk usage: `df -h`

**Uptime Monitoring:**
- [UptimeRobot](https://uptimerobot.com/) (free, 50 monitors)
- [Healthchecks.io](https://healthchecks.io/) (free, 20 checks)

### Option B (Managed Services)

**Built-in Dashboards:**
- Render: Metrics tab (CPU, memory, requests)
- Railway: Metrics tab (resource usage, logs)
- Vercel: Analytics tab (traffic, performance)

**Log Access:**
- Render: Logs tab (real-time)
- Railway: Deployment logs
- Vercel: Deployment logs + Runtime logs

**Alerts:**
- Set up email/Slack alerts for:
  - Service downtime
  - High error rates
  - Memory limits reached

---

## Backup Strategy

### MongoDB Atlas
- **Automated Backups:** Enabled by default (free tier: 24h retention)
- **Manual Backup:** Cloud Manager → Backup → On-Demand Snapshot
- **Restore:** Select snapshot → Restore to cluster

### Brain-API Uploads

**Option A (VPS):**
- Docker volume: `brain-uploads`
- Backup script (see Option A instructions above)
- Store backups on external storage (S3, Backblaze B2)

**Option B (Render):**
- Persistent disk: Automatically backed up by Render
- Download manually: SSH into service → `tar czf uploads.tar.gz /app/uploads`

### Application Code
- GitHub is source of truth
- Tag releases: `git tag v1.0.0 && git push --tags`

---

## Post-Deployment Validation

### Automated Tests

```bash
# Health checks
curl https://epicarehub-backend.onrender.com/health
curl https://epicarehub-brain-api.onrender.com/health

# Backend API
curl https://epicarehub-backend.onrender.com/patients

# Frontend
curl https://epicarehub.vercel.app
```

### Manual Testing

1. **Frontend:**
   - [ ] Login page loads
   - [ ] WebGL brain viewer renders
   - [ ] Can create test patient

2. **Backend:**
   - [ ] Can register/login
   - [ ] Can create patient record
   - [ ] Session persists across requests

3. **ML Pipeline:**
   - [ ] Upload small .fif file (use test data)
   - [ ] Study transitions: CREATED → PROCESSING → COMPLETED
   - [ ] Brain images uploaded to Cloudinary
   - [ ] 4-view images displayed in UI

4. **End-to-End:**
   - [ ] Upload real EEG file
   - [ ] Wait for processing
   - [ ] Verify hotspots detected
   - [ ] Verify brain visualization shows overlay

### Performance Validation

- [ ] Frontend loads < 3s (LCP)
- [ ] API response times < 500ms (p95)
- [ ] ML processing completes within expected time (varies by file size)

---

## Troubleshooting Deployment

### Backend 503 Service Unavailable
- Check MongoDB connection string
- Verify network access in MongoDB Atlas
- Check Render/Railway logs for errors

### Brain-API OOM (Out of Memory)
- Upgrade to larger instance (2GB → 4GB)
- Check for memory leaks in logs
- Verify MNE-Python version compatibility

### Frontend 404 on Refresh
- Vercel: Auto-configured for SPA routing
- VPS: Check Nginx `try_files` directive

### CORS Errors
- Verify `CORS_ORIGIN` matches frontend URL
- Check that credentials: true is set
- Inspect browser console for specific error

### Upload 413 Request Entity Too Large
- Increase Nginx `client_max_body_size` (VPS)
- Use direct-to-cloud upload (Cloudinary/S3) for large files

---

## Cost Breakdown

### Option A: Single VPS

| Item | Provider | Cost |
|------|----------|------|
| VPS (4GB RAM, 2 vCPU) | DigitalOcean | $24/month |
| MongoDB Atlas M0 | MongoDB | Free |
| Cloudinary | Cloudinary | Free |
| Domain | Namecheap | $12/year |
| SSL | Let's Encrypt | Free |
| **Total** | | **~$25/month** |

### Option B: Managed Services

| Item | Provider | Cost |
|------|----------|------|
| Frontend | Vercel | Free |
| Backend | Render (Starter) | $7/month |
| ML API | Render (Standard 2GB) | $21/month |
| MongoDB Atlas M0 | MongoDB | Free |
| Cloudinary | Cloudinary | Free |
| Domain (optional) | Namecheap | $12/year |
| **Total** | | **$28/month + $12/year** |

**Note:** Free tiers available on Railway/Render (with sleep after inactivity)

---

## Recommended Deployment Path

**For Quick MVP:** Option B (Managed Services)
- Fastest to deploy (< 1 hour)
- Auto-scaling and SSL
- Built-in monitoring

**For Long-Term Production:** Option A (VPS)
- Full control
- Lower cost at scale
- Custom infrastructure

**Hybrid Approach:**
- Frontend → Vercel (free, fast CDN)
- Backend + ML API → Single VPS (Docker Compose)
- Cost: ~$12-24/month

---

## Next Steps

1. Choose deployment option (A or B)
2. Complete pre-deployment checklist
3. Set up external services (MongoDB, Cloudinary)
4. Follow step-by-step guide for chosen option
5. Run post-deployment validation
6. Set up monitoring and backups
7. Document your specific URLs and credentials (securely!)

---

**Questions or Issues?**
- Check Troubleshooting section above
- Review service logs
- Open GitHub issue with deployment details
