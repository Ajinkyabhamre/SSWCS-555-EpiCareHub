# EpiCareHub Development Setup Guide

This guide will help you set up and run the entire EpiCareHub platform locally on your machine. The system consists of three main services: Frontend (React), Backend (Node.js/Express), and a Python ML microservice.

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required
- **Node.js**: v18 or higher (check with `node --version`)
- **npm**: v8 or higher (check with `npm --version`)
- **Python**: v3.11 or higher (check with `python --version`)
- **Conda**: For managing the Python ML environment (download from [Anaconda](https://www.anaconda.com/download))
- **MongoDB**: Either local installation or MongoDB Atlas account
  - **Local**: Install MongoDB Community Edition
  - **Cloud**: Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### Optional
- **Git**: For cloning and version control (check with `git --version`)
- **VS Code**: Recommended code editor with REST Client extension

---

## Project Structure Overview

```
SSWCS-555-EpiCareHub/
├── Frontend/                      # React + Vite web application
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── Backend/                       # Node.js + Express API
│   ├── config/
│   ├── data/
│   ├── routes/
│   ├── app.js
│   ├── package.json
│   └── .env.example
│
├── Localization-Algorithm/        # Python FastAPI ML service
│   ├── brain_api.py
│   ├── brain_visualizer.py
│   ├── helper.py
│   ├── environment.yml
│   └── .env.example
│
├── .circleci/                     # CI/CD configuration
│   └── config.yml
│
├── package.json                   # Root-level convenience scripts
└── DEVELOPMENT_SETUP.md           # This file
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/2024S-SSW-555-EpiCareHub/SSWCS-555-EpiCareHub.git
cd SSWCS-555-EpiCareHub
```

---

## Step 2: Set Up Environment Variables

Environment variables are stored in `.env` files for each service. The `.env.example` files provide templates.

### Backend Environment Variables

1. Copy the example file:
   ```bash
   cp Backend/.env.example Backend/.env
   ```

2. Edit `Backend/.env` and update the values:
   ```bash
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/epicarehub
   MONGODB_DB_NAME=epicarehub

   # Session Secret (generate a random string)
   SESSION_SECRET=your_random_session_secret_here

   # Python ML Service
   PYTHON_API_URL=http://localhost:8000

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

   **MongoDB Connection Examples:**
   - **Local MongoDB**: `mongodb://localhost:27017/epicarehub`
   - **MongoDB Atlas**: `mongodb+srv://username:password@cluster-name.mongodb.net/epicarehub?retryWrites=true&w=majority`

### Frontend Environment Variables

1. Copy the example file:
   ```bash
   cp Frontend/.env.example Frontend/.env.local
   ```

2. Edit `Frontend/.env.local`:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   VITE_PYTHON_API_URL=http://localhost:8000
   ```

### Python ML Service Environment Variables

1. Copy the example file:
   ```bash
   cp Localization-Algorithm/.env.example Localization-Algorithm/.env
   ```

2. Edit `Localization-Algorithm/.env`:
   ```bash
   # Cloudinary Credentials (for image hosting)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Optional: MongoDB for metadata storage
   MONGODB_URI=mongodb://localhost:27017/epicarehub

   # Server Configuration
   PORT=8000
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   **Note**: Get Cloudinary credentials from https://cloudinary.com/

---

## Step 3: Install Dependencies

### Install Frontend Dependencies
```bash
cd Frontend
npm install
cd ..
```

### Install Backend Dependencies
```bash
cd Backend
npm install
cd ..
```

### Create Python ML Environment

The Python ML service uses Conda for environment management:

```bash
cd Localization-Algorithm
conda env create -f environment.yml
cd ..
```

Verify the environment was created:
```bash
conda env list
# You should see 'brain' in the list
```

---

## Step 4: Set Up MongoDB

Choose one option:

### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB Community Edition**:
   - macOS: `brew install mongodb-community`
   - Windows: Download from [MongoDB](https://www.mongodb.com/try/download/community)
   - Linux: Follow [official guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   ```bash
   # macOS
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Windows
   # MongoDB should start automatically or use MongoDB Compass to manage it
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongosh  # Should connect to local MongoDB
   ```

### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 free tier is sufficient)
3. Create a database user and whitelist your IP
4. Get the connection string: `mongodb+srv://username:password@cluster.mongodb.net/epicarehub`
5. Update `Backend/.env` with this connection string:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/epicarehub?retryWrites=true&w=majority
   ```

---

## Step 5: Running All Services Locally

You'll need **4 terminal windows/tabs** (or use tmux/screen):

### Terminal 1: MongoDB (if using local)

```bash
# This keeps MongoDB running
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# If not already running, start MongoDB service from Services
```

### Terminal 2: Python ML Service

```bash
cd Localization-Algorithm

# Activate the Conda environment
conda activate brain

# Run the FastAPI server
uvicorn brain_api:app --reload --port 8000

# Expected output:
# Uvicorn running on http://127.0.0.1:8000
# Press CTRL+C to quit
```

### Terminal 3: Backend API Server

```bash
cd Backend

# Install dependencies (first time only)
npm install

# Run the development server
npm run dev

# Expected output:
# We've now got a server!
# Your routes will be running on http://localhost:3000
```

### Terminal 4: Frontend Development Server

```bash
cd Frontend

# Install dependencies (first time only)
npm install

# Run the development server
npm run dev

# Expected output:
# VITE v5.1.4  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

---

## Step 6: Access the Application

Once all services are running, open your browser and navigate to:

**http://localhost:5173/**

You should see the EpiCareHub login page.

### Default Test Credentials

If test users exist in your database:
- **Username**: (check with your team)
- **Password**: (check with your team)

Or create a new account using the Registration page.

---

## Running Tests

### Frontend Tests

```bash
cd Frontend
npm test
# or watch mode
npm run test:watch
```

### Backend Tests

```bash
cd Backend
npm test
```

### Run All Tests from Root

```bash
npm test
```

---

## Troubleshooting

### MongoDB Connection Issues

**Error**: "connect ECONNREFUSED 127.0.0.1:27017"

**Solutions**:
1. Verify MongoDB is running: `mongosh`
2. Check `MONGODB_URI` in `.env` file
3. Restart MongoDB:
   ```bash
   # macOS
   brew services restart mongodb-community

   # Linux
   sudo systemctl restart mongod
   ```

### Python Environment Issues

**Error**: "Command 'uvicorn' not found"

**Solutions**:
1. Verify environment is activated: `conda activate brain`
2. Reinstall environment:
   ```bash
   conda env remove --name brain
   conda env create -f environment.yml
   conda activate brain
   ```

### Frontend Port Already in Use

**Error**: "Port 5173 is already in use"

**Solutions**:
1. Kill the process using the port:
   ```bash
   # macOS/Linux
   lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill -9

   # Windows
   netstat -ano | findstr :5173
   taskkill /PID <PID> /F
   ```

2. Or use a different port:
   ```bash
   cd Frontend
   npm run dev -- --port 5174
   ```

### Backend Port Conflict

**Error**: "Port 3000 is already in use"

**Solutions**:
```bash
# Change port in Backend/.env
PORT=3001

# Then restart Backend server
npm run dev
```

### Dependencies Installation Issues

**Error**: "npm ERR! peer dep missing"

**Solutions**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use npm ci for exact versions
npm ci
```

### Python Package Import Errors

**Error**: "ModuleNotFoundError: No module named 'torch'"

**Solutions**:
```bash
# Reinstall PyTorch with CPU support
conda activate brain
conda install pytorch torchvision torchaudio -c pytorch -c conda-forge
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Browser (http://localhost:5173)     │
└────────────────────┬────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    (5173)       (3000)       (8000)
        │            │            │
        ▼            ▼            ▼
   ┌─────────┐  ┌────────┐  ┌──────────┐
   │Frontend │  │Backend │  │ Python   │
   │React+   │  │Node.js │  │ FastAPI  │
   │Vite     │  │Express │  │ ML API   │
   └────┬────┘  └───┬────┘  └──────────┘
        │           │
        └─────┬─────┘
              │
        ┌─────▼──────┐
        │ MongoDB    │
        └────────────┘
```

---

## Common Development Workflows

### Adding a New Feature

1. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes in respective services
3. Test locally using the running services
4. Commit and push:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/my-feature
   ```

### Debugging Backend API

Use browser DevTools or REST client:

```bash
# Using curl
curl -X GET http://localhost:3000/patients \
  -H "Content-Type: application/json"

# Or use VS Code REST Client extension with requests.http file
```

### Debugging Frontend Issues

Use React DevTools browser extension and Vue/React dev tools.

---

## Environment File Checklist

Before running the application, verify you have:

- [ ] `Backend/.env` created and configured
- [ ] `Frontend/.env.local` created and configured
- [ ] `Localization-Algorithm/.env` created and configured
- [ ] MongoDB is running or Atlas connection is configured
- [ ] All npm packages installed (`node_modules` exists in Frontend/ and Backend/)
- [ ] Python conda environment created (`brain`)

---

## Next Steps

Once the application is running:

1. **Register a new user**: http://localhost:5173/register
2. **Login**: http://localhost:5173/signin
3. **Create a patient**: Navigate to Patients page
4. **Upload EEG file**: Click on a patient and upload an EEG file
5. **View visualizations**: Brain visualization should display on the patient details page

---

## CI/CD Pipeline

The project uses CircleCI for continuous integration:

- **Frontend Tests**: Run on every push to any branch
- **Backend Tests**: Run on every push to any branch
- Deployment jobs can be enabled for production builds

View CI status: https://app.circleci.com/

---

## Getting Help

- Check the main [README.md](./README.md) for project overview
- Review the [DETAILED_PROJECT_EXPLANATION.md](./DETAILED_PROJECT_EXPLANATION.md) for architecture details
- Check CircleCI logs for build failures: https://app.circleci.com/
- Review backend logs in the terminal where it's running
- Check browser console for frontend errors (F12 in browser)

---

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MNE Python Documentation](https://mne.tools/)
- [Three.js Documentation](https://threejs.org/docs/)

---

## Updating Dependencies

To update dependencies to their latest versions:

```bash
# Frontend
cd Frontend
npm update
npm outdated  # Check for available updates
cd ..

# Backend
cd Backend
npm update
npm outdated
cd ..

# Python (Conda)
cd Localization-Algorithm
conda activate brain
conda update --all
cd ..
```

---

**Last Updated**: December 2024

For the most up-to-date setup information, check the repository wiki or team documentation.
