# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy ALL workspace manifests so npm ci can resolve workspaces
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all deps
RUN npm ci

# Copy frontend source
COPY frontend/ ./frontend/

# Build Next.js
WORKDIR /app/frontend
ENV NODE_ENV=production
# NEXT_PUBLIC_API_URL is baked in at build time via --build-arg
ARG NEXT_PUBLIC_API_URL=https://buildtrack-backend-102021166885.us-central1.run.app
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ============================================================
# Stage 2: Production runtime
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm ci --omit=dev

COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY frontend/next.config.js ./frontend/next.config.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

WORKDIR /app/frontend
CMD ["npm", "start"]
