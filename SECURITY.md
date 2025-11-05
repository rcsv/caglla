# Security Policy

## Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| v1.8.x  | :white_check_mark: |
| < v1.8  | :x:                |

**Note**: The `support/v1.8` branch receives security patches. See [EOL Policy](docs/development/eol-policy.md) for details on support lifecycle.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **Do NOT** open a public issue

Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.

### 2. Report via secure channels

**Preferred method**: Email security reports to the repository maintainers.

**What to include in your report**:
- Type of vulnerability (e.g., authentication bypass, data exposure, injection)
- Affected component or file paths
- Steps to reproduce the vulnerability
- Potential impact and severity assessment
- Suggested fix (if any)
- Your contact information (optional, for follow-up questions)

### 3. Response timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity and complexity

### 4. Vulnerability handling process

1. **Confirmation**: We will acknowledge receipt and confirm the vulnerability
2. **Assessment**: We will assess the severity and impact
3. **Fix development**: We will develop and test a fix
4. **Disclosure**: We will coordinate disclosure after the fix is deployed
5. **Credit**: We will credit you (if desired) in the security advisory

### 5. Severity classification

We use the following severity levels:

- **Critical**: Remote code execution, authentication bypass, unauthorized data access
- **High**: Privilege escalation, sensitive data exposure, denial of service
- **Medium**: Information disclosure, security misconfiguration
- **Low**: Minor security issues, best practice violations

## Security Best Practices

### For Users

1. **Keep your dependencies updated**: Regularly update your project dependencies
2. **Use environment variables securely**: Never commit secrets or API keys to the repository
3. **Follow deployment guidelines**: See [Production Deployment Guide](docs/security/production-deployment-guide.md)
4. **Review security rules**: Ensure Firebase Security Rules are properly configured

### For Developers

1. **Follow secure coding practices**: See our [Development Guidelines](docs/development/)
2. **Use the centralized logger**: Avoid logging sensitive information
3. **Validate input**: Always validate and sanitize user input
4. **Use authenticated requests**: Use `makeAuthenticatedRequest` for API calls
5. **Review security documentation**: Check [Security Documentation](docs/security/) regularly

## Security Features

### Authentication & Authorization

- **Firebase Authentication**: Google OAuth integration
- **API Authentication**: Bearer token validation for all API endpoints
- **Firestore Security Rules**: Row-level security for data access
- **Firebase Storage Rules**: File-level access control

### Data Protection

- **Environment Variable Validation**: Strict validation of required environment variables
- **Error Handling**: Sanitized error messages in production
- **Logging**: Production-safe logging without sensitive data exposure

### Infrastructure Security

- **API Key Restrictions**: HTTP referrer and domain restrictions for API keys
- **CORS Configuration**: Properly configured CORS policies
- **Security Headers**: Content Security Policy and other security headers

## Recent Security Updates

### v1.8.2 (2025-10-21)
- **Security Patch**: API authentication and authorization implementation
- **Bearer token validation**: POST/GET endpoints are now protected
- **Ownership verification**: Authorization checks for day → trip ownership
- **Error handling**: Proper 401, 403, 404 error responses

See [Release Notes](docs/releases/v1.8.2.md) for details.

### Previous Security Improvements

- **v1.8.1**: Type safety improvements (reduced `as any` usage)
- **v1.8.0**: Versioning policy establishment
- **v1.1.0**: Security fixes summary (see [Security Fix Summary](docs/security/security-fix-summary.md))

## Security Resources

### Documentation

- [Production Deployment Guide](docs/security/production-deployment-guide.md) - Security checklist for production deployment
- [Security Fix Summary](docs/security/security-fix-summary.md) - Historical security fixes
- [API Authentication Issue](docs/security/api-authentication-issue.md) - API authentication implementation
- [Vulnerability Report (2025-10-09)](docs/migration/vulnerability-20251009.md) - Security audit results

### Related Policies

- [Versioning Policy](docs/development/versioning.md) - Version management and support
- [EOL Policy](docs/development/eol-policy.md) - End-of-life and support branch lifecycle
- [Branch Strategy](docs/development/branch-strategy.md) - Git workflow and branch management

## Vulnerability Disclosure Policy

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Private reporting**: Report vulnerabilities privately to maintainers
2. **No public disclosure**: Do not disclose vulnerabilities publicly until fixed
3. **Coordinated disclosure**: We will coordinate disclosure after the fix is deployed
4. **Credit**: We will credit security researchers (if desired) in advisories

### What We Promise

- We will acknowledge your report within 48 hours
- We will keep you informed of the progress
- We will credit you (if desired) for responsible disclosure
- We will not take legal action against security researchers acting in good faith

### What We Ask

- Act in good faith and avoid accessing or modifying data that does not belong to you
- Do not disrupt our services or users
- Do not disclose the vulnerability publicly until we have addressed it
- Provide sufficient information to reproduce and validate the vulnerability

## Security Updates

Security updates are typically released through:

1. **Patch releases**: Security fixes are included in patch releases (e.g., v1.8.2)
2. **Security advisories**: Critical vulnerabilities may be disclosed via GitHub Security Advisories
3. **Release notes**: Security updates are documented in [Release Notes](docs/releases/)

## Contact

For security-related inquiries, please contact the repository maintainers through secure channels.

**Note**: This security policy is subject to change. Please check this document periodically for updates.

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0

