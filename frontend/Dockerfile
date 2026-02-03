# Frontend Dockerfile for BuildTrack

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Use dumb-init
ENTRYPOINT ["dumb-init", "--"]

CMD ["npm", "start"]
