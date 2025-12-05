#!/bin/bash

###############################################################################
# 🚀 EpiCareHub - Automated Service Startup Script
#
# This script automatically:
# 1. 🔍 Checks if ports 3000, 8000, 5173 are available
# 2. 💀 Kills any processes blocking those ports (with confirmation)
# 3. 🎬 Starts Backend, Python ML, and Frontend services in separate terminals
#
# Usage: ./start-all-services.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                   ║${NC}"
echo -e "${CYAN}║${NC}   ${BOLD}${PURPLE}🏥 EpiCareHub Service Startup Script 🚀${NC}     ${CYAN}║${NC}"
echo -e "${CYAN}║                                                   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Function: Check if a port is in use
###############################################################################
check_port() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

###############################################################################
# Function: Kill processes on a port
###############################################################################
kill_port() {
    local port=$1
    local pids=$(check_port $port)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use by process(es): $pids${NC}"
        echo -e "${YELLOW}💀 Killing process(es)...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1

        # Verify port is now free
        if [ -z "$(check_port $port)" ]; then
            echo -e "${GREEN}✅ Port $port is now free${NC}\n"
        else
            echo -e "${RED}❌ Failed to free port $port${NC}\n"
            return 1
        fi
    else
        echo -e "${GREEN}✅ Port $port is available${NC}\n"
    fi
}

###############################################################################
# Step 1: Check and free ports
###############################################################################
echo -e "${BOLD}${BLUE}📋 Step 1/6: Checking ports 3000, 8000, 5173...${NC}\n"

# Backend port 3000
echo -e "${CYAN}🔌 Checking Backend port 3000...${NC}"
kill_port 3000

# Python ML port 8000
echo -e "${CYAN}🔌 Checking Python ML port 8000...${NC}"
kill_port 8000

# Frontend port 5173
echo -e "${CYAN}🔌 Checking Frontend port 5173...${NC}"
kill_port 5173

###############################################################################
# Step 2: Verify environment files exist
###############################################################################
echo -e "${BOLD}${BLUE}📋 Step 2/6: Verifying .env files...${NC}\n"

check_env_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        echo -e "${YELLOW}⚠️  Please create this file before starting services.${NC}"
        echo -e "${YELLOW}📖 See STARTUP_GUIDE.md for details.${NC}\n"
        return 1
    fi
}

check_env_file "$PROJECT_ROOT/Backend/.env"
check_env_file "$PROJECT_ROOT/Frontend/.env"
check_env_file "$PROJECT_ROOT/Localization-Algorithm/.env"

echo ""

###############################################################################
# Step 3: Check if dependencies are installed
###############################################################################
echo -e "${BOLD}${BLUE}📋 Step 3/6: Checking dependencies...${NC}\n"

# Check Backend node_modules
if [ ! -d "$PROJECT_ROOT/Backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Backend dependencies not installed. Running npm install...${NC}"
    cd "$PROJECT_ROOT/Backend"
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}\n"
else
    echo -e "${GREEN}✅ Backend dependencies found${NC}\n"
fi

# Check Frontend node_modules
if [ ! -d "$PROJECT_ROOT/Frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Frontend dependencies not installed. Running npm install...${NC}"
    cd "$PROJECT_ROOT/Frontend"
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}\n"
else
    echo -e "${GREEN}✅ Frontend dependencies found${NC}\n"
fi

# Check Python conda environment
if ! conda env list | grep -q "^brain "; then
    echo -e "${YELLOW}🐍 Python 'brain' environment not found. Creating it...${NC}"
    cd "$PROJECT_ROOT/Localization-Algorithm"
    conda env create -f environment.yml
    echo -e "${GREEN}✅ Python environment created${NC}\n"
else
    echo -e "${GREEN}✅ Python 'brain' environment found${NC}\n"
fi

###############################################################################
# Step 4: Start services in separate terminal windows
###############################################################################
echo -e "${BOLD}${BLUE}📋 Step 4/6: Starting services in separate terminals...${NC}\n"

