# Docker Migration Plan - Sales Dashboard

**Date**: July 7, 2025  
**Migration Type**: Full Docker containerization with PostgreSQL  
**Current State**: Supabase + Node.js/Express + React/Vite  
**Target State**: Docker Compose + PostgreSQL + Containerized services  

## 🎯 **Migration Overview**

### **Current Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │    Supabase     │
│   (Vite Dev)    │───▶│   (Express)     │───▶│  (PostgreSQL)   │
│   Port 5174     │    │   Port 3000     │    │    (Cloud)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Target Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │   PostgreSQL    │
│   (Docker)      │───▶│   (Docker)      │───▶│   (Docker)      │
│   Port 3001     │    │   Port 3000     │    │   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                         ┌─────────────────┐
                         │     Adminer     │
                         │   (Optional)    │
                         │   Port 8080     │
                         └─────────────────┘
```

## ⏱️ **Migration Timeline**

### **Phase 1: Docker Infrastructure Setup (1-2 days)**
- [ ] Create Docker configuration files
- [ ] Set up multi-service docker-compose
- [ ] Configure environment variables
- [ ] Test basic containerization

### **Phase 2: Database Migration (2-3 days)**
- [ ] Export Supabase data
- [ ] Set up PostgreSQL container
- [ ] Migrate Drizzle schema
- [ ] Import and seed data

### **Phase 3: Application Integration (1-2 days)**
- [ ] Update database connections
- [ ] Test all API endpoints
- [ ] Verify frontend functionality
- [ ] Debug container networking

### **Phase 4: Production Optimization (1 day)**
- [ ] Production docker-compose
- [ ] Volume persistence setup
- [ ] Performance optimization
- [ ] Backup/restore procedures

**Total Estimated Time: 5-8 days**

## 📁 **Required File Structure**

```
SalesDashboard/
├── Dockerfile                          # Backend container definition
├── docker-compose.yml                  # Development environment
├── docker-compose.prod.yml             # Production environment
├── .dockerignore                       # Exclude files from build context
├── client/
│   ├── Dockerfile                      # Frontend container definition
│   ├── nginx.conf                      # Production web server config
│   └── .dockerignore                   # Frontend exclusions
├── database/
│   ├── init/
│   │   ├── 01-schema.sql              # Database schema initialization
│   │   ├── 02-seed.sql                # Sample data seeding
│   │   └── 03-indexes.sql             # Performance indexes
│   ├── migrations/                     # Drizzle migration files
│   └── backup/                         # Database backup location
├── scripts/
│   ├── setup-dev.sh                    # Development environment setup
│   ├── setup-prod.sh                   # Production environment setup
│   ├── migrate.sh                      # Database migration runner
│   ├── backup.sh                       # Database backup script
│   ├── restore.sh                      # Database restore script
│   └── export-supabase.sh             # Supabase data export
├── docker/
│   ├── nginx/
│   │   └── default.conf               # Nginx configuration for production
│   └── postgres/
│       └── postgresql.conf            # PostgreSQL tuning config
└── .env.docker                        # Docker-specific environment variables
```

## 🐳 **Docker Configuration Files**

### **1. Root Dockerfile (Backend)**
```dockerfile
# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle.config.ts ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js || exit 1

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### **2. Client Dockerfile (Frontend)**
```dockerfile
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

# Change ownership
RUN chown -R nginx:nginx /usr/share/nginx/html
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log/nginx

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start Nginx
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
```

### **3. Docker Compose - Development**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: sales_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: salesdb
      POSTGRES_USER: sales_user
      POSTGRES_PASSWORD: sales_password
      POSTGRES_INITDB_ARGS: "--auth-host=md5"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
      - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    networks:
      - sales_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sales_user -d salesdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: sales_api
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://sales_user:sales_password@postgres:5432/salesdb
      PORT: 3000
      CORS_ORIGIN: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    networks:
      - sales_network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Client
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: production
    container_name: sales_client
    restart: unless-stopped
    environment:
      VITE_API_BASE_URL: http://localhost:3000
    ports:
      - "3001:3001"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - sales_network

  # Database Administration (Optional)
  adminer:
    image: adminer:latest
    container_name: sales_adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
      ADMINER_DESIGN: "pappu687"
    depends_on:
      - postgres
    networks:
      - sales_network

