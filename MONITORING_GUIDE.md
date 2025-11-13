# IntegrityX Monitoring & Observability Guide

**Production-grade monitoring system using Prometheus & Grafana**

## 📊 Overview

IntegrityX includes a comprehensive monitoring solution that tracks:

- **Application Performance**: Request rates, latency, throughput
- **Document Operations**: Uploads, verifications, sealing
- **Blockchain Integration**: Walacor API calls, success rates
- **Infrastructure**: CPU, memory, disk, database performance
- **Errors & Alerts**: Real-time error tracking and alerting

## 🎯 Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  IntegrityX │ ───> │ Prometheus  │ ───> │   Grafana   │
│   Backend   │      │   (Metrics) │      │ (Dashboard) │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │
       │                     │                     │
       v                     v                     v
  /metrics              Alertmanager          Dashboards
  endpoint              (Alerts)              (4 dashboards)
```

## 🚀 Quick Start

### 1. **Enable Monitoring in Backend**

The monitoring system is automatically integrated when you run the application.

```python
# backend/main.py - Already integrated!
from src.monitoring import PrometheusMiddleware

app.add_middleware(PrometheusMiddleware)
```

### 2. **Start Monitoring Stack**

Using Docker (recommended):

```bash
cd monitoring
docker-compose up -d
```

### 3. **Access Dashboards**

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin` (change on first login)
- **Metrics Endpoint**: http://localhost:8000/metrics

---

## 📈 Available Metrics

### HTTP Request Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_http_requests_total` | Counter | Total HTTP requests by method, endpoint, status |
| `integrityx_http_request_duration_seconds` | Histogram | Request duration by method, endpoint |
| `integrityx_http_requests_in_progress` | Gauge | Current requests in progress |

### Document Operation Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_documents_uploaded_total` | Counter | Total documents uploaded by type |
| `integrityx_documents_verified_total` | Counter | Total documents verified by status |
| `integrityx_documents_sealed_total` | Counter | Total documents sealed to blockchain |
| `integrityx_document_processing_duration_seconds` | Histogram | Processing time by operation |
| `integrityx_active_documents` | Gauge | Current active documents in system |

### Blockchain Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_blockchain_operations_total` | Counter | Blockchain operations by type and status |
| `integrityx_blockchain_operation_duration_seconds` | Histogram | Blockchain operation duration |
| `integrityx_walacor_api_calls_total` | Counter | Walacor API calls by endpoint and status |

### Database Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_database_queries_total` | Counter | Database queries by operation and table |
| `integrityx_database_query_duration_seconds` | Histogram | Query duration by operation |
| `integrityx_database_connections_active` | Gauge | Active database connections |

### Error Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_errors_total` | Counter | Total errors by type and endpoint |
| `integrityx_validation_errors_total` | Counter | Validation errors by field |
| `integrityx_authentication_failures_total` | Counter | Authentication failures |

### Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `integrityx_attestations_created_total` | Counter | Attestations created by role and status |
| `integrityx_provenance_queries_total` | Counter | Provenance chain queries |
| `integrityx_ai_operations_total` | Counter | AI operations by type |
| `integrityx_ai_operation_duration_seconds` | Histogram | AI operation duration |

---

## 📊 Grafana Dashboards

### 1. **Application Overview**

**Purpose**: High-level system health and performance

**Key Panels**:
- Request rate (req/s)
- Response time (p95)
- Active requests
- Total documents
- Error rate
- Success rate
- Status code distribution
- Database connections

**Use Cases**:
- Quick system health check
- Identify performance issues
- Monitor overall load

### 2. **Document Operations**

**Purpose**: Track document lifecycle and operations

**Key Panels**:
- Documents uploaded per minute
- Verification status breakdown
- Total uploads/seals today
- Tampered documents detected
- Document integrity rate
- Processing time (p95)
- Attestations created
- Provenance queries

**Use Cases**:
- Monitor document processing
- Detect integrity issues
- Track business metrics

### 3. **Blockchain & Infrastructure**

**Purpose**: Monitor blockchain integration and system resources

**Key Panels**:
- Blockchain operation rates
- Operation duration (p95)
- Success rates
- Walacor API calls
- Database query performance
- CPU, Memory, Disk usage

**Use Cases**:
- Monitor blockchain health
- Track infrastructure resources
- Identify bottlenecks

### 4. **Errors & Alerts**

**Purpose**: Debug issues and track system health

