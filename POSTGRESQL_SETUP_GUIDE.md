# 🐘 PostgreSQL Setup Guide for IntegrityX

## 📋 Overview

IntegrityX uses **PostgreSQL as the default database** for production environments. This guide will help you set up and configure PostgreSQL properly.

---

## 🚨 Important

IntegrityX is PostgreSQL-only. SQLite fallback paths have been removed from the application code and are not supported.

---

## 🔧 Prerequisites

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

---

## 📦 Install Python Dependencies

```bash
cd backend
pip install -r requirements-postgresql.txt
```

**Key packages installed:**
- `psycopg2-binary==2.9.9` - PostgreSQL adapter
- `sqlalchemy[postgresql]==2.0.23` - SQLAlchemy with PostgreSQL support

---

## 🗄️ Database Setup

### 1. Create Database and User

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Or on macOS:
psql postgres
```

```sql
-- Create database
CREATE DATABASE integrityx;

-- Create user
CREATE USER integrityx_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE integrityx TO integrityx_user;

-- Connect to the database
\c integrityx

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO integrityx_user;

-- Exit
\q
```

---

## ⚙️ Environment Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
DATABASE_URL=postgresql://integrityx_user:your_secure_password@localhost:5432/integrityx

# Walacor Configuration
WALACOR_HOST=13.220.225.175
WALACOR_PORT=80
WALACOR_USERNAME=Admin
WALACOR_PASSWORD=Th!51s1T@gMu

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here
SECRET_KEY=your-secret-key-for-jwt-tokens

# Application
DEMO_MODE=false
LOG_LEVEL=INFO
AUDIT_LOG_ENABLED=true
```

### Root Configuration

Create a `.env` file in the root directory:

```bash
# .env (root directory)
DATABASE_URL=postgresql://integrityx_user:your_secure_password@localhost:5432/integrityx
WALACOR_HOST=13.220.225.175
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

---

## 🔄 Database Migrations

### Initialize Alembic (if not already done)

```bash
cd backend
alembic upgrade head
```

This will create all necessary tables in PostgreSQL.

---

## ✅ Verify Setup

### 1. Test Database Connection

```bash
cd backend
python test_connection.py
```

Expected output:
```
✅ Database connection successful!
Database type: PostgreSQL
Tables found: artifacts, artifact_files, artifact_events, deleted_documents
```

### 2. Check Database URL in Application

Start the backend:
```bash
cd backend
python main.py
```

Look for this log message:
```
✅ Database service initialized with: postgresql://integrityx_user:****@localhost:5432/integrityx
```

**NOT this** (which indicates SQLite fallback):
```
✅ Database service initialized with SQLite (fallback)
```

---

## 🔍 Troubleshooting

### Issue: "Connection refused"

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL if not running
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql
```

### Issue: "Authentication failed"

**Solution:**
- Verify username and password in DATABASE_URL
- Check PostgreSQL pg_hba.conf settings
- Ensure user has proper permissions

### Issue: "Database does not exist"

**Solution:**
```bash
createdb -U postgres integrityx
# Or use the SQL command shown earlier
```

### Issue: Still seeing SQLite

**Possible causes:**
1. ❌ `.env` file not in the correct location
2. ❌ `DATABASE_URL` not set correctly
3. ❌ Application not restarted after .env change
4. ❌ .env file being ignored by .gitignore

**Solution:**
```bash
# Verify .env file exists
ls -la backend/.env

# Check if DATABASE_URL is set
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DATABASE_URL'))"

# Should output: postgresql://integrityx_user:...
```

---

## 🔐 Security Best Practices

### 1. Strong Passwords

```bash
# Generate a secure password
openssl rand -base64 32
```

### 2. Environment Variables

**Never commit `.env` files to Git!**

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

### 3. Connection Pooling

The application automatically uses connection pooling:
- Pool size: 10 connections
- Max overflow: 20 connections
- Pool pre-ping: Enabled

---

## 📊 Performance Optimization

### 1. Enable Connection Pooling

Already configured in `database.py`:
```python
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)
```

### 2. Add Indexes (if needed)

```sql
-- Already included in models.py, but you can add custom indexes:
CREATE INDEX idx_custom_search ON artifacts(loan_id, created_at);
```

### 3. PostgreSQL Configuration

Edit `postgresql.conf`:
```ini
# Increase shared buffers for better performance
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 128MB
```

---

## 🔄 Migration Notes

If you previously stored data in SQLite, migrate it externally before using IntegrityX. The app does not provide built-in SQLite migration commands.

---

## 📈 Monitoring

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('integrityx'));
```

### Check Table Sizes

```sql
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Active Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'integrityx';
```

---

## 🎯 Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `integrityx` created
- [ ] User `integrityx_user` created with proper permissions
- [ ] `.env` file created with correct DATABASE_URL
- [ ] Python dependencies installed (`requirements-postgresql.txt`)
- [ ] Alembic migrations run (`alembic upgrade head`)
- [ ] Connection test passed (`test_connection.py`)
- [ ] Application starts with PostgreSQL (not SQLite fallback)
- [ ] Documents can be uploaded and verified
- [ ] No SQLite files being created in backend/

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy PostgreSQL Dialect](https://docs.sqlalchemy.org/en/14/dialects/postgresql.html)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `tail -f backend/backend.log`
2. Verify DATABASE_URL: Check .env file
3. Test connection: Run `test_connection.py`
4. Check PostgreSQL status: `pg_isready`

---

**Last Updated**: October 28, 2025
**Status**: ✅ PostgreSQL is now properly configured as default database


