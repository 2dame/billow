# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email security concerns to: (add your email here)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Best Practices

When deploying Billow:

- ✅ Use strong, random JWT secrets
- ✅ Enable HTTPS in production
- ✅ Keep dependencies updated
- ✅ Use managed database services with encryption
- ✅ Set appropriate CORS origins (no wildcards)
- ✅ Enable rate limiting
- ✅ Regularly review access logs
- ✅ Use environment variables for secrets (never commit)

## Known Security Features

- JWT authentication with refresh tokens
- Row-Level Security (RLS) in PostgreSQL
- Bcrypt password hashing (10 rounds)
- Helmet security headers
- CORS allowlist
- Rate limiting on sensitive routes
- Zod input validation
- SQL injection protection via parameterized queries

Thank you for helping keep Billow secure! 🔒

