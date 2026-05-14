# Contributing Guidelines

Thank you for considering contributing to the Pet Grooming Management System (BBP)! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Style](#code-style)
5. [Testing](#testing)
6. [Commit Messages](#commit-messages)
7. [Pull Requests](#pull-requests)
8. [Issues](#issues)

---

## Code of Conduct

- Be respectful and professional
- Provide constructive feedback
- Help others learn and grow
- Focus on the code, not the person
- Be inclusive and welcoming

---

## Getting Started

### 1. Fork & Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bbp-front.git
cd bbp-front

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_REPO/bbp-front.git
```

### 2. Create a Branch
```bash
# Update main branch
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Set Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

---

## Development Workflow

### 1. Make Changes

**Do:**
- ✅ Create focused, single-responsibility changes
- ✅ Update tests alongside code changes
- ✅ Follow existing code patterns
- ✅ Keep commits small and logical

**Don't:**
- ❌ Combine multiple unrelated changes
- ❌ Refactor unrelated code
- ❌ Add unused imports or variables
- ❌ Ignore linting errors

### 2. Run Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific file
pnpm test -- filename.test.ts
```

### 3. Check Linting
```bash
pnpm lint
```

### 4. Type Check
```bash
pnpm type-check
```

### 5. Build Locally
```bash
pnpm build
```

---

## Code Style

### TypeScript Guidelines
- Use strict mode (no `any` types)
- Define interfaces for objects
- Use type aliases for union types
- Export types for external use

### React Components
- Use functional components with hooks
- Keep components focused and single-responsibility
- Extract custom hooks for reusable logic
- Memoize expensive computations with `useMemo`

### Naming Conventions
```typescript
// Components (PascalCase)
const UserForm = () => { }

// Functions (camelCase)
const formatUserName = () => { }

// Constants (UPPER_SNAKE_CASE)
const MAX_RETRY_ATTEMPTS = 3;

// Files matching exports
// Component: UserForm.tsx
// Hook: useAuth.ts
// Utility: formatters.ts
```

### Imports
```typescript
// Group imports: react, third-party, local
import React from 'react';
import { create } from 'zustand';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

// Avoid wildcard imports
// ❌ import * as utils from './utils';
// ✅ import { formatDate, parseJson } from './utils';
```

### Comments
- No obvious comments ("this sets x to y")
- Only WHY, not WHAT (code shows what)
- Mark TODO/FIXME with GitHub issue references: `// TODO: #123`

### Error Handling
- Use error classes from `lib/error-handler.ts`
- Throw specific errors (ValidationError, NotFoundError, etc.)
- Never catch errors silently without logging

---

## Testing

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('specific behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Coverage
- ✅ Happy path scenarios
- ✅ Error cases and edge cases
- ✅ User interactions
- ✅ State changes

### What to Test
- ✅ Utility functions
- ✅ Custom hooks
- ✅ Component props handling
- ✅ Error boundaries
- ✅ API routes

### What NOT to Test
- ❌ Third-party library behavior
- ❌ Framework features (React internals)
- ❌ Database queries (use mocks/fixtures)

---

## Commit Messages

### Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Type
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test additions/changes
- `docs`: Documentation
- `style`: Code formatting
- `chore`: Build/dependency updates
- `ci`: CI/CD changes

### Subject
- Lowercase first letter
- No period at end
- Imperative mood ("add" not "added")
- Max 50 characters
- Specific and descriptive

### Examples
```
✅ Good
feat: add dark mode support with next-themes
fix: prevent N+1 queries in product list
perf: optimize pagination query with batch loading
docs: add API authentication section

❌ Bad
Updated stuff
Fix some bugs
WIP: dark mode
Changed code
```

### Body (Optional)
- Explain WHY, not WHAT
- Reference related issues: `Fixes #123`, `Related to #456`
- Wrap at 72 characters
- Separate from subject with blank line

---

## Pull Requests

### PR Title
- Same format as commit message
- Descriptive and specific
- Reference issue number if applicable: `Fix: prevent N+1 queries (#123)`

### PR Description
```markdown
## Description
Brief summary of changes

## Related Issue
Fixes #123

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] No regressions found

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings/errors
- [ ] Changes are backward compatible
```

### Before Submitting
- ✅ Tests pass locally
- ✅ Linting passes
- ✅ Type checking passes
- ✅ Build succeeds
- ✅ Commits are logical and small
- ✅ PR description is clear

### Review Process
1. Request review from maintainers
2. Address feedback constructively
3. Re-request review after changes
4. Expect 1-2 day turnaround

---

## Issues

### Reporting Bugs
```markdown
**Describe the bug**
Clear description of the issue

**Steps to reproduce**
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What should happen

**Screenshots/Logs**
If applicable

**Environment**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Safari]
- Node version: [e.g. 18.0.0]
```

### Requesting Features
```markdown
**Is this related to a problem?**
Clear description

**Proposed solution**
Your suggestion

**Alternative solutions**
Other approaches considered

**Additional context**
Any other relevant information
```

---

## Review Checklist

When reviewing code:
- ✅ Does it solve the stated problem?
- ✅ Does it follow code style guidelines?
- ✅ Are there adequate tests?
- ✅ Is error handling appropriate?
- ✅ Is documentation complete?
- ✅ Are there no obvious bugs?
- ✅ Is performance acceptable?
- ✅ Does it maintain backward compatibility?

---

## Need Help?

- 📖 Read [README.md](README.md) for setup
- 📚 Check [docs/API.md](docs/API.md) for API reference
- 🐛 Review existing issues and discussions
- 💬 Ask in pull request comments or GitHub discussions

---

## Recognition

Contributors will be:
- Listed in release notes
- Credited in project documentation
- Added to contributors list

Thank you for improving BBP! 🚀

---

**Last Updated**: 2026-05-14  
**Version**: 1.0.0
