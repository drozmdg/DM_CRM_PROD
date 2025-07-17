# Docker Implementation Guide - DM_CRM Sales Dashboard

This guide provides comprehensive instructions for deploying and managing the DM_CRM Sales Dashboard using Docker containerization.

## Overview

The DM_CRM Sales Dashboard is fully containerized with Docker, providing consistent deployment across development, staging, and production environments. The application stack includes:

- **Frontend**: React 18.3 + Nginx (Port 80)
- **Backend**: Node.js + Express API (Port 3000)
- **Database**: PostgreSQL 15 (Port 5432)
- **Cache**: Redis 7 (Port 6379)

## Prerequisites

- Docker Desktop 4.0+ or Docker Engine 20.10+
- Docker Compose 2.0+
- Git (for cloning the repository)
- Minimum 4GB RAM allocated to Docker
- Available ports: 80, 3000, 5432, 6379

## Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd SalesDashboard
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.docker.example .env.docker

# Edit environment variables (see Environment Configuration section)
nano .env.docker
```

### 3. Start Complete Stack
```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

### 4. Access Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Detailed Configuration

### Environment Configuration

Create `.env.docker` with the following configuration:

```bash
# Application Environment
NODE_ENV=development
PORT=3000

# Database Configuration (Docker internal networking)
DATABASE_URL=postgresql://postgres:postgres_dev_password@database:5432/sales_dashboard_dev
POSTGRES_HOST=database
POSTGRES_PORT=5432
POSTGRES_DB=sales_dashboard_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_dev_password

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Configuration (Production-grade secret)
JWT_SECRET=your_production_jwt_secret_key_minimum_84_characters_for_security_compliance_2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Supabase Configuration (Optional - for legacy compatibility)
SUPABASE_URL=${SUPABASE_URL:-}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-}

# Frontend Configuration
FRONTEND_URL=http://localhost:80
```

### Docker Compose Services

#### Database Service (PostgreSQL 15)
```yaml
database:
  image: postgres:15-alpine
  container_name: sales-dashboard-db-dev
  restart: unless-stopped
  environment:
    POSTGRES_DB: sales_dashboard_dev
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres_dev_password
  ports:
    - "5432:5432"
  volumes:
    - postgres_data_dev:/var/lib/postgresql/data
    - ./init-scripts:/docker-entrypoint-initdb.d:ro
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
```

#### Redis Service
```yaml
redis:
  image: redis:7-alpine
  container_name: sales-dashboard-redis-dev
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data_dev:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 3s
    retries: 5
```

#### Backend Service (Node.js API)
```yaml
backend:
  build:
    context: .
    dockerfile: Dockerfile
    target: production
  container_name: sales-dashboard-backend-dev
  restart: unless-stopped
  env_file:
    - .env.docker
  ports:
    - "3000:3000"
  volumes:
    - ./logs:/app/logs
    - ./uploads:/app/uploads
  depends_on:
    database:
      condition: service_healthy
    redis:
      condition: service_healthy
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
    interval: 30s
    timeout: 3s
    retries: 3
```

#### Frontend Service (Nginx + React)
```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile.frontend
    target: production
  container_name: sales-dashboard-frontend-dev
  restart: unless-stopped
  ports:
    - "80:80"
  volumes:
    - ./nginx-logs:/var/log/nginx
  depends_on:
    - backend
  healthcheck:
    test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
    interval: 30s
    timeout: 3s
    retries: 3
```

## Development Workflow

### Building Services

```bash
# Build all services
docker compose build

# Build specific service
docker compose build backend
docker compose build frontend

# Build with no cache
docker compose build --no-cache
```

### Managing Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up backend -d

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart service
docker compose restart backend
```

### Monitoring and Debugging

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend

# Check service status
docker compose ps

# Execute commands in running container
docker compose exec backend sh
docker compose exec database psql -U postgres -d sales_dashboard_dev

# Monitor resource usage
docker stats
```

### Database Management

```bash
# Access PostgreSQL
docker compose exec database psql -U postgres -d sales_dashboard_dev

# Create database backup
docker compose exec database pg_dump -U postgres sales_dashboard_dev > backup.sql

# Restore database
docker compose exec -T database psql -U postgres -d sales_dashboard_dev < backup.sql

# View database logs
docker compose logs database
```

## Production Deployment

### Production Environment Setup

1. **Create production environment file** (`.env.production`):
```bash
NODE_ENV=production
PORT=3000

# Use strong passwords and secrets
POSTGRES_PASSWORD=<strong-production-password>
JWT_SECRET=<strong-84-character-jwt-secret>

# Production database configuration
DATABASE_URL=postgresql://postgres:<password>@database:5432/sales_dashboard_prod
POSTGRES_DB=sales_dashboard_prod

# SSL and security configurations
SSL_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

2. **Production Docker Compose** (`docker-compose.prod.yml`):
```yaml
version: '3.8'
services:
  database:
    environment:
      POSTGRES_DB: sales_dashboard_prod
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      
  backend:
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      
  frontend:
    environment:
      NGINX_HOST: yourdomain.com
