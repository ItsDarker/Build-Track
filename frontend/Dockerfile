# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install all dependencies
RUN npm ci

# Copy frontend source code
COPY frontend/ ./frontend/

# Build Next.js application
WORKDIR /app/frontend
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy frontend package files
COPY frontend/package*.json ./frontend/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=frontend

# Copy built Next.js application from builder
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json

# Set environment
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["npm", "start", "--workspace=frontend"]
