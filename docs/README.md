# TALLOW Documentation

Welcome to the TALLOW documentation! This comprehensive guide covers everything from getting started to advanced development.

## 📚 Documentation Structure

### 🎯 User Guides (`/guides`)

Perfect for end-users wanting to use TALLOW for secure file transfers.

- **[Getting Started](./guides/getting-started.md)** - New user walkthrough and quick start
- **[Sending Files](./guides/sending-files.md)** - Complete guide to sending files
- **[Receiving Files](./guides/receiving-files.md)** - How to receive files
- **[Group Transfer](./guides/group-transfer.md)** - Multi-recipient transfers
- **[Privacy Mode](./guides/privacy-mode.md)** - Onion routing and privacy features
- **[Encrypted Chat](./guides/chat.md)** - Using the encrypted chat feature
- **[Troubleshooting](./guides/troubleshooting.md)** - Common issues and solutions

### 🔧 Developer Documentation (`/development`)

For developers contributing to TALLOW or integrating it.

- **[Architecture](./development/architecture.md)** - System design and components
- **[Crypto Implementation](./development/crypto-implementation.md)** - Cryptography details
- **[WebRTC Flow](./development/webrtc-flow.md)** - P2P connection establishment
- **[Signaling Protocol](./development/signaling-protocol.md)** - WebRTC signaling messages
- **[Contributing](./development/contributing.md)** - How to contribute
- **[Testing](./development/testing.md)** - Testing guide and best practices
- **[Deployment](./development/deployment.md)** - Deployment options and guides

### 🔌 API Documentation (`/api`)

Complete API reference for programmatic access.