**Key Panels**:
- Error rate by type/endpoint
- HTTP 4xx/5xx errors
- Authentication failures
- Validation errors by field
- Active alerts
- Rate limited requests
- AI operation errors

**Use Cases**:
- Debugging production issues
- Track error trends
- Monitor security (auth failures)

---

## 🚨 Alerting

### Alert Configuration

Alerts are defined in `monitoring/alerts.yml` and cover:

1. **Critical Alerts** (Immediate Action Required)
   - API Down
   - Database Down
   - High Error Rate (>10/sec for 5min)
   - Critical Disk Space (>95%)

2. **Warning Alerts** (Monitor Closely)
   - High Request Latency (>5s p95)
   - High Blockchain Failure Rate (>10%)
   - High CPU/Memory Usage (>80%/85%)
   - High Database Latency (>1s p95)

3. **Info Alerts** (Nice to Know)
   - Low Document Upload Rate
   - High Tampered Document Rate
   - Redis Down (rate limiting degraded)

### Alert Severity Levels

| Severity | Response Time | Examples |
|----------|--------------|----------|
| **Critical** | Immediate | API down, Database down |
| **Warning** | Within 30min | High latency, High error rate |
| **Info** | Review daily | Low traffic, Minor issues |

### Configuring Alertmanager

Edit `monitoring/alertmanager.yml` to configure notification channels:

```yaml
route:
  receiver: 'email-notifications'
  
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'ops@walacor.com'
        from: 'alerts@integrityx.com'
        smarthost: 'smtp.example.com:587'
```

---

## 🛠️ Setup Instructions

### Prerequisites

- Docker & Docker Compose
- IntegrityX backend running
- PostgreSQL (optional: for postgres-exporter)
- Redis (optional: for redis-exporter)

### Step 1: Configuration

**1.1 Verify Prometheus Configuration**

Check `monitoring/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'integrityx-backend'
    static_configs:
      - targets: ['backend:8000']  # Update if different
```

**1.2 Update Alert Rules** (Optional)

Edit `monitoring/alerts.yml` to customize thresholds.

### Step 2: Deploy Monitoring Stack

**2.1 Using Docker Compose** (Recommended)

```bash
cd monitoring
docker-compose up -d
```

This starts:
- Prometheus (port 9090)
- Grafana (port 3001)
- Node Exporter (port 9100)
- Alertmanager (port 9093)

**2.2 Verify Services**

```bash
docker-compose ps

# Should show all services running
```

### Step 3: Configure Grafana

**3.1 Access Grafana**

Navigate to http://localhost:3001

- Username: `admin`
- Password: `admin` (change immediately)

**3.2 Import Dashboards**

Dashboards are auto-provisioned from `monitoring/grafana/dashboards/`.

Verify in Grafana:
1. Go to Dashboards → Browse
2. Look for "IntegrityX" folder
3. You should see 4 dashboards

**3.3 Verify Data Source**

1. Go to Configuration → Data Sources
2. "Prometheus" should be listed
3. Test connection → Should succeed

### Step 4: Test Metrics Collection

**4.1 Check Metrics Endpoint**

```bash
curl http://localhost:8000/metrics
```

You should see Prometheus-formatted metrics.

**4.2 Query Prometheus**

Navigate to http://localhost:9090 and run:

```promql
integrityx_http_requests_total
```

**4.3 View in Grafana**

Open "Application Overview" dashboard and verify data is flowing.

---

## 🔍 Common Queries

### Performance Queries

**Request Rate by Endpoint**
```promql
sum(rate(integrityx_http_requests_total[5m])) by (endpoint)
```

**95th Percentile Response Time**
```promql
histogram_quantile(0.95, 
  rate(integrityx_http_request_duration_seconds_bucket[5m])
)
```

**Error Rate**
```promql
sum(rate(integrityx_errors_total[5m]))
```

### Business Queries

**Documents Uploaded Today**
```promql
sum(increase(integrityx_documents_uploaded_total[24h]))
```

**Document Integrity Rate**
```promql
100 * (
  sum(rate(integrityx_documents_verified_total{status="valid"}[1h])) 
  / 
  sum(rate(integrityx_documents_verified_total[1h]))
)
```

**Blockchain Success Rate**
```promql
100 * (
  sum(rate(integrityx_blockchain_operations_total{status="success"}[5m]))
  /
  sum(rate(integrityx_blockchain_operations_total[5m]))
)
```

### Infrastructure Queries

**CPU Usage**
```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Memory Usage**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

**Database Connections**
```promql
integrityx_database_connections_active
```

---

## 📦 Integration with Code

### Tracking Custom Events

```python
from src.monitoring import metrics_collector