volumes:
  postgres_data:
    driver: local
  uploads_data:
    driver: local

networks:
  sales_network:
    driver: bridge
```

### **4. Docker Compose - Production**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: sales_db_prod
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
      - ./backups:/backups
    networks:
      - sales_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: sales_api_prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads
      - ./logs:/app/logs
    networks:
      - sales_network

  # Frontend Client
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
      target: production
    container_name: sales_client_prod
    restart: always
    depends_on:
      - backend
    networks:
      - sales_network

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: sales_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    networks:
      - sales_network

volumes:
  postgres_data:
  uploads_data:

networks:
  sales_network:
    driver: bridge
```

## 🗄️ **Database Migration Strategy**

### **1. Supabase Data Export**
```bash
# Export schema
pg_dump --schema-only --no-owner --no-privileges \
  "postgresql://[user]:[password]@[host]:[port]/[database]" \
  > database/init/01-schema.sql

# Export data
pg_dump --data-only --no-owner --no-privileges \
  --disable-triggers \
  "postgresql://[user]:[password]@[host]:[port]/[database]" \
  > database/init/02-seed.sql

# Export specific tables with relationships
pg_dump --data-only --no-owner --no-privileges \
  --table=customers --table=contacts --table=teams \
  --table=services --table=processes --table=documents \
  "postgresql://[user]:[password]@[host]:[port]/[database]" \
  > database/init/03-core-data.sql
```

### **2. Schema Conversion Checklist**
- [ ] **Remove Supabase-specific extensions** (auth, storage, realtime)
- [ ] **Convert RLS policies** to application-level security
- [ ] **Update timestamp functions** (replace Supabase helpers)
- [ ] **Verify data types** (UUID, JSONB, arrays)
- [ ] **Check constraints and indexes**
- [ ] **Update sequences and auto-increment**

### **3. Drizzle Schema Updates**
```typescript
// Update drizzle.config.ts for PostgreSQL
export default {
  schema: "./shared/schema.ts",
  out: "./database/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## 🔧 **Configuration Changes**

### **1. Environment Variables**
```bash
# .env.docker
NODE_ENV=development
DATABASE_URL=postgresql://sales_user:sales_password@postgres:5432/salesdb
POSTGRES_DB=salesdb
POSTGRES_USER=sales_user
POSTGRES_PASSWORD=sales_password
PORT=3000
CORS_ORIGIN=http://localhost:3001

# Remove Supabase variables
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```

### **2. Backend Connection Updates**
```typescript
// server/lib/database/connection.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client);
```

### **3. Frontend Configuration**
```typescript
// client/vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
  // ...existing config
});
```

## 📜 **Setup Scripts**

### **1. Development Setup Script**
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "🐳 Setting up Sales Dashboard development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
mkdir -p database/init database/migrations database/backup
mkdir -p logs uploads docker/nginx docker/postgres

# Copy environment file
if [ ! -f .env.docker ]; then
    cp .env.example .env.docker
    echo "📝 Created .env.docker file. Please update with your values."
fi

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
npm run db:push

echo "✅ Development environment is ready!"
echo "🌐 Frontend: http://localhost:3001"
echo "🔌 Backend: http://localhost:3000"
echo "🗄️ Database Admin: http://localhost:8080"
```

### **2. Migration Script**
```bash
#!/bin/bash
# scripts/migrate.sh

echo "📊 Running database migrations..."

# Ensure database is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ Database container is not running"
    exit 1
fi

# Run Drizzle migrations
docker-compose exec backend npm run db:push

# Seed database if needed
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database..."
    docker-compose exec postgres psql -U sales_user -d salesdb -f /docker-entrypoint-initdb.d/02-seed.sql
fi

echo "✅ Migrations completed successfully!"
```