- **[API Reference](./api/README.md)** - Complete API documentation
- **[OpenAPI Specification](./api/openapi.yaml)** - Machine-readable API spec
- **[Authentication](./api/README.md#authentication)** - API authentication methods
- **[Rate Limiting](./api/README.md#rate-limiting)** - Rate limit policies
- **[Webhooks](./api/README.md#webhooks)** - Webhook integration

### 📊 Architecture Diagrams (`/diagrams`)

Visual representations of TALLOW's architecture.

- **[System Overview](./diagrams/system-overview.mmd)** - High-level system architecture
- **[Crypto Flow](./diagrams/crypto-flow.mmd)** - Encryption sequence diagram
- **[Transfer Flow](./diagrams/transfer-flow.mmd)** - Complete file transfer flow
- **[P2P Connection](./diagrams/p2p-connection.mmd)** - WebRTC connection setup

## 🚀 Quick Links

### For Users
- 🆕 New to TALLOW? Start with [Getting Started](./guides/getting-started.md)
- 📤 Sending files? Read [Sending Files Guide](./guides/sending-files.md)
- 📥 Receiving files? Check [Receiving Files Guide](./guides/receiving-files.md)
- 🔒 Want maximum privacy? See [Privacy Mode](./guides/privacy-mode.md)
- ❓ Having issues? Visit [Troubleshooting](./guides/troubleshooting.md)

### For Developers
- 🏗️ Understanding TALLOW? Read [Architecture](./development/architecture.md)
- 🔐 Working with crypto? See [Crypto Implementation](./development/crypto-implementation.md)
- 🤝 Want to contribute? Check [Contributing Guide](./development/contributing.md)
- 🧪 Writing tests? Read [Testing Guide](./development/testing.md)
- 🚀 Deploying TALLOW? See [Deployment Guide](./development/deployment.md)

### For Integrators
- 🔌 Using the API? Read [API Reference](./api/README.md)
- 📋 Need OpenAPI spec? See [openapi.yaml](./api/openapi.yaml)
- 🪝 Setting up webhooks? Check [Webhooks Guide](./api/README.md#webhooks)

## 🎓 Learning Path

### Beginner Path

1. **Install and Setup**
   - Read [Getting Started](./guides/getting-started.md)
   - Complete your first transfer
   - Explore the interface

2. **Basic Features**
   - Learn to [send files](./guides/sending-files.md)
   - Learn to [receive files](./guides/receiving-files.md)
   - Try password protection

3. **Advanced Features**
   - Set up [group transfers](./guides/group-transfer.md)
   - Enable [privacy mode](./guides/privacy-mode.md)
   - Use encrypted [chat](./guides/chat.md)

### Developer Path

1. **Architecture Overview**
   - Read [System Architecture](./development/architecture.md)
   - Review [Architecture Diagrams](./diagrams/)
   - Understand the tech stack

2. **Core Concepts**
   - Study [Crypto Implementation](./development/crypto-implementation.md)
   - Learn [WebRTC Flow](./development/webrtc-flow.md)
   - Understand [Signaling Protocol](./development/signaling-protocol.md)

3. **Development**
   - Set up development environment
   - Read [Contributing Guide](./development/contributing.md)
   - Write and run [tests](./development/testing.md)

4. **Deployment**
   - Choose deployment method
   - Follow [Deployment Guide](./development/deployment.md)
   - Configure monitoring

### API Integration Path

1. **API Basics**
   - Read [API Overview](./api/README.md)
   - Understand authentication
   - Review rate limits

2. **Implementation**
   - Study [OpenAPI Spec](./api/openapi.yaml)
   - Implement endpoints
   - Test integration

3. **Production**
   - Set up webhooks
   - Configure error handling
   - Monitor API usage

## 📖 Documentation by Topic

### Security & Privacy
- [Crypto Implementation](./development/crypto-implementation.md) - Post-quantum cryptography
- [Privacy Mode](./guides/privacy-mode.md) - Onion routing and anonymity
- [Security Policy](../SECURITY.md) - Security practices
- [Threat Model](./development/architecture.md#threat-model) - What we protect against

### File Transfer
- [Sending Files](./guides/sending-files.md) - Send files securely
- [Receiving Files](./guides/receiving-files.md) - Receive and verify files
- [Group Transfer](./guides/group-transfer.md) - Multi-recipient transfers
- [Transfer Flow Diagram](./diagrams/transfer-flow.mmd) - Visual flow

### Communication
- [Encrypted Chat](./guides/chat.md) - Secure messaging
- [Signaling Protocol](./development/signaling-protocol.md) - WebRTC signaling
- [WebRTC Flow](./development/webrtc-flow.md) - Connection establishment

### Development
- [Architecture](./development/architecture.md) - System design
- [Contributing](./development/contributing.md) - Contribution guidelines
- [Testing](./development/testing.md) - Test strategy
- [Deployment](./development/deployment.md) - Deployment options

### API & Integration
- [API Reference](./api/README.md) - Complete API docs
- [OpenAPI Spec](./api/openapi.yaml) - Machine-readable spec
- [Webhooks](./api/README.md#webhooks) - Event notifications

## 🔍 Finding Information

### Search Tips

1. **Use the GitHub search** in the `/docs` folder
2. **Check the index** in each section's README
3. **Review diagrams** for visual understanding
4. **Read examples** in the guides

### Common Questions

**"How do I send files to multiple people?"**
→ See [Group Transfer Guide](./guides/group-transfer.md)

**"Is TALLOW really quantum-resistant?"**
→ Read [Crypto Implementation](./development/crypto-implementation.md)

**"How do I deploy TALLOW?"**
→ Follow [Deployment Guide](./development/deployment.md)

**"Can I integrate TALLOW into my app?"**
→ Check [API Documentation](./api/README.md)

**"How does the encryption work?"**
→ Study [Crypto Flow Diagram](./diagrams/crypto-flow.mmd)

## 🤝 Contributing to Documentation

Found an error or want to improve the docs?

1. **Report Issues**: Open an issue on GitHub
2. **Submit Pull Requests**: Fix typos, add examples
3. **Request Topics**: Suggest new documentation
4. **Improve Clarity**: Simplify complex topics

See [Contributing Guide](./development/contributing.md) for details.

## 📝 Documentation Standards

Our documentation follows these principles:

- **Clear**: Simple language, avoid jargon
- **Complete**: Cover all features and use cases
- **Current**: Keep up-to-date with code changes
- **Correct**: Technically accurate
- **Accessible**: Easy to navigate and search

## 🆘 Getting Help

If you can't find what you're looking for:

1. **Check [Troubleshooting](./guides/troubleshooting.md)** for common issues
2. **Search [GitHub Issues](https://github.com/your-org/tallow/issues)** for similar questions
3. **Ask on [GitHub Discussions](https://github.com/your-org/tallow/discussions)**
4. **Email support**: support@tallow.example

## 📊 Documentation Stats

- **Total Pages**: 20+
- **Code Examples**: 100+
- **Diagrams**: 4 (Mermaid)
- **Languages**: English (more coming)
- **Last Updated**: 2026-01-30

## 🗺️ Documentation Roadmap

### Planned Documentation

- [ ] Video tutorials
- [ ] Interactive examples
- [ ] Mobile app guides
- [ ] CLI documentation
- [ ] Federation protocol
- [ ] Self-hosting guide (advanced)
- [ ] Performance tuning guide
- [ ] Security best practices
- [ ] Multi-language docs (ES, FR, DE)

## 📜 License

Documentation is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Code examples in documentation are licensed under MIT.

---

**Need help?** Contact us at support@tallow.example or open an issue on GitHub.
