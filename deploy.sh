#!/bin/bash

# DM_CRM Sales Dashboard - Quick Deployment Script
# This script provides one-command deployment for the containerized application

set -e

echo "🚀 DM_CRM Sales Dashboard Deployment Script"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose > /dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check for environment file
if [ ! -f ".env.docker" ]; then
    if [ -f ".env.docker.example" ]; then
        echo "📋 Creating .env.docker from template..."
        cp .env.docker.example .env.docker
        echo "⚠️  Please edit .env.docker with your configuration before running again."
        echo "   Key settings to update:"
        echo "   - JWT_SECRET (use a strong 84+ character secret)"
        echo "   - POSTGRES_PASSWORD (change from default)"
        echo "   - Database connection settings if needed"
        exit 1
    else
        echo "❌ No .env.docker file found. Please create one with your configuration."
        exit 1
    fi
fi

echo "✅ Environment configuration found"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use. Please stop the service using this port or change the port in docker-compose.yml"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking port availability..."
PORTS_OK=true

if ! check_port 80; then PORTS_OK=false; fi
if ! check_port 3000; then PORTS_OK=false; fi
if ! check_port 5432; then PORTS_OK=false; fi
if ! check_port 6379; then PORTS_OK=false; fi

if [ "$PORTS_OK" = false ]; then
    echo "❌ Some required ports are in use. Please resolve port conflicts and try again."
    exit 1
fi

echo "✅ All required ports are available"

# Parse command line arguments
COMMAND=${1:-"up"}
ENVIRONMENT=${2:-"development"}

case $COMMAND in
    "up"|"start")
        echo "🏗️  Building and starting services..."
        if [ "$ENVIRONMENT" = "production" ]; then
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        else
            docker compose up -d --build
        fi
        ;;
    "down"|"stop")
        echo "🛑 Stopping services..."
        docker compose down
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker compose restart
        ;;
    "logs")
        echo "📋 Showing logs..."
        docker compose logs -f
        ;;
    "status")
        echo "📊 Service status:"
        docker compose ps
        ;;
    "clean")
        echo "🧹 Cleaning up containers and volumes..."
        docker compose down -v
        docker system prune -f
        ;;
    "backup")
        echo "💾 Creating database backup..."
        mkdir -p backups
        docker compose exec -T database pg_dump -U postgres sales_dashboard_dev > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "✅ Backup created in backups/ directory"
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "❌ Please specify backup file: ./deploy.sh restore <backup_file>"
            exit 1
        fi
        echo "🔄 Restoring database from $2..."
        docker compose exec -T database psql -U postgres -d sales_dashboard_dev < "$2"
        echo "✅ Database restored"
        ;;
    "update")
        echo "📥 Updating from repository..."
        git pull origin main
        docker compose build
        docker compose up -d
        ;;
    "help")
        echo "Available commands:"
        echo "  up/start [production]  - Start all services (default: development)"
        echo "  down/stop             - Stop all services"
        echo "  restart               - Restart all services"
        echo "  logs                  - Show service logs"
        echo "  status                - Show service status"
        echo "  clean                 - Stop services and clean volumes"
        echo "  backup                - Create database backup"
        echo "  restore <file>        - Restore database from backup"
        echo "  update                - Update from git and restart"
        echo "  help                  - Show this help"
        exit 0
        ;;
    *)
        echo "❌ Unknown command: $COMMAND"
        echo "Use './deploy.sh help' to see available commands"
        exit 1
        ;;
esac

if [ "$COMMAND" = "up" ] || [ "$COMMAND" = "start" ]; then
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Check service health
    echo "🔍 Checking service health..."
    
    # Check database
    if docker compose exec database pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Database is healthy"
    else
        echo "⚠️  Database is not ready yet"
    fi
    
    # Check Redis
    if docker compose exec redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is healthy"
    else
        echo "⚠️  Redis is not ready yet"
    fi
    
    # Check backend API
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Backend API is healthy"
    else
        echo "⚠️  Backend API is not ready yet"
    fi
    
    # Check frontend
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo "✅ Frontend is healthy"
    else
        echo "⚠️  Frontend is not ready yet"
    fi
    
    echo ""
    echo "🎉 DM_CRM Sales Dashboard Deployment Complete!"
    echo "=============================================="
    echo "📱 Application Access:"
    echo "   Frontend:    http://localhost"
    echo "   Backend API: http://localhost:3000"
    echo "   Database:    localhost:5432"
    echo "   Redis:       localhost:6379"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs:   ./deploy.sh logs"
    echo "   Check status: ./deploy.sh status"
    echo "   Stop services: ./deploy.sh stop"
    echo "   Create backup: ./deploy.sh backup"
    echo ""
    echo "📖 For detailed documentation, see:"
    echo "   - DOCKER_IMPLEMENTATION_GUIDE.md"
    echo "   - DEPLOYMENT_INSTRUCTIONS.md"
fi