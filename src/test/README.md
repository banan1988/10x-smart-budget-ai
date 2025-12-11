# Test Directory Structure

## Overview

This directory contains all test-related utilities, setup files, and mocks.

```
src/test/
├── setup.ts                 # Global test setup with MSW configuration
├── example.test.ts          # Example unit test
└── mocks/
    ├── server.ts            # MSW server configuration
    └── handlers.ts          # API request handlers for MSW
```

## Files

### setup.ts
Global setup file that runs before all tests. Configures:
- Testing Library matchers
- Mock Service Worker server lifecycle
- Global test utilities

### mocks/server.ts
Mock Service Worker (MSW) server configuration. Sets up:
- API request intercepting
- Error handling for unhandled requests

### mocks/handlers.ts
Defines all mock API handlers. Add handlers here for:
- Authentication endpoints
- API routes
- External service calls

## Example Test

See `example.test.ts` for a complete example of how to write tests.

## Guidelines

1. **Place test files next to code**: Test files should be in the same directory as the code they test
2. **Use .test.ts or .spec.ts**: Both extensions are supported
3. **Use MSW for API calls**: Don't make real API calls in tests
4. **Mock external dependencies**: Keep tests isolated and fast

## Running Tests

```bash
# Watch mode (recommended during development)
npm run test

# UI mode
npm run test:ui

# Run once
npm run test:run

# Coverage
npm run test:coverage
```

