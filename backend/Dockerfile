# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy ALL workspace manifests so npm ci can resolve workspaces
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install ALL deps (including devDeps needed for tsc + prisma generate)
RUN npm ci

# Copy backend source + prisma schema
COPY backend/ ./backend/

# Generate Prisma client, then compile TypeScript
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# ============================================================
# Stage 2: Production runtime
# ============================================================
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL 1.1 (required by Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema (needed for runtime client resolution)
COPY backend/prisma ./backend/prisma

# Copy compiled JS from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Uploads directory (writable at runtime)
RUN mkdir -p public/uploads

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
