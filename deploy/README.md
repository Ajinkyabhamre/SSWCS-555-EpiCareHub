# Deploy Folder

This folder contains deployment configuration files and guides for EpiCareHub.

## Files

- **[deployment-plan.md](deployment-plan.md)** - Complete deployment guide with 2 options:
  - Option A: Single VPS (Docker Compose + Nginx)
  - Option B: Managed Services (Vercel + Render/Railway)

- **nginx-vps.conf** - Nginx reverse proxy configuration for VPS deployment
  - SSL/TLS termination
  - Reverse proxy for all 3 services
  - Upload size limits (500MB)
  - Health check endpoints

## Quick Links

- [Full Deployment Plan](deployment-plan.md)
- [VPS Nginx Config](nginx-vps.conf)
- [Root README](../README.md)

## Before You Deploy

1. Complete pre-deployment checklist in deployment-plan.md
2. Fix CORS and add /health endpoint (see critical issues)
3. Set up MongoDB Atlas and Cloudinary accounts
4. Generate secrets: `openssl rand -hex 32`
5. Choose deployment option (A or B)
6. Follow step-by-step guide in deployment-plan.md

## Support

- Open GitHub issue for deployment questions
- Check troubleshooting section in deployment-plan.md
