# ============================================================================
# Multi-stage Dockerfile for Tallow Next.js app (standalone output)
# Optimized for minimal image size with multi-architecture support (AMD64, ARM64)
# ============================================================================

# Build arguments for platform-specific optimization
ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.20

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps

# Platform-independent build tools
RUN apk add --no-cache libc6-compat python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (production + dev for build)
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

ARG NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

# Build Next.js app with standalone output
RUN npm run build

# ============================================================================
# Stage 3: Runner (Production)
# ============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

ARG NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install minimal runtime dependencies
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app && \
    chown -R nextjs:nodejs /app

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Add OCI image labels for metadata
LABEL org.opencontainers.image.title="Tallow"
LABEL org.opencontainers.image.description="Secure P2P file transfer and real-time communication platform"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.vendor="Tallow Project"
LABEL org.opencontainers.image.source="https://github.com/tallow-project/tallow"
LABEL org.opencontainers.image.documentation="https://tallow.app/docs"
LABEL org.opencontainers.image.licenses="MIT"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
