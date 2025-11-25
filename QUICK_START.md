# ⚡ IntegrityX - Quick Start (5 Minutes)

**The fastest way to get IntegrityX running**

---

## 🎯 Prerequisites

You need **only** Docker Desktop installed:
- Mac: https://docs.docker.com/desktop/install/mac-install/
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

---

## 🚀 Setup (3 Steps)

### **1. Clone Repository**

```bash
git clone https://github.com/DharmpratapSingh/IntegrityX.git
cd IntegrityX
```

### **2. Create Environment File**

```bash
# Copy example
cp .env.example .env

# Or create manually with these contents:
cat > .env << 'EOF'
# Database
POSTGRES_DB=integrityx
POSTGRES_USER=integrityx_user
POSTGRES_PASSWORD=changeme123

# Redis
REDIS_URL=redis://redis:6379/0

# Clerk Auth (Get from https://clerk.com)
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Walacor (Ask team lead)
WALACOR_API_KEY=your_key_here
WALACOR_API_URL=https://api.walacor.com

# Encryption (Generate: python3 -c "import secrets; print(secrets.token_hex(32))")
ENCRYPTION_KEY=your_32_byte_key_here

# Environment
ENVIRONMENT=development
DEBUG=true
EOF
```

### **3. Start Application**

```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

---

## ✅ Access the App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 🧪 Test It Works

1. Go to http://localhost:3000
2. Sign up (use any email for development)
3. Upload file: `data/documents/demo_loan_auto_populate.json`
4. ✅ Should get ETID and Walacor TX ID

---

## 🛑 Stop the App

```bash
docker-compose down
```

---

## 🐛 Having Issues?

### **Port already in use:**
```bash
# Stop other services on ports 3000, 8000, 5432, 6379
docker-compose down
```

### **Containers won't start:**
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

### **Frontend blank page:**
```bash
docker-compose restart frontend
```

### **Need help?**
See detailed guide: **SETUP_FOR_TEAMMATES.md**

---

## 📚 What's Next?

- **Test the app:** DEMO_TESTING_GUIDE.md
- **Learn features:** FORENSIC_FEATURES.md
- **API reference:** http://localhost:8000/docs
- **Full setup guide:** SETUP_FOR_TEAMMATES.md

---

**That's it! You're running IntegrityX!** 🎉



