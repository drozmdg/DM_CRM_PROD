# Simplified Docker build for SalesDashboard backend
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -D -S -u 1001 -G nodejs nodejs

# Set working directory
WORKDIR /app

# Copy package files and source code
COPY package*.json ./
COPY tsconfig.json ./
COPY server/ ./server/
COPY shared/ ./shared/

# Install dependencies
RUN npm ci --frozen-lockfile && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with tsx for TypeScript execution  
CMD ["dumb-init", "npx", "tsx", "server/index.docker.ts"]