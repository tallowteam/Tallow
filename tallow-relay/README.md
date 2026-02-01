# TALLOW Relay Server

A standalone relay node for the TALLOW onion routing network. This server provides anonymous routing for file transfers by implementing a multi-hop encryption protocol.

## Overview

The TALLOW onion routing system uses three types of relays:

1. **Entry Relays** - Accept client connections (first hop)
2. **Middle Relays** - Forward encrypted data (intermediate hops)
3. **Exit Relays** - Connect to destination peers (final hop)

## Protocol

```
CLIENT -> ENTRY: Establish PQC session, send onion packet
ENTRY -> MIDDLE: Peel one layer, forward
MIDDLE -> EXIT: Peel one layer, forward
EXIT -> DESTINATION: Final decryption, deliver to peer
```

Each hop uses **ML-KEM-768** (Kyber) for post-quantum secure key exchange and **AES-256-GCM** for symmetric encryption.

## Quick Start

### Using Docker Compose (Recommended)

Start a complete local relay network with 4 relays:

```bash
cd tallow-relay
docker-compose up -d
```

This creates:
- 1 Entry relay on port 8441
- 2 Middle relays on ports 8442, 8443
- 1 Exit relay on port 8444
- Directory service on port 8080

### Using Node.js

```bash
cd tallow-relay
npm install
npm start
```

With custom configuration:

```bash
RELAY_PORT=8443 RELAY_ROLE=entry RELAY_REGION=us-east-1 npm start
```

Or using command line arguments:

```bash
node relay-server.js --port=8443 --role=entry --region=us-east-1
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `RELAY_PORT` | 8443 | WebSocket server port |
| `RELAY_ROLE` | any | Relay role: entry, middle, exit, or any |
| `RELAY_REGION` | unknown | Geographic region identifier |
| `RELAY_DIRECTORY_URL` | - | URL of relay directory service |

## Endpoints

### WebSocket: `/relay`
Main relay protocol endpoint for circuit operations.

### HTTP: `/health`
Health check endpoint returning relay status and statistics.

```json
{
  "status": "ok",
  "relayId": "relay-a1b2c3d4",
  "role": "entry",
  "region": "us-east-1",
  "stats": {
    "circuitsCreated": 150,
    "circuitsActive": 23,
    "bytesForwarded": 1073741824,
    "messagesRelayed": 50000,
    "errors": 2
  }
}
```

### HTTP: `/info`
Relay information including public key for circuit establishment.

```json
{
  "id": "relay-a1b2c3d4",
  "publicKey": "base64-encoded-ml-kem-768-public-key...",
  "role": "entry",
  "region": "us-east-1",
  "endpoint": "wss://relay.example.com"
}
```

## Message Protocol

### Message Format
```
[type:1] [requestId:4] [circuitIdLen:1] [circuitId:n] [payloadLen:4] [payload:m]
```

### Message Types

| Type | Name | Description |
|------|------|-------------|
| 0x01 | HELLO | Client handshake initiation |
| 0x02 | HELLO_RESPONSE | Server handshake response |
| 0x10 | CREATE_CIRCUIT | Create new circuit |
| 0x11 | CIRCUIT_CREATED | Circuit creation confirmation |
| 0x12 | EXTEND_CIRCUIT | Extend circuit to next hop |
| 0x13 | CIRCUIT_EXTENDED | Extension confirmation |
| 0x14 | DESTROY_CIRCUIT | Teardown circuit |
| 0x20 | RELAY_DATA | Encrypted data cell |
| 0x21 | RELAY_ACK | Data acknowledgment |
| 0x30 | HEARTBEAT | Keep-alive ping |
| 0x31 | HEARTBEAT_ACK | Keep-alive response |
| 0xFF | ERROR | Error response |

## Security Considerations

- All communications are encrypted with AES-256-GCM
- Key exchange uses ML-KEM-768 (post-quantum secure)
- Circuits automatically timeout after 10 minutes of inactivity
- Rate limiting prevents resource exhaustion attacks
- No logging of circuit data or destinations

## Production Deployment

For production deployments:

1. **TLS Termination**: Use a reverse proxy (nginx, Cloudflare) for TLS
2. **Multiple Regions**: Deploy relays in different geographic regions
3. **Monitoring**: Set up health check monitoring
4. **Redundancy**: Run multiple relays per role for availability

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name relay.tallow.network;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /relay {
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /health {
        proxy_pass http://localhost:8443;
    }
}
```

## License

MIT License - See LICENSE file for details.
