# IntegrityX Docker Deployment Guide

**Production-ready Docker containerization for IntegrityX platform**

## 📦 Overview

IntegrityX provides complete Docker support with:

- **Multi-stage builds** for optimized images
- **Development environment** with hot-reload
- **Production environment** with nginx reverse proxy
- **Monitoring stack** with Prometheus & Grafana
- **Health checks** and automatic restarts
- **Resource limits** and security best practices

## 🚀 Quick Start

### Development Mode

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Configure .env with your credentials
# Edit DATABASE_URL, CLERK_SECRET_KEY, etc.

# 3. Start all services
docker-compose up -d

# 4. Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Mode

```bash
# 1. Build images
docker-compose -f docker-compose.prod.yml build

# 2. Start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Access via nginx
# Frontend: http://localhost
# Backend API: http://localhost/api
```

### Monitoring Stack

```bash
# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

---

## 📋 Prerequisites

### System Requirements

- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 20GB minimum
- **CPU**: 2 cores minimum (4+ recommended)

### Installation

**Install Docker**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# macOS
brew install docker docker-compose

# Start Docker
sudo systemctl start docker  # Linux
# or use Docker Desktop on macOS
```

**Verify Installation**:
```bash
docker --version
docker-compose --version
```

---

## 🏗️ Architecture

### Container Structure

```
┌─────────────────────────────────────────────────────────────┐
│                          Nginx                              │
│                   (Reverse Proxy)                           │
│                    Port 80/443                              │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
     ┌───────▼────────┐         ┌───────▼────────┐
     │   Frontend     │         │    Backend     │
     │   (Next.js)    │         │   (FastAPI)    │
     │   Port 3000    │         │   Port 8000    │
     └───────┬────────┘         └───────┬────────┘
             │                           │
             │                  ┌────────▼────────┐
             │                  │   PostgreSQL    │
             │                  │   Port 5432     │
             │                  └─────────────────┘
             │                  ┌─────────────────┐
             └──────────────────│     Redis       │
                                │   Port 6379     │
                                └─────────────────┘

Monitoring Stack (Optional):
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Prometheus    │  │    Grafana      │  │   Exporters     │
│   Port 9090     │  │   Port 3001     │  │   9100/9187/... │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Docker Images

| Service | Base Image | Size | Purpose |
|---------|-----------|------|---------|
| Backend | python:3.12-slim | ~300MB | FastAPI application |
| Frontend | node:20-alpine | ~200MB | Next.js application |
| PostgreSQL | postgres:16-alpine | ~250MB | Database |
| Redis | redis:7-alpine | ~50MB | Caching & rate limiting |
| Nginx | nginx:alpine | ~40MB | Reverse proxy |

---

## 📝 Configuration

### Environment Variables

**Required Variables** (create `.env` file):

```bash
# Database
POSTGRES_DB=integrityx
POSTGRES_USER=integrityx_user
POSTGRES_PASSWORD=secure_password_here

# Redis
REDIS_PASSWORD=redis_password_here

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key

# Walacor Blockchain
WALACOR_API_KEY=your_walacor_api_key
WALACOR_API_URL=https://api.walacor.com

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key_base64

# API URLs
API_BASE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

**Generate Secure Keys**:

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate random password
openssl rand -base64 32
```

### Docker Compose Files

**Development**: `docker-compose.yml`
- Hot-reload enabled
- Debug mode
- Exposed ports for debugging
- Volume mounts for live code changes

**Production**: `docker-compose.prod.yml`
- Optimized builds
- Resource limits
- No port exposure (except nginx)
- No volume mounts (immutable containers)

**Monitoring**: `docker-compose.monitoring.yml`
- Prometheus for metrics
- Grafana for dashboards
- System exporters
- Alert manager

---

## 🔧 Usage

### Development Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (DESTRUCTIVE)
docker-compose down -v

# Rebuild images
docker-compose build
docker-compose up -d --build
```

### Production Commands

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale backend (horizontal scaling)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Rolling update (zero downtime)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend

# Health check
docker-compose -f docker-compose.prod.yml ps
```

### Monitoring Commands

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# View metrics
curl http://localhost:9090

# Access Grafana
open http://localhost:3001

# Check Prometheus targets
open http://localhost:9090/targets
```

---

## 🔍 Container Management

### Accessing Containers

```bash
# Execute command in container
docker exec -it integrityx_backend bash

# Access PostgreSQL
docker exec -it integrityx_postgres psql -U integrityx_user -d integrityx

# Access Redis CLI
docker exec -it integrityx_redis redis-cli
```

### Viewing Logs

```bash
# All logs
docker-compose logs

# Last 100 lines
docker-compose logs --tail=100

# Follow logs (real-time)
docker-compose logs -f

# Specific service with timestamp
docker-compose logs -f --timestamps backend
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Detailed health status
docker inspect integrityx_backend | grep -A 10 Health

# Test backend health
curl http://localhost:8000/health

# Test frontend health
curl http://localhost:3000/
```

