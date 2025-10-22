# Contributing to Billow

Thank you for your interest in contributing to Billow! 🌊

## Prerequisites

- Node.js 20+
- Docker Desktop
- Git

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/2dame/billow.git
   cd billow
   ```

2. **Start the database**
   ```bash
   docker compose up -d
   ```

3. **Setup backend**
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run db:migrate
   npm run dev
   ```

4. **Setup frontend** (new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Code Style

- Use **TypeScript** strict mode
- Follow **ESLint** and **Prettier** configurations
- Write **descriptive commit messages** (Conventional Commits)
  - `feat:` new features
  - `fix:` bug fixes
  - `docs:` documentation changes
  - `chore:` maintenance tasks
  - `test:` adding/updating tests

## Testing

- Run backend tests: `cd server && npm test`
- Ensure all tests pass before submitting PR

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting: `npm run lint`
5. Run tests: `npm test`
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to your fork (`git push origin feature/amazing-feature`)
8. Open a Pull Request with a clear description

## Code Review

- PRs require at least one approval
- Address review feedback promptly
- Keep PRs focused and reasonably sized

## Questions?

Open an issue or reach out to the maintainers.

**Thank you for contributing!** 🙏