### **3. Backup Script**
```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="./database/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="salesdb_backup_${TIMESTAMP}.sql"

echo "💾 Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Run backup
docker-compose exec postgres pg_dump -U sales_user -d salesdb > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Keep only last 10 backups
ls -t $BACKUP_DIR/*.gz | tail -n +11 | xargs rm -f

echo "🧹 Old backups cleaned up"
```

## 🔍 **Testing & Validation**

### **1. Pre-Migration Checklist**
- [ ] Export current Supabase data successfully
- [ ] Verify all environment variables are configured
- [ ] Test Docker and Docker Compose installation
- [ ] Backup current application state
- [ ] Document current API endpoints and functionality

### **2. Post-Migration Testing**
- [ ] Database connectivity from backend
- [ ] All API endpoints responding correctly
- [ ] Frontend can fetch and display data
- [ ] Customer CRUD operations work
- [ ] File uploads function properly
- [ ] Authentication (if implemented) works
- [ ] Performance benchmarks meet expectations

### **3. Rollback Plan**
```bash
# scripts/rollback.sh
#!/bin/bash

echo "🔄 Rolling back to Supabase configuration..."

# Stop Docker services
docker-compose down

# Restore original environment
cp .env.supabase .env

# Restart original application
npm run dev

echo "✅ Rollback completed. Application running on original stack."
```

## 🚀 **Deployment Strategy**

### **Development Deployment**
1. Run `scripts/setup-dev.sh`
2. Access application at http://localhost:3001
3. Use Adminer at http://localhost:8080 for database management

### **Production Deployment**
1. Update production environment variables
2. Run `docker-compose -f docker-compose.prod.yml up -d`
3. Configure reverse proxy/load balancer
4. Set up SSL certificates
5. Configure automated backups

## ⚡ **Performance Considerations**

### **Database Optimization**
- Connection pooling configuration
- Query optimization and indexing
- Regular VACUUM and ANALYZE operations
- Monitoring slow queries

### **Container Optimization**
- Multi-stage builds for smaller images
- Health checks for service reliability
- Resource limits and requests
- Horizontal scaling capabilities

## 🛡️ **Security Considerations**

### **Container Security**
- Non-root user execution
- Minimal base images (Alpine)
- Regular security updates
- Secrets management via Docker secrets

### **Database Security**
- Strong passwords and user isolation
- Network segmentation
- Regular backups and encryption
- Access logging and monitoring

## 📈 **Monitoring & Maintenance**

### **Logging Strategy**
- Centralized logging with Docker logs
- Application-level logging
- Database query logging
- Error tracking and alerting

### **Backup Strategy**
- Automated daily backups
- Point-in-time recovery capability
- Backup validation and testing
- Off-site backup storage

## ✅ **Success Criteria**

The migration will be considered successful when:

- [ ] All Docker services start and run reliably
- [ ] Database contains all migrated data intact
- [ ] All API endpoints function correctly
- [ ] Frontend displays and interacts with data properly
- [ ] Performance meets or exceeds current benchmarks
- [ ] Backup and restore procedures work correctly
- [ ] Documentation is complete and accurate
- [ ] Team can develop and deploy using new environment

## 📞 **Support & Troubleshooting**

### **Common Issues**
1. **Port conflicts**: Check for services running on required ports
2. **Permission issues**: Verify Docker permissions and file ownership
3. **Network connectivity**: Ensure containers can communicate
4. **Database connection**: Verify connection strings and credentials
5. **Build failures**: Check Dockerfile syntax and dependencies

### **Useful Commands**
```bash
# View logs
docker-compose logs -f [service_name]

# Restart services
docker-compose restart [service_name]

# Access container shell
docker-compose exec [service_name] sh

# View running containers
docker-compose ps

# Clean up resources
docker-compose down -v --remove-orphans
```

---

**Note**: This migration plan provides a comprehensive roadmap for containerizing the Sales Dashboard application. Each phase should be carefully executed with proper testing and validation to ensure a smooth transition from the current Supabase-based architecture to a fully containerized Docker environment.
