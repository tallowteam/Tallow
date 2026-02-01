# Contributing to Tallow

Thank you for your interest in contributing to Tallow! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Security](#security)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Git
- Docker (optional, for containerized development)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tallow.git
   cd tallow
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/your-org/tallow.git
   ```

## Development Setup

### Local Development

```bash
# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Docker Development

```bash
# Start with Docker Compose
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose logs -f
```

### Environment Variables

See `.env.example` for required environment variables. At minimum, you need:

```env
NEXT_PUBLIC_SIGNALING_URL=http://localhost:3001
```

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/add-group-transfers` - New features
- `fix/connection-timeout` - Bug fixes
- `docs/update-api-docs` - Documentation
- `refactor/cleanup-crypto` - Code refactoring
- `security/fix-csrf-bypass` - Security fixes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(transfer): add resumable file transfers

Implement checkpoint-based resumption for large file transfers.
Supports resume after connection loss or browser refresh.

Closes #123
```

```
fix(crypto): prevent timing attack in key comparison

Use constant-time comparison with length padding to prevent
timing-based side-channel attacks.

Security: HIGH
```

### Code Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes following the [coding standards](#coding-standards)

3. Run tests and linting:
   ```bash
   npm run lint
   npm run test
   npm run test:e2e
   ```

4. Commit your changes:
   ```bash
   git commit -m "feat(scope): description"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature
   ```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New code has appropriate test coverage
- [ ] Documentation is updated if needed
- [ ] No console.log statements (use secureLog)
- [ ] No sensitive data in commits

### PR Template

When opening a PR, include:

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots
(if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks must pass (lint, tests, build)
2. At least one maintainer review required
3. Address review feedback
4. Squash commits if requested
5. Maintainer merges when approved

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer `interface` over `type` for object shapes
- Use meaningful variable names
- Document public APIs with JSDoc

```typescript
/**
 * Encrypts a file using PQC hybrid encryption
 * @param file - The file to encrypt
 * @param publicKey - Recipient's public key
 * @returns Encrypted file data with metadata
 */
export async function encryptFile(
  file: File,
  publicKey: Uint8Array
): Promise<EncryptedFile> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Prefer named exports
- Co-locate related files
- Use TypeScript interfaces for props

```typescript
interface TransferButtonProps {
  files: File[];
  onTransferComplete: (result: TransferResult) => void;
  disabled?: boolean;
}

export function TransferButton({
  files,
  onTransferComplete,
  disabled = false,
}: TransferButtonProps) {
  // Component implementation
}
```

### CSS/Styling

- Use Tailwind CSS utilities
- Follow mobile-first responsive design
- Maintain dark mode compatibility
- Use CSS variables for theming

### Security

- Never log sensitive data
- Use `secureLog` instead of `console.log`
- Validate all user input
- Use parameterized queries
- Follow OWASP guidelines

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# Run specific browser
npm run test:e2e -- --project=chromium
```

### Writing Tests

- Test file naming: `*.test.ts` or `*.spec.ts`
- Use descriptive test names
- Test edge cases and error paths
- Mock external dependencies

```typescript
describe('encryptFile', () => {
  it('should encrypt file with valid public key', async () => {
    const file = new File(['test content'], 'test.txt');
    const publicKey = generateTestPublicKey();

    const result = await encryptFile(file, publicKey);

    expect(result.encrypted).toBeDefined();
    expect(result.metadata.originalName).toBe('test.txt');
  });

  it('should throw on invalid public key', async () => {
    const file = new File(['test'], 'test.txt');
    const invalidKey = new Uint8Array(10);

    await expect(encryptFile(file, invalidKey))
      .rejects
      .toThrow('Invalid public key');
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments to public APIs
- Include usage examples in complex functions
- Document security considerations

### README Updates

- Update README for new features
- Keep installation instructions current
- Document breaking changes

### API Documentation

- Update `openapi.yml` for API changes
- Include request/response examples
- Document error responses

## Security

### Reporting Vulnerabilities

**Do not open public issues for security vulnerabilities.**

Instead, please email security@tallow.example with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you on a fix.

### Security Guidelines

When contributing security-sensitive code:

1. Use constant-time comparisons for secrets
2. Validate and sanitize all inputs
3. Use parameterized queries
4. Follow least privilege principle
5. Log security events (without sensitive data)
6. Add appropriate rate limiting

## Questions?

- Open a [GitHub Discussion](https://github.com/your-org/tallow/discussions)
- Check existing issues and PRs
- Review the documentation

Thank you for contributing to Tallow! Your efforts help make secure file sharing accessible to everyone.
