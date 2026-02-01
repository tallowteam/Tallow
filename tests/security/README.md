# Security Test Suite

## Overview

Comprehensive security testing for TALLOW file transfer application.

## Test Files

### 1. ip-leak.test.ts
**Purpose:** WebRTC IP leak prevention testing
**Coverage:**
- ICE candidate filtering
- RTCConfiguration validation
- SDP filtering
- IP leak detection callbacks
- Statistics tracking

**Run:** `npm test tests/security/ip-leak.test.ts`

### 2. api-security.test.ts
**Purpose:** API endpoint security testing
**Coverage:**
- CSRF protection
- Rate limiting
- Input validation
- Authentication bypass attempts
- SSRF protection
- Error handling

**Run:** `npm test tests/security/api-security.test.ts`

### 3. crypto-security.test.ts
**Purpose:** Cryptographic implementation testing
**Coverage:**
- Nonce uniqueness
- Key derivation
- Random number quality
- Timing attack resistance
- Double ratchet security
- Memory wiping

**Run:** `npm test tests/security/crypto-security.test.ts`

### 4. rate-limit.test.ts
**Purpose:** Rate limiting security testing
**Coverage:**
- IP spoofing prevention
- Distributed attacks
- Slowloris protection
- Header manipulation
- Concurrent requests

**Run:** `npm test tests/security/rate-limit.test.ts`

### 5. input-validation.test.ts
**Purpose:** Input validation and injection testing
**Coverage:**
- SQL injection
- XSS prevention
- Path traversal
- Command injection
- LDAP/NoSQL injection
- Unicode security

**Run:** `npm test tests/security/input-validation.test.ts`

### 6. webrtc-security.test.ts
**Purpose:** WebRTC security configuration testing
**Coverage:**
- DTLS configuration
- Certificate validation
- ICE security
- Privacy mode
- Connection monitoring

**Run:** `npm test tests/security/webrtc-security.test.ts`

## Running Tests

### All Security Tests
```bash
npm test tests/security/
```

### Specific Test Suite
```bash
npm test tests/security/ip-leak.test.ts
```

### With Coverage
```bash
npm test -- --coverage tests/security/
```

### Watch Mode
```bash
npm test -- --watch tests/security/
```

## Test Results

### Summary Statistics
- **Total Test Suites:** 6
- **Total Test Cases:** ~145
- **Coverage Areas:** API, Crypto, Privacy, WebRTC, Input Validation

### Expected Results
All tests should pass in a properly configured environment:
```
✓ IP Leak Prevention (15 tests)
✓ API Security (25 tests)
✓ Crypto Security (30 tests)
✓ Rate Limiting (20 tests)
✓ Input Validation (35 tests)
✓ WebRTC Security (20 tests)
```

## Security Testing Checklist

### Pre-Deployment
- [ ] All security tests passing
- [ ] No critical vulnerabilities
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Input validation working
- [ ] IP leak prevention verified

### Post-Deployment
- [ ] Monitor security logs
- [ ] Review rate limit hits
- [ ] Check error reports
- [ ] Verify HTTPS enforcement
- [ ] Validate TURN server config

## Common Issues

### Test Failures

#### IP Leak Tests Failing
**Symptom:** Candidates not being filtered
**Solution:** Check TURN server configuration and privacy mode settings

#### Rate Limit Tests Failing
**Symptom:** Rate limits not triggering
**Solution:** Verify rate limiter initialization and IP extraction

#### Crypto Tests Failing
**Symptom:** Nonce collisions or timing issues
**Solution:** Ensure crypto.getRandomValues is available

### Configuration Issues

#### Missing Environment Variables
Required for full test coverage:
```env
NEXT_PUBLIC_TURN_SERVER=turns:relay.example.com:443
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=credential
NEXT_PUBLIC_FORCE_RELAY=true
```

#### Browser API Mocking
Some tests require browser APIs. Vitest automatically mocks:
- `crypto.getRandomValues`
- `RTCPeerConnection`
- `localStorage`

## Contributing Security Tests

### Adding New Tests

1. Create test file in `tests/security/`
2. Follow naming convention: `feature-security.test.ts`
3. Include descriptive test names
4. Document expected behavior
5. Update this README

### Test Structure
```typescript
describe('Feature Security', () => {
  describe('Sub-feature', () => {
    it('should prevent attack X', () => {
      // Arrange
      const maliciousInput = '...';

      // Act
      const result = validateInput(maliciousInput);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
```

## Security Best Practices

### Writing Secure Tests

1. **Test Both Success and Failure Cases**
   - Verify valid input passes
   - Verify invalid input fails

2. **Use Realistic Attack Vectors**
   - Reference OWASP guidelines
   - Include real-world examples

3. **Test Edge Cases**
   - Empty inputs
   - Maximum lengths
   - Special characters
   - Type confusion

4. **Verify Security Properties**
   - Timing-safe comparisons
   - Proper randomness
   - Secure defaults

### Code Review

Security tests should be reviewed by:
- [ ] Development team
- [ ] Security lead
- [ ] External auditor (for critical changes)

## Penetration Testing Report

See `reports/PENETRATION_TEST_2026-01-30.md` for:
- Detailed vulnerability analysis
- Risk assessment
- Remediation recommendations
- Compliance considerations

## Automated Security Scanning

### Static Analysis
```bash
npm run lint:security
```

### Dependency Scanning
```bash
npm audit
npm audit fix
```

### SAST Integration
Consider integrating:
- SonarQube
- Snyk
- GitHub Advanced Security

## Incident Response

### Security Issue Found?

1. **DO NOT** commit security vulnerabilities
2. Report to security team immediately
3. Create private security advisory
4. Follow responsible disclosure timeline

### Contact
- Security Email: security@tallow.app (if applicable)
- GitHub Security: Use private security advisory
- Emergency: Contact repository maintainers

## Resources

### External References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [WebRTC Security](https://webrtc-security.github.io/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

### Internal Documentation
- Architecture diagrams: `/docs/architecture/`
- Security architecture: `/docs/security/`
- API documentation: `/docs/api/`

## Maintenance

### Regular Tasks
- [ ] Run security tests weekly
- [ ] Update dependencies monthly
- [ ] Review test coverage quarterly
- [ ] Penetration test annually

### Version History
- v1.0.0 (2026-01-30) - Initial security test suite
- Added comprehensive OWASP Top 10 coverage
- Added WebRTC security tests
- Added cryptographic security tests

---

**Last Updated:** January 30, 2026
**Maintained By:** Development & Security Teams
**Status:** Active
