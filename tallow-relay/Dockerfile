FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy relay server
COPY relay-server.js ./

# Environment variables
ENV RELAY_PORT=8443
ENV RELAY_ROLE=any
ENV RELAY_REGION=unknown

# Expose WebSocket port
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8443/health || exit 1

# Run relay server
CMD ["node", "relay-server.js"]
