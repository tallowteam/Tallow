# TALLOW mDNS Daemon Dockerfile
#
# Build: docker build -t tallow-mdns-daemon .
# Run:   docker run -d --name tallow-daemon --net=host tallow-mdns-daemon
#
# Note: --net=host is required for mDNS multicast to work properly

FROM node:20-slim

# Set metadata
LABEL maintainer="Tallow Team"
LABEL description="TALLOW mDNS/Bonjour/Zeroconf daemon"
LABEL version="1.0.0"

# Install dependencies for mDNS
RUN apt-get update && apt-get install -y \
    libavahi-compat-libdnssd-dev \
    avahi-daemon \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose ports
# WebSocket API
EXPOSE 53318
# Transfer port (mDNS advertised)
EXPOSE 53317

# Environment variables
ENV NODE_ENV=production
ENV TALLOW_WS_PORT=53318

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const ws = require('ws'); const c = new ws('ws://localhost:53318'); c.on('open', () => { c.close(); process.exit(0); }); c.on('error', () => process.exit(1));"

# Run daemon
CMD ["node", "dist/index.js", "--advertise"]
