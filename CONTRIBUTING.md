# Contributing

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build: `npm run build`

## Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests for new features
4. Ensure tests pass: `npm test && npm run build && npm run lint`
5. Commit with conventional format: `git commit -m "feat: add feature"`

## Guidelines

### Code Style

- Follow existing TypeScript patterns
- Use Prettier (100-char width) and ESLint
- Avoid `any` types, prefer `unknown` or specific types
- Add JSDoc comments for public APIs

### Testing

- Write tests for all new features
- Test both success and error cases
- Use descriptive test names

### Pull Requests

- Use conventional commit titles (`feat:`, `fix:`, `docs:`)
- Keep PRs focused and reasonably sized
- Update documentation for new features
- Reference related issues

### Before Submitting

- [ ] Tests pass
- [ ] Build succeeds
- [ ] Linting passes
- [ ] Documentation updated

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- No harassment or personal attacks

## Questions

Use GitHub Issues for bugs and feature requests.