---

## 🗄️ Database Operations

### Backup Database

```bash
# Backup PostgreSQL
docker exec integrityx_postgres pg_dump -U integrityx_user integrityx > backup.sql

# Backup to Docker volume
docker exec integrityx_postgres pg_dump -U integrityx_user integrityx > /backups/backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i integrityx_postgres psql -U integrityx_user integrityx < backup.sql

# Restore specific tables
docker exec -i integrityx_postgres psql -U integrityx_user integrityx -c "COPY table_name FROM STDIN" < data.csv
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

---

## 🔒 Security Best Practices

### Production Security Checklist

- [ ] Use strong passwords (min 32 characters)
- [ ] Enable SSL/TLS (configure nginx with certificates)
- [ ] Change default Grafana password
- [ ] Restrict port exposure
- [ ] Use Docker secrets for sensitive data
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Enable Docker Content Trust
- [ ] Use non-root users in containers
- [ ] Scan images for vulnerabilities

### SSL/TLS Configuration

**1. Obtain SSL Certificates**:

```bash
# Using Let's Encrypt
certbot certonly --standalone -d your-domain.com
```

**2. Copy certificates**:

```bash
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

**3. Update nginx.conf** (uncomment SSL block)

**4. Restart nginx**:

```bash
docker-compose restart nginx
```

### Docker Secrets

For production, use Docker secrets:

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  
services:
  backend:
    secrets:
      - db_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

---

## 📊 Monitoring & Debugging

### Performance Monitoring

```bash
# Container resource usage
docker stats

# System resource usage
docker system df

# Specific container stats
docker stats integrityx_backend
```

### Debug Mode

```bash
# Enable debug logs
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up

# Attach to running container
docker attach integrityx_backend

# View container processes
docker top integrityx_backend
```

### Common Issues

**Issue**: Container won't start

```bash
# Check logs
docker-compose logs <service>

# Inspect container
docker inspect <container>

# Check resource limits
docker stats
```

**Issue**: Database connection fails

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec integrityx_backend python -c "from sqlalchemy import create_engine; engine = create_engine('postgresql://...'); engine.connect()"
```

**Issue**: Out of disk space

```bash
# Clean up unused resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove all stopped containers
docker container prune
```

---

## 🚀 Deployment Strategies

### Single Server Deployment

1. **Setup server** (Ubuntu 22.04 LTS recommended)
2. **Install Docker & Docker Compose**
3. **Clone repository**
4. **Configure environment variables**
5. **Start services**: `docker-compose -f docker-compose.prod.yml up -d`
6. **Configure firewall**
7. **Setup SSL certificates**
8. **Configure monitoring**

### Multi-Server Deployment

Use Docker Swarm or Kubernetes for multi-server deployments.

**Docker Swarm** (recommended for 2-10 servers):

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml integrityx

# Scale services
docker service scale integrityx_backend=3

# Update service
docker service update --image integrityx_backend:v2 integrityx_backend
```

### CI/CD Integration

Integrate with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Build Docker images
  run: docker-compose -f docker-compose.prod.yml build

- name: Push to registry
  run: docker-compose -f docker-compose.prod.yml push

- name: Deploy
  run: docker-compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Testing

### Local Testing

```bash
# Run tests in container
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov

# Frontend tests
docker-compose exec frontend npm test
```

### Integration Testing

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
docker-compose exec backend pytest tests/integration/

# Cleanup
docker-compose -f docker-compose.test.yml down -v
```

---

## 📚 Additional Resources

### Internal Documentation
- `Dockerfile.backend` - Backend container definition
- `Dockerfile.frontend` - Frontend container definition
- `docker-compose.yml` - Development configuration
- `docker-compose.prod.yml` - Production configuration
- `nginx/nginx.conf` - Nginx configuration

### External Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)

---

## 🆘 Support

### Troubleshooting Steps

1. Check service logs: `docker-compose logs <service>`
2. Verify container health: `docker-compose ps`
3. Check resource usage: `docker stats`
4. Review configuration: `.env` file, `docker-compose.yml`
5. Test connectivity between containers
6. Check firewall rules
7. Verify DNS resolution

### Getting Help

- **Documentation**: `docs/` directory
- **Email**: ops@walacor.com
- **GitHub Issues**: Create an issue with logs and configuration

---

## 📋 Maintenance Checklist

### Daily
- [ ] Check service health: `docker-compose ps`
- [ ] Monitor resource usage: `docker stats`
- [ ] Review logs for errors

### Weekly
- [ ] Backup database
- [ ] Clean up old logs
- [ ] Update monitoring dashboards
- [ ] Review security alerts

### Monthly
- [ ] Update Docker images
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Disaster recovery drill

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: Walacor DevOps Team



