```

3. **Deploy to production**:
```bash
# Deploy with production configuration
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run database migrations
docker compose exec backend npm run db:migrate

# View production logs
docker compose logs -f --tail=100
```

### SSL/TLS Configuration

For production HTTPS, add reverse proxy configuration:

```bash
# Add Nginx SSL configuration
# Update frontend Dockerfile.frontend with SSL certificates
# Configure Let's Encrypt or add custom certificates
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# Check what's using ports
netstat -tlnp | grep :80
netstat -tlnp | grep :3000

# Change ports in docker-compose.yml if needed
ports:
  - "8080:80"  # Use port 8080 instead of 80
```

#### 2. Database Connection Issues
```bash
# Check database connectivity
docker compose exec backend node -e "console.log('Testing DB connection...')"

# Verify environment variables
docker compose exec backend env | grep DATABASE

# Check database logs
docker compose logs database
```

#### 3. Frontend Build Failures
```bash
# Check build logs
docker compose build frontend

# Clear Docker cache
docker system prune -f
docker compose build --no-cache frontend

# Check Node.js and npm versions
docker compose exec frontend node --version
docker compose exec frontend npm --version
```

#### 4. Service Health Check Failures
```bash
# Check health status
docker compose ps

# Test health endpoints manually
curl http://localhost/health
curl http://localhost:3000/api/health

# Disable health checks temporarily
# Comment out healthcheck sections in docker-compose.yml
```

### Performance Optimization

#### 1. Resource Limits
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

#### 2. Volume Optimization
```bash
# Use named volumes for better performance
volumes:
  postgres_data_prod:
    driver: local
  redis_data_prod:
    driver: local
```

#### 3. Build Optimization
```dockerfile
# Multi-stage builds for smaller images
# Use .dockerignore to exclude unnecessary files
# Leverage build cache effectively
```

## Backup and Recovery

### Database Backup
```bash
# Create automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T database pg_dump -U postgres sales_dashboard_dev > "backup_${DATE}.sql"

# Compress backup
gzip "backup_${DATE}.sql"
```

### Full System Backup
```bash
# Backup volumes
docker run --rm \
  -v sales-dashboard-postgres-dev:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /source .

# Backup configuration
tar czf config_backup.tar.gz .env.docker docker-compose.yml
```

### Recovery Process
```bash
# Stop services
docker compose down

# Restore database volume
docker run --rm \
  -v sales-dashboard-postgres-dev:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /target

# Restart services
docker compose up -d
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env.docker` to version control
- Use Docker secrets for sensitive data in production
- Rotate JWT secrets regularly

### 2. Network Security
```yaml
networks:
  sales-dashboard-network:
    driver: bridge
    internal: true  # Prevent external access
```

### 3. Container Security
- Run containers as non-root users
- Use official base images
- Regularly update base images
- Scan images for vulnerabilities

### 4. Access Control
```bash
# Restrict database access
# Configure firewall rules
# Use strong passwords
# Enable audit logging
```

## Monitoring and Logging

### 1. Application Logs
```bash
# Centralized logging
docker compose logs -f | tee application.log

# Log rotation
# Configure logrotate for Docker logs
```

### 2. Health Monitoring
```bash
# Monitor service health
docker compose ps
docker inspect <container-name> --format='{{.State.Health.Status}}'

# Set up monitoring alerts
# Use tools like Prometheus, Grafana, or DataDog
```

### 3. Performance Metrics
```bash
# Resource usage
docker stats

# Application metrics
# Implement custom metrics endpoints
# Monitor response times and error rates
```

## Scaling and Load Balancing

### Horizontal Scaling
```yaml
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
      
  frontend:
    deploy:
      replicas: 2
```

### Load Balancing
```bash
# Use Nginx or HAProxy for load balancing
# Configure session affinity if needed
# Implement health checks for load balancer
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Docker Build and Deploy
on:
  push:
    branches: [main]
    
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and test
        run: |
          docker compose build
          docker compose up -d
          # Run tests
          docker compose down
```

### Deployment Pipeline
```bash
# 1. Build images
# 2. Run tests
# 3. Push to registry
# 4. Deploy to staging
# 5. Run integration tests
# 6. Deploy to production
```

## Additional Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

### Tools and Utilities
- **Portainer**: Web-based Docker management UI
- **Docker Desktop**: Local development environment
- **Docker Scout**: Security scanning
- **Watchtower**: Automated container updates

### Support and Community
- Docker Community Forums
- Stack Overflow (docker, docker-compose tags)
- Project GitHub Issues
- Internal documentation wiki

---

## Summary

This Docker implementation provides:
- ✅ **Complete containerization** of all services
- ✅ **Production-ready configuration** with security best practices
- ✅ **Comprehensive monitoring** and debugging capabilities
- ✅ **Scalable architecture** for growth
- ✅ **Backup and recovery** procedures
- ✅ **Development workflow** optimization

The containerized DM_CRM Sales Dashboard is now ready for deployment across any environment with consistent behavior and reliable operation.