# Track document upload
start = time.time()
# ... upload logic ...
duration = time.time() - start
metrics_collector.track_document_upload('loan_document', duration)

# Track blockchain operation
start = time.time()
try:
    # ... blockchain operation ...
    duration = time.time() - start
    metrics_collector.track_blockchain_operation('seal', 'success', duration)
except Exception as e:
    duration = time.time() - start
    metrics_collector.track_blockchain_operation('seal', 'failure', duration)
    raise

# Track errors
try:
    # ... operation ...
except ValidationError as e:
    metrics_collector.track_error('ValidationError', '/upload')
    raise
```

### Using Decorators

```python
from src.monitoring import track_document_operation, track_blockchain_operation

@track_document_operation('upload')
async def upload_document(file):
    # ... logic ...
    pass

@track_blockchain_operation('seal')
async def seal_to_blockchain(etid):
    # ... logic ...
    pass
```

---

## 🐛 Troubleshooting

### Metrics Not Appearing

**Problem**: No data in Grafana

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/metrics`
2. Verify Prometheus can reach backend:
   ```bash
   docker exec monitoring_prometheus_1 wget -O- http://backend:8000/metrics
   ```
3. Check Prometheus targets: http://localhost:9090/targets
4. Verify scrape interval in `prometheus.yml`

### High Memory Usage

**Problem**: Prometheus consuming too much memory

**Solutions**:
1. Reduce retention period in `prometheus.yml`:
   ```yaml
   storage:
     tsdb:
       retention:
         time: 15d  # Reduce from 30d
   ```
2. Reduce scrape frequency
3. Add metric relabeling to drop unnecessary metrics

### Dashboards Not Loading

**Problem**: Dashboards not appearing in Grafana

**Solutions**:
1. Check provisioning path: `monitoring/grafana/provisioning/dashboards/`
2. Verify dashboard JSON is valid
3. Check Grafana logs:
   ```bash
   docker logs monitoring_grafana_1
   ```
4. Manually import from Grafana UI

### Alert Not Firing

**Problem**: Expected alert not triggering

**Solutions**:
1. Test alert query in Prometheus: http://localhost:9090/alerts
2. Check alert is defined in `alerts.yml`
3. Verify Alertmanager is running
4. Check notification config

---

## 🚀 Production Deployment

### Scaling Considerations

**1. Prometheus Storage**
- Use remote storage (e.g., Thanos, Cortex) for long-term retention
- Configure appropriate retention periods
- Monitor disk usage

**2. High Availability**
- Run multiple Prometheus instances
- Use Alertmanager clustering
- Deploy Grafana with load balancer

**3. Security**
- Enable authentication on all endpoints
- Use TLS for communication
- Restrict access to metrics endpoint
- Set up firewall rules

### Production Checklist

- [ ] Prometheus retention configured (30d recommended)
- [ ] Alertmanager notification channels configured
- [ ] All dashboards imported and tested
- [ ] Alert rules tested and verified
- [ ] Backup strategy for Prometheus data
- [ ] Monitoring for monitoring (meta-monitoring)
- [ ] Documentation for on-call team
- [ ] Runbooks for common alerts

---

## 📚 Additional Resources

### Internal Documentation
- `backend/src/monitoring/metrics.py` - Metrics definitions
- `backend/src/monitoring/prometheus_middleware.py` - Middleware implementation
- `monitoring/prometheus.yml` - Prometheus configuration
- `monitoring/alerts.yml` - Alert rules

### External Resources
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alertmanager Guide](https://prometheus.io/docs/alerting/latest/alertmanager/)

---

## 🎯 Best Practices

1. **Start Simple**: Use pre-built dashboards, customize later
2. **Alert Fatigue**: Start with fewer, high-value alerts
3. **Document Everything**: Keep runbooks up-to-date
4. **Test Alerts**: Simulate failures to verify alerting works
5. **Review Regularly**: Weekly review of dashboards and alerts
6. **Optimize Queries**: Use recording rules for expensive queries
7. **Backup Data**: Regular backups of Prometheus and Grafana data

---

## 🆘 Support

For issues with monitoring setup:

1. Check logs: `docker-compose logs prometheus grafana`
2. Review Troubleshooting section above
3. Contact DevOps team: ops@walacor.com
4. See main documentation: `docs/PROJECT_DOCUMENTATION.md`

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: Walacor DevOps Team

















