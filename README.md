# DM_CRM Sales Dashboard - Production Ready

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Status](https://img.shields.io/badge/status-🚀%20PRODUCTION%20READY-green.svg)
![Docker](https://img.shields.io/badge/deployment-🐳%20Docker%20Containerized-blue.svg)
![Security](https://img.shields.io/badge/security-Enterprise%20Grade-green.svg)

## 🎉 Project Status: PRODUCTION READY - FULLY CONTAINERIZED

**Latest Update:** July 17, 2025 (Complete Docker Containerization)  
**Current Version:** 2.0.0 - Production-ready with Docker deployment  
**Deployment:** Complete Docker containerization with one-command setup

## 🚀 Quick Start

### One-Command Deployment
```bash
# Clone the repository
git clone https://github.com/drozmdg/DM_CRM_PROD.git
cd DM_CRM_PROD

# Configure environment
cp .env.docker.example .env.docker
# Edit .env.docker with your settings

# Deploy complete application stack
./deploy.sh up
```

**Access your application:**
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📋 Overview

DM_CRM is a **Customer Relationship Management system** designed for B2B consulting and service companies. This application operates with **enterprise-grade authentication and authorization**, providing secure access control with role-based permissions for production use.

### 🐳 **Complete Docker Containerization**
- **Multi-service architecture**: PostgreSQL + Redis + Backend API + Frontend
- **One-command deployment**: `./deploy.sh up`
- **Production-ready configuration** with security hardening
- **Health monitoring** and automatic service checks
- **Consistent deployment** across all environments

## ✨ Key Features

### 🎯 **Core Capabilities**
- ✅ **Real-time Dashboard** with live metrics and activity tracking
- ✅ **Customer Management** with comprehensive profiles and contact tracking
- ✅ **Process Management** with SDLC tracking and progress monitoring
- ✅ **Service Management** with hours tracking and performance metrics
- ✅ **Document Management** with rich file viewer and version control
- ✅ **Team Coordination** with assignments and pharmaceutical product tracking

### 🔧 **Advanced Features**
- ✅ **File Transfer Configuration** (SFTP, S3, ADLS, FTP, HTTP)
- ✅ **Process Notification System** with event-driven alerts
- ✅ **Enhanced Document Viewer** (Word, Excel, CSV, SQL, PDF, images)
- ✅ **Customer Relationship Tracking** (notes, important dates, communications)
- ✅ **Task Management** with progress calculation and milestone tracking
- ✅ **PDF Report Generation** with configurable sections and professional formatting
- ✅ **AI Chat Integration** with context-aware assistance

### 🔒 **Enterprise Security**
- ✅ **JWT-based Authentication** with role-based access control
- ✅ **Production-grade Security** with comprehensive middleware
- ✅ **Data Protection** with input validation and sanitization
- ✅ **Audit Logging** and session management
- ✅ **CORS Protection** and rate limiting

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18.3 + TypeScript + TailwindCSS + Shadcn/UI + Nginx
- **Backend**: Node.js 18 + Express + TypeScript
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Cache**: Redis 7 for session and performance caching
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT with enterprise-grade security
- **PDF Generation**: jsPDF for cross-platform compatibility

### Container Services
```yaml
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │
│   (Nginx +      │────│   (Node.js +    │
│    React)       │    │    Express)     │
│   Port: 80      │    │   Port: 3000    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐    ┌─────────────────┐
         │   Database      │    │   Redis Cache   │
         │   (PostgreSQL   │    │   (Redis 7)     │
         │    15 Alpine)   │    │   Port: 6379    │
         │   Port: 5432    │    │                 │
         └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
DM_CRM_PROD/
├── 🐳 Docker Configuration
│   ├── docker-compose.yml           # Main orchestration
│   ├── docker-compose.prod.yml      # Production overrides
│   ├── Dockerfile                   # Backend container
│   ├── Dockerfile.frontend          # Frontend container
│   ├── .env.docker.example         # Environment template
│   └── deploy.sh                    # Deployment script
├── 📱 Frontend Application
│   ├── client/src/
│   │   ├── components/              # UI components
│   │   ├── pages/                   # Application pages
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities and API clients
│   │   └── contexts/                # React contexts
├── 🔧 Backend Services
│   ├── server/
│   │   ├── lib/database/            # Database services
│   │   ├── lib/ai-chat/             # AI integration
│   │   ├── middleware/              # Security and validation
│   │   ├── routes/                  # API routes
│   │   ├── index.ts                 # Development server
│   │   └── index.docker.ts          # Docker server
├── 🗃️ Database & Infrastructure
│   ├── database/                    # Migrations and backups
│   ├── init-scripts/                # Database initialization
│   ├── shared/                      # Shared types
│   └── terraform/                   # Infrastructure as code
├── 📖 Documentation
│   ├── DOCKER_IMPLEMENTATION_GUIDE.md
│   ├── DEPLOYMENT_INSTRUCTIONS.md
│   ├── documentation/               # Technical guides
│   └── README.md                    # This file
└── 🧪 Testing & Quality
    ├── tests/                       # Test suites
    ├── e2e/                         # End-to-end tests
    └── .github/workflows/           # CI/CD pipelines
```

## 🛠️ Development

### Prerequisites
- **Docker Desktop** 4.0+ with 4GB+ RAM allocation
- **Git** for repository management
- **VS Code** (recommended) with Docker extension

### Development Commands
```bash
# 🔄 Service Management
./deploy.sh up          # Start all services
./deploy.sh down         # Stop all services
./deploy.sh restart      # Restart services
./deploy.sh logs         # View logs
./deploy.sh status       # Check status

# 💾 Database Operations
./deploy.sh backup       # Create database backup
./deploy.sh restore <file> # Restore from backup

# 🏗️ Development
./deploy.sh clean        # Clean containers and volumes
./deploy.sh update       # Update from git and restart

# 🔍 Monitoring
docker compose ps        # Container status
docker compose logs -f   # Live logs
docker stats            # Resource usage
```

### Environment Configuration
Create `.env.docker` from template:
```bash
cp .env.docker.example .env.docker
```

Key settings to configure:
```bash
# Database Security (CHANGE IN PRODUCTION!)
POSTGRES_PASSWORD=your_secure_password

# JWT Security (GENERATE STRONG SECRET!)
JWT_SECRET=your_84_character_jwt_secret

# Application Environment
NODE_ENV=development  # or 'production'
PORT=3000
```

## 📊 API Documentation

### Core Endpoints
All API routes require JWT authentication:

#### 👥 Customer Management
- `GET/POST /api/customers` - Customer CRUD operations
- `GET/POST /api/customers/:id/notes` - Customer notes
- `GET/POST /api/customers/:id/important-dates` - Key dates
- `GET /api/customers/:id/report-data` - Report data
- `POST /api/customers/:id/export-pdf` - PDF generation

#### ⚙️ Process Management
- `GET/POST /api/processes` - Process operations
- `GET/POST /api/processes/:id/tasks` - Task management
- `GET/POST /api/processes/:id/file-transfers` - File transfers
- `GET/POST /api/processes/:id/notifications` - Notifications
- `GET /api/processes/:id/progress` - Progress tracking

#### 📞 Contact & Communication
- `GET/POST /api/contacts` - Contact management
- `GET /api/contacts/internal` - Internal contacts
- `POST /api/contacts/:id/assign/:customerId` - Assignments
- `GET/POST /api/communications` - Communication history

#### 📄 Document Management
- `GET/POST /api/documents` - Document operations
- `DELETE /api/documents/:id` - Document removal
- Rich file viewing with enhanced preview capabilities

#### 🤖 AI Integration
- `POST /api/ai-chat/send` - AI chat messages
- `GET /api/ai-chat/sessions` - Chat sessions
- `GET/POST /api/ai/config` - AI configuration

### Health & Monitoring
- `GET /api/health` - API health check
- `GET /health` - Frontend health check
- `GET /api/dashboard/metrics` - Dashboard metrics

## 🚀 Deployment

### Production Deployment
1. **Clone Repository**:
```bash
git clone https://github.com/drozmdg/DM_CRM_PROD.git
cd DM_CRM_PROD
```

2. **Production Configuration**:
```bash
cp .env.docker.example .env.production
# Edit .env.production with production settings
```

3. **Deploy to Production**:
```bash
./deploy.sh up production
```

### Scaling & Load Balancing
- **Horizontal Scaling**: Multiple backend instances
- **Load Balancing**: Nginx configuration included
- **Database Scaling**: PostgreSQL read replicas supported
- **Caching**: Redis for session and data caching

### Monitoring & Observability
- **Health Checks**: Built-in service monitoring
- **Logging**: Centralized log aggregation
- **Metrics**: Application and infrastructure metrics
- **Alerting**: Service failure notifications

## 🔐 Security Features

### Authentication & Authorization
- ✅ **JWT-based Authentication** with secure token handling
- ✅ **Role-based Access Control** (Admin, Manager, Viewer)
- ✅ **Session Management** with automatic cleanup
- ✅ **Password Security** with strong requirements

### Data Protection
- ✅ **Input Validation** with Zod schemas
- ✅ **SQL Injection Protection** with parameterized queries
- ✅ **XSS Prevention** with content sanitization
- ✅ **CORS Configuration** with origin restrictions

### Infrastructure Security
- ✅ **Container Security** with non-root users
- ✅ **Network Isolation** with Docker networks
- ✅ **Secret Management** with environment variables
- ✅ **Rate Limiting** and DDoS protection

## 📈 Performance Optimization

### Caching Strategy
- **Redis Caching**: Session and frequently accessed data
- **Browser Caching**: Static assets with long-term caching
- **Database Optimization**: Indexed queries and connection pooling

### Resource Management
- **Container Resources**: Optimized memory and CPU limits
- **Database Performance**: Query optimization and indexing
- **Frontend Optimization**: Code splitting and lazy loading

## 🆘 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tlnp | grep :80
netstat -tlnp | grep :3000

# Change ports in docker-compose.yml if needed
```

#### Service Health Issues
```bash
# Check service status
./deploy.sh status

# View detailed logs
./deploy.sh logs

# Restart specific service
docker compose restart backend
```

#### Database Connection Issues
```bash
# Test database connectivity
docker compose exec backend node -e "console.log('DB test')"

# Check database logs
docker compose logs database
```

### Support Resources
- 📖 **[Docker Implementation Guide](DOCKER_IMPLEMENTATION_GUIDE.md)** - Complete deployment guide
- 📋 **[Deployment Instructions](DEPLOYMENT_INSTRUCTIONS.md)** - Step-by-step setup
- 🔧 **[Documentation](documentation/)** - Technical documentation
- 🐛 **[GitHub Issues](https://github.com/drozmdg/DM_CRM_PROD/issues)** - Bug reports and feature requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- **[React](https://reactjs.org/)** - Frontend framework
- **[Node.js](https://nodejs.org/)** - Backend runtime
- **[PostgreSQL](https://postgresql.org/)** - Database engine
- **[Docker](https://docker.com/)** - Containerization platform
- **[shadcn/ui](https://ui.shadcn.com/)** - UI component library
- **[TailwindCSS](https://tailwindcss.com/)** - Styling framework

---

## 🎯 **Ready for Production**

✅ **Enterprise-grade security and authentication**  
✅ **Complete Docker containerization**  
✅ **One-command deployment**  
✅ **Comprehensive documentation**  
✅ **Production monitoring and health checks**  
✅ **Scalable architecture**  

**The DM_CRM Sales Dashboard is production-ready and can be deployed consistently across any environment with Docker! 🚀**