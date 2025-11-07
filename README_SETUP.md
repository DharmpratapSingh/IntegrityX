# 🚀 IntegrityX Quick Setup

## One-Time Setup

### Backend Setup (Automatic)
```bash
cd backend
./setup.sh
```

This script will:
- ✅ Check Python version
- ✅ Create virtual environment (if needed)
- ✅ Install ALL dependencies from requirements.txt
- ✅ Verify all critical packages

### Frontend Setup
```bash
cd frontend
npm install
```

---

## Daily Usage

### Start Backend
```bash
cd backend
./start_backend.sh
```

**Or manually:**
```bash
cd backend
source ../venv/bin/activate
python start_server.py
```

### Start Frontend
```bash
cd frontend
npm run dev
```

---

## Access Points

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/api/health |

---

## Troubleshooting

### Backend won't start?
```bash
# Re-run setup
cd backend
./setup.sh

# Check what's wrong
source ../venv/bin/activate
python -c "import fastapi, sklearn, argon2; print('OK')"
```

### Port already in use?
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Dependencies out of sync?
```bash
cd backend
source ../venv/bin/activate
pip install -r requirements.txt --upgrade
```

---

## What Was Fixed

### ✅ Complete requirements.txt
Added all missing dependencies:
- `python-multipart` (FastAPI forms)
- `scikit-learn`, `pandas`, `numpy` (ML)
- `argon2-cffi`, `cryptography`, `pycryptodome` (security)
- `psutil` (system monitoring)

### ✅ Fixed Version Constraints
- Changed `walacor-python-sdk>=1.0.0` to `>=0.1.5`

### ✅ Automated Setup
- Created `setup.sh` for one-command setup
- Created `start_backend.sh` for easy server start

### ✅ Comprehensive Documentation
- `SETUP_GUIDE.md` - Full setup instructions
- `README_SETUP.md` - Quick reference (this file)

---

## File Changes

| File | Status | Description |
|------|--------|-------------|
| `backend/requirements.txt` | ✅ FIXED | Added all missing dependencies |
| `backend/setup.sh` | ✅ NEW | Automated setup script |
| `backend/start_backend.sh` | ✅ NEW | Quick start script |
| `SETUP_GUIDE.md` | ✅ NEW | Comprehensive guide |
| `README_SETUP.md` | ✅ NEW | Quick reference |

---

## Next Steps

1. **Run setup once:**
   ```bash
   cd backend && ./setup.sh
   cd frontend && npm install
   ```

2. **Start both services:**
   ```bash
   # Terminal 1
   cd backend && ./start_backend.sh
   
   # Terminal 2
   cd frontend && npm run dev
   ```

3. **Open browser:**
   - http://localhost:3000 (Frontend)
   - Enjoy your new gradient UI! 🎨

---

**You're all set!** 🎉

The project is now properly configured and documented. Future setups will be as simple as running `./setup.sh`.