# Function to open new terminal based on OS
open_terminal_tab() {
    local title=$1
    local command=$2

    # macOS Terminal
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript <<EOF
tell application "Terminal"
    activate
    do script "cd $PROJECT_ROOT && $command"
    set custom title of front window to "$title"
end tell
EOF
    # iTerm2 (if available)
    elif command -v iterm 2>&1 >/dev/null; then
        osascript <<EOF
tell application "iTerm"
    create window with default profile
    tell current session of current window
        write text "cd $PROJECT_ROOT && $command"
        set name to "$title"
    end tell
end tell
EOF
    else
        echo -e "${RED}❌ Could not detect terminal application. Please start services manually.${NC}"
        return 1
    fi
}

# Start Backend
echo -e "${GREEN}🚀 Starting Backend (Port 3000)...${NC}"
open_terminal_tab "🖥️ EpiCareHub - Backend" "cd Backend && npm start"
sleep 2

# Start Python ML Service
echo -e "${GREEN}🚀 Starting Python ML Service (Port 8000)...${NC}"
open_terminal_tab "🐍 EpiCareHub - Python ML" "cd Localization-Algorithm && conda activate brain && uvicorn brain_api:app --reload --host 0.0.0.0 --port 8000"
sleep 2

# Start Frontend
echo -e "${GREEN}🚀 Starting Frontend (Port 5173)...${NC}"
open_terminal_tab "⚛️ EpiCareHub - Frontend" "cd Frontend && npm run dev"
sleep 2

###############################################################################
# Step 5: Wait for services to start and verify
###############################################################################
echo -e "\n${BOLD}${BLUE}📋 Step 5/6: Waiting for services to start...${NC}\n"

# Progress indicator with emojis
echo -e "${CYAN}⏳ Please wait while services initialize (30 seconds)${NC}"
echo -n "${YELLOW}"
for i in {1..30}; do
    case $((i % 4)) in
        0) echo -n "🔄 " ;;
        1) echo -n "⏱️  " ;;
        2) echo -n "⌛ " ;;
        3) echo -n "🕐 " ;;
    esac
    sleep 1
done
echo -e "${NC}\n"

###############################################################################
# Step 6: Verify services are running
###############################################################################
echo -e "${BOLD}${BLUE}📋 Step 6/6: Verifying services...${NC}\n"

# Check Backend
echo -e "${CYAN}🔍 Checking Backend (http://localhost:3000/health)...${NC}"
if curl -s --max-time 5 http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running and healthy!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Backend might not be ready yet. Check the Backend terminal.${NC}\n"
fi

# Check Python ML
echo -e "${CYAN}🔍 Checking Python ML (http://localhost:8000/health)...${NC}"
if curl -s --max-time 5 http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Python ML is running and healthy!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Python ML might not be ready yet. Check the Python terminal.${NC}\n"
fi

# Check Frontend
echo -e "${CYAN}🔍 Checking Frontend (http://localhost:5173)...${NC}"
if curl -s --max-time 5 http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running and healthy!${NC}\n"
else
    echo -e "${YELLOW}⚠️  Frontend might not be ready yet. Check the Frontend terminal.${NC}\n"
fi

###############################################################################
# Done!
###############################################################################
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                   ║${NC}"
echo -e "${CYAN}║${NC}     ${BOLD}${GREEN}🎉 All services have been started! 🎉${NC}      ${CYAN}║${NC}"
echo -e "${CYAN}║                                                   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BOLD}${PURPLE}🌐 Services running at:${NC}"
echo -e "  ${GREEN}🖥️  Backend:${NC}    http://localhost:3000"
echo -e "  ${GREEN}🐍 Python ML:${NC}  http://localhost:8000"
echo -e "  ${GREEN}⚛️  Frontend:${NC}   http://localhost:5173"
echo -e ""
echo -e "${BOLD}${PURPLE}📚 API Documentation:${NC}"
echo -e "  ${GREEN}📖 Python API Docs:${NC} http://localhost:8000/docs"
echo -e ""
echo -e "${YELLOW}💡 Note: Check the individual terminal windows for detailed logs.${NC}"
echo -e "${YELLOW}🔧 If any service failed to start, check STARTUP_GUIDE.md for troubleshooting.${NC}\n"

# Optional: Open browser to frontend
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "🌐 Open http://localhost:5173 in browser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 Opening browser...${NC}\n"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:5173
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:5173
    fi
    sleep 1
fi

echo ""
echo -e "${BOLD}${GREEN}✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨${NC}"
echo -e "${BOLD}${GREEN}     🎊 EpiCareHub is ready to use! 🎊${NC}"
echo -e "${BOLD}${GREEN}✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨${NC}"
echo ""
