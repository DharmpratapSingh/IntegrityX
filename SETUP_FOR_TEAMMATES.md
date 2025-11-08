# 🚀 IntegrityX - Setup Guide for Teammates

**Quick Start Guide for New Team Members**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone Repository](#clone-repository)
3. [Environment Setup](#environment-setup)
4. [Running the Application](#running-the-application)
5. [Accessing the App](#accessing-the-app)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you start, make sure you have these installed:

### **Required:**

1. **Git**
   ```bash
   # Check if installed
   git --version

   # If not installed, download from: https://git-scm.com/
   ```

2. **Docker & Docker Compose** (RECOMMENDED - Easiest method)
   ```bash
   # Check if installed
   docker --version
   docker-compose --version

   # If not installed:
   # - Mac: https://docs.docker.com/desktop/install/mac-install/
   # - Windows: https://docs.docker.com/desktop/install/windows-install/
   # - Linux: https://docs.docker.com/desktop/install/linux-install/
   ```

### **Alternative (if not using Docker):**

3. **Python 3.12+**
   ```bash
   python3 --version
   # Should be 3.12 or higher
   ```

4. **Node.js 18+**
   ```bash
   node --version
   # Should be 18 or higher
   ```

5. **PostgreSQL 16**
   - Download: https://www.postgresql.org/download/

6. **Redis**
   - Download: https://redis.io/download

---

## 📥 Clone Repository

### **Step 1: Clone the repository**

```bash
# Open terminal and navigate to where you want the project
cd ~/Projects  # Or any directory you prefer

# Clone the repository
git clone https://github.com/DharmpratapSingh/IntegrityX.git

# Navigate into the project
cd IntegrityX
```

### **Step 2: Verify you have all files**

```bash
# List files
ls -la

# You should see:
# - backend/
# - frontend/
# - docker-compose.yml
# - README.md
# - And many other files
```

---

## 🔧 Environment Setup

### **Step 1: Create Environment File**

```bash
# Copy the example environment file
cp .env.example .env

# If .env.example doesn't exist, create .env manually:
touch .env
```

### **Step 2: Edit `.env` file**

Open `.env` in your favorite text editor and add:

```bash
# Database Configuration
POSTGRES_DB=integrityx
POSTGRES_USER=integrityx_user
POSTGRES_PASSWORD=changeme123

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Clerk Authentication (Get keys from https://clerk.com)
CLERK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Walacor Configuration
WALACOR_API_KEY=your_walacor_api_key
WALACOR_API_URL=https://api.walacor.com

# Encryption Key (Generate a random 32-byte key)
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# API Configuration
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Environment
ENVIRONMENT=development
DEBUG=true
NODE_ENV=development
```

### **Step 3: Get API Keys**

1. **Clerk Keys** (for authentication):
   - Go to https://clerk.com
   - Sign up / Sign in
   - Create a new application
   - Copy the keys to `.env`

2. **Walacor API Key**:
   - Contact the team lead for the Walacor API key
   - Or get from: https://walacor.com (if available)

3. **Encryption Key**:
   ```bash
   # Generate a random key
   python3 -c "import secrets; print(secrets.token_hex(32))"
   # Copy the output to ENCRYPTION_KEY in .env
   ```

---

## 🚀 Running the Application

### **Method 1: Docker Compose (RECOMMENDED - Easiest)** ⭐

This starts everything (database, backend, frontend) in one command.

```bash
# Start all services
docker-compose up -d

# Check if everything is running
docker-compose ps

# You should see:
# - integrityx_postgres    (running)
# - integrityx_redis       (running)
# - integrityx_backend     (running)
# - integrityx_frontend    (running)
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stop the app:**
```bash
docker-compose down
```

---

### **Method 2: Docker with Rebuild (if you made code changes)**

```bash
# Rebuild and start
docker-compose up --build

# Or rebuild specific service
docker-compose up --build backend
```

---

### **Method 3: Manual Setup (Without Docker)**

Use this if Docker isn't working or you want to run services separately.

#### **Terminal 1 - Database & Redis**

```bash
# Start PostgreSQL (if installed locally)
# Mac:
brew services start postgresql@16

# Linux:
sudo systemctl start postgresql

# Windows: Start from Services app

# Start Redis
# Mac:
brew services start redis

# Linux:
sudo systemctl start redis

# Windows: Start from Services app or use WSL
```

#### **Terminal 2 - Backend**

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (if needed)
python -m alembic upgrade head

# Start backend server
uvicorn main:app --reload --port 8000
```

#### **Terminal 3 - Frontend**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🌐 Accessing the App

Once running, open these URLs in your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:8000 | REST API |
| **API Documentation** | http://localhost:8000/docs | Interactive Swagger UI |
| **Alternative API Docs** | http://localhost:8000/redoc | ReDoc documentation |
| **Health Check** | http://localhost:8000/health | Backend health status |

---

## 🧪 Testing

### **Quick Test - Upload a Document**

1. Go to http://localhost:3000
2. Sign up / Sign in (using Clerk)
3. Go to "Upload" page
4. Upload this test file: `data/documents/demo_loan_auto_populate.json`
5. You should see:
   - ✅ Form auto-fills
   - ✅ Document uploads successfully
   - ✅ ETID is generated
   - ✅ Walacor TX ID is returned

### **Run Backend Tests**

```bash
# With Docker
docker-compose exec backend pytest

# Without Docker
cd backend
pytest backend/tests/
```

### **Run Frontend Tests**

```bash
# With Docker
docker-compose exec frontend npm test

# Without Docker
cd frontend
npm test
```

---

## 🐛 Troubleshooting

### **Issue 1: Port Already in Use**

```bash
# Check what's using the port
# Mac/Linux:
lsof -i :3000  # or :8000, :5432
sudo kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### **Issue 2: Docker Containers Won't Start**

```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild everything
docker-compose up --build
```

### **Issue 3: Database Connection Error**

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### **Issue 4: Frontend Shows Blank Page**

```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev

# Or with Docker
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

### **Issue 5: "Module not found" errors**

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules
npm install
```

### **Issue 6: Permission Denied (Docker)**

```bash
# Mac/Linux: Add your user to docker group
sudo usermod -aG docker $USER

# Then log out and log back in

# Or run with sudo (not recommended)
sudo docker-compose up
```

---

## 📱 Quick Commands Cheat Sheet

### **Docker Commands**

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Execute command in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Remove everything (including volumes)
docker-compose down -v
```

### **Git Commands**

```bash
# Pull latest changes
git pull origin main

# Check current branch
git branch

# See what changed
git status

# Discard local changes
git restore .

# Update your branch
git fetch origin
git merge origin/main
```

### **Backend Commands**

```bash
# Run migrations
docker-compose exec backend python -m alembic upgrade head

# Create new migration
docker-compose exec backend python -m alembic revision -m "description"

# Open Python shell
docker-compose exec backend python

# Run tests
docker-compose exec backend pytest
```

### **Frontend Commands**

```bash
# Install new package
docker-compose exec frontend npm install <package-name>

# Build for production
docker-compose exec frontend npm run build

# Run linter
docker-compose exec frontend npm run lint

# Run tests
docker-compose exec frontend npm test
```

---

## 📚 Additional Resources

### **Documentation**

- **README.md** - Project overview
- **DEMO_TESTING_GUIDE.md** - Complete testing guide with demo documents
- **DEMO_QUICK_REFERENCE.md** - Quick reference for demos
- **FORENSIC_FEATURES.md** - Forensic analysis features
- **WALACOR_INTEGRATION_DEEP_DIVE.md** - Walacor integration details
- **DOCKER_GUIDE.md** - Detailed Docker setup

### **API Documentation**

- Swagger UI: http://localhost:8000/docs
- Postman Collection: `docs/api/IntegrityX.postman_collection.json`
- API Guide: `docs/api/API_GUIDE.md`

### **Demo Files**

Test documents are in `data/documents/`:
- `demo_loan_auto_populate.json` - For testing auto-populate
- `demo_loan_application_clean.json` - Clean loan application
- `demo_loan_application_tampered.json` - For forensic testing
- `demo_loan_application_fraudulent.json` - For pattern detection

---

## 🆘 Getting Help

### **If you're stuck:**

1. **Check the logs:**
   ```bash
   docker-compose logs -f
   ```

2. **Check our documentation:**
   - README.md
   - DEMO_TESTING_GUIDE.md
   - Troubleshooting section above

3. **Ask the team:**
   - Slack/Discord channel
   - Team lead contact
   - GitHub Issues: https://github.com/DharmpratapSingh/IntegrityX/issues

4. **Common issues are documented in:**
   - This file (TROUBLESHOOTING section)
   - DOCKER_GUIDE.md

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] All Docker containers are running (`docker-compose ps`)
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API docs load at http://localhost:8000/docs
- [ ] Can sign up/sign in
- [ ] Can upload a test document
- [ ] Document gets ETID and Walacor TX ID
- [ ] Can verify document
- [ ] No errors in logs

---

## 🎯 Next Steps

Once you have the app running:

1. **Explore the features:**
   - Upload documents
   - Test forensic analysis
   - Try pattern detection
   - Review verification portal

2. **Read the documentation:**
   - FORENSIC_FEATURES.md
   - WALACOR_INTEGRATION_DEEP_DIVE.md

3. **Run the tests:**
   - Backend: `docker-compose exec backend pytest`
   - Frontend: `docker-compose exec frontend npm test`

4. **Start developing:**
   - Check CONTRIBUTING.md for coding guidelines
   - Create a new branch for your work
   - Follow the Git workflow

---

## 👥 Team Collaboration

### **Before you start working:**

```bash
# Always pull latest changes
git pull origin main

# Create a new branch for your work
git checkout -b feature/your-feature-name

# Make your changes...

# Commit your changes
git add .
git commit -m "feat: description of your changes"

# Push your branch
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

### **Keep your branch updated:**

```bash
# Pull latest from main
git checkout main
git pull origin main

# Switch back to your branch
git checkout feature/your-feature-name

# Merge main into your branch
git merge main
```

---

## 🚀 Production Deployment

For production deployment instructions, see:
- **DOCKER_GUIDE.md** - Production Docker setup
- **CICD_SETUP_GUIDE.md** - CI/CD pipeline setup
- **docker-compose.prod.yml** - Production configuration

---

**Welcome to the IntegrityX team!** 🎉

If you have any questions, don't hesitate to ask!
