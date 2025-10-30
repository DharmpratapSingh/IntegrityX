# IntegrityX Setup Guide

## 🚀 Quick Start

### Prerequisites
- Python 3.12+ installed
- Node.js 18+ and npm installed
- Git installed

---

## 📦 Backend Setup

### 1. Create Virtual Environment
```bash
cd /path/to/IntegrityX_Python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install All Dependencies
```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

**Note:** This will install:
- ✅ FastAPI & Uvicorn (web framework)
- ✅ SQLAlchemy & Alembic (database)
- ✅ scikit-learn, pandas, numpy (ML/analytics)
- ✅ argon2-cffi, cryptography (security)
- ✅ python-multipart (form handling)
- ✅ All other dependencies

### 3. Verify Installation
```bash
cd backend
python -c "import fastapi, sklearn, argon2; print('✅ All packages installed!')"
```

### 4. Start Backend Server
```bash
cd backend
source ../venv/bin/activate
python start_server.py
```

**Backend will run at:** http://localhost:8000

---

## 🎨 Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Frontend
```bash
npm run dev
```

**Frontend will run at:** http://localhost:3000

---

## ✅ Verify Both Services

### Check Backend
```bash
curl http://localhost:8000/api/health
```

Expected: JSON response with `"ok": true`

### Check Frontend
Open browser: http://localhost:3000

Expected: Landing page with animated gradients

---

## 🔧 Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution:** Ensure virtual environment is activated and all packages installed
```bash
source venv/bin/activate
pip install -r backend/requirements.txt
```

### Issue: "No module named 'src'"
**Solution:** Run from `backend/` directory, not project root
```bash
cd backend
python start_server.py
```

### Issue: "Address already in use" (Port 8000)
**Solution:** Kill existing process
```bash
lsof -ti:8000 | xargs kill -9
```

### Issue: Frontend can't connect to backend
**Solution:** Ensure backend is running on port 8000
```bash
curl http://localhost:8000/api/health
```

---

## 📁 Project Structure

```
IntegrityX_Python/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── start_server.py      # Server startup script
│   ├── requirements.txt     # Python dependencies (COMPLETE)
│   └── src/                 # Source code modules
│
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── package.json         # Node dependencies
│   └── tailwind.config.ts   # Tailwind configuration
│
├── venv/                    # Python virtual environment
└── SETUP_GUIDE.md          # This file
```

---

## 🎯 Running in Development

### Terminal 1 - Backend
```bash
cd backend
source ../venv/bin/activate
python start_server.py
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

---

## 🚢 Production Deployment

### Backend (Production)
```bash
cd backend
source ../venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend (Production Build)
```bash
cd frontend
npm run build
npm start
```

---

## 📝 Environment Variables

### Backend (.env)
Create `.env` in project root:
```bash
DEMO_MODE=false
AWS_S3_BUCKET=your-bucket-name
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/integrityx
```

### Frontend (.env.local)
Create `.env.local` in frontend/:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-key
CLERK_SECRET_KEY=your-secret
```

---

## 🔄 Updating Dependencies

### Backend
```bash
source venv/bin/activate
pip install --upgrade -r backend/requirements.txt
```

### Frontend
```bash
cd frontend
npm update
```

---

## 📊 Health Checks

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Backend Health | http://localhost:8000/api/health | `{"ok": true}` |
| Backend Docs | http://localhost:8000/docs | Swagger UI |
| Frontend | http://localhost:3000 | Landing page |

---

## 🐛 Common Issues Fixed

### ✅ Issue: Missing Dependencies
**Fixed:** Updated `requirements.txt` with all packages:
- scikit-learn (ML models)
- argon2-cffi (security)
- python-multipart (forms)

### ✅ Issue: Wrong walacor-sdk Version
**Fixed:** Changed from `>=1.0.0` to `>=0.1.5`

### ✅ Issue: Import Errors
**Fixed:** Must run from `backend/` directory

---

## 💡 Tips

1. **Always activate venv before running backend:**
   ```bash
   source venv/bin/activate
   ```

2. **Run backend from backend/ directory:**
   ```bash
   cd backend && python start_server.py
   ```

3. **Check logs if issues occur:**
   ```bash
   tail -f logs/backend_output.log
   ```

4. **Restart both services after code changes**

---

## 🎉 Success Indicators

When everything is running correctly, you should see:

### Backend Terminal
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete
✅ All services initialized successfully
```

### Frontend Terminal
```
✓ Ready in 1433ms
- Local: http://localhost:3000
```

### Browser
- Animated gradient backgrounds
- Trust signals section
- Dashboard with live data

---

## 📞 Need Help?

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Verify all dependencies are installed
3. Ensure you're running from correct directories
4. Check logs in `logs/` directory

---

**Last Updated:** October 28, 2025
**Version:** 1.0.0

