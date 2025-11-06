# Prestige Testing Infrastructure

## Overview

This project uses Vitest for fast, modern unit and integration testing. The test infrastructure is designed to make it easy to add new tests and generate test data programmatically.

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup (mocks, helpers)
│   ├── fixtures/
│   │   ├── timeline-generator.ts  # Generate test timelines programmatically
│   │   ├── media/                 # Generated test media files
│   │   │   ├── test-video-5s.mp4
│   │   │   ├── test-video-30s.mp4
│   │   │   ├── test-audio-5s.wav
│   │   │   └── annotations/
│   │   └── __tests__/
│   │       └── timeline-generator.test.ts
│   └── README.md (this file)
├── components/
│   └── **/__tests__/        # Component unit tests
└── store/
    └── **/__tests__/        # Redux store tests

public/
└── __tests__/               # IPC handler & library tests
    └── video-export-lib.test.js
```

## Running Tests

```bash
# Run all tests once
npm run test:unit

# Watch mode (re-run on file change)
npm run test:watch

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## Writing Unit Tests

### Example: Testing a Pure Function

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected output for valid input', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    const result = myFunction(null);
    expect(result).toBeUndefined();
  });
});
```

### Example: Testing a React Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Generating Test Data

### Timeline Generator

Use the timeline generator to create realistic test timelines:

```typescript
import { generateTestTimeline, testScenarios } from '@test/fixtures/timeline-generator';

// Custom timeline
const timeline = generateTestTimeline({
  numMilestones: 5,
  videoPath: '/test/video.mp4',
  audioPath: '/test/audio.wav',
  hasCareful: true,
  hasTranslation: true,
  avgDuration: 5
});

// Pre-configured scenarios
const simple = testScenarios.simple();        // 3 milestones, no voiceovers
const complex = testScenarios.complex();      // 10 milestones, multilingual
const kingsAndPrinces = testScenarios.kingsAndPrinces(); // With volume config
```

### Test Media Files

Generate test media files using FFmpeg:

```bash
npm run generate:fixtures
```

This creates:
- `test-video-5s.mp4` - Short 5-second test video
- `test-video-30s.mp4` - Longer 30-second test video
- `test-audio-5s.wav` - Short audio file
- `test-audio-30s.wav` - Long audio file
- `Careful_Merged.mp3` - Annotation audio track
- `Translation_Merged.mp3` - Translation audio track
- `sample-project/` - Complete project structure for E2E tests

## Test Coverage

Current coverage:

- **ExportVid.tsx**: 15 tests
  - `getAudio()` function
  - Kings/princes categorization
  - Speed calculations

- **Timeline Generator**: 19 tests
  - Milestone generation
  - Pre-configured scenarios
  - Annotation table generation

- **Video Export Library**: 27 tests
  - Tempo filter building (FFmpeg atempo stacking)
  - Filter complex generation
  - Clip validation
  - Duration calculations

**Total: 61 passing tests**

## Adding New Tests

### 1. Create Test File

Create a `__tests__` directory next to your source file:

```
src/components/MyComponent/
├── MyComponent.tsx
└── __tests__/
    └── MyComponent.test.tsx
```

### 2. Write Tests

```typescript
import { describe, it, expect } from 'vitest';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### 3. Run Tests

```bash
npm run test:watch  # Auto-runs when you save
```

## Mocking

### Electron API

The Electron API is mocked globally in `src/test/setup.ts`:

```typescript
import { mockElectronAPI } from '@test/setup';

// In your test
mockElectronAPI.getCwd.mockResolvedValue('/test/path');
```

### File System

For integration tests with file operations, use `memfs` (to be installed):

```typescript
import { vol } from 'memfs';

beforeEach(() => {
  vol.fromJSON({
    '/test/file.txt': 'content',
    '/test/dir/nested.json': '{"key": "value"}'
  });
});
```

## Snapshot Testing

Use snapshots for Redux state or component output:

```typescript
it('should match snapshot', () => {
  const component = render(<MyComponent />);
  expect(component).toMatchSnapshot();
});
```

Update snapshots when intentional changes are made:

```bash
npm run test:unit -- -u
```

## CI/CD Integration

Tests run automatically on:
- Every push to main/master or claude/* branches
- Every pull request

See `.github/workflows/test.yml` for configuration.

## Best Practices

1. **Keep tests focused**: One assertion per test when possible
2. **Use descriptive names**: `it('should calculate total when all items have prices', ...)`
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Test edge cases**: null, undefined, empty arrays, etc.
5. **Avoid implementation details**: Test behavior, not internals
6. **Use generators**: Create test data with `generateTestTimeline()` instead of hard-coding
7. **Mock external dependencies**: Use mocks for IPC, file system, etc.

## Troubleshooting

### Tests fail with "Cannot find module"

Run `npm ci` to install dependencies.

### Tests timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 30000  // 30 seconds
}
```

### Coverage not generated

Install coverage provider:

```bash
npm install -D @vitest/coverage-v8
```

## Next Steps

### Week 2: Integration Tests
- [ ] Install memfs for file system mocking
- [ ] Test IPC handlers in isolation
- [ ] Test file scanning operations
- [ ] Add 15+ integration tests

### Week 3: E2E Tests
- [ ] Install Playwright
- [ ] Configure Electron E2E testing
- [ ] Write 5 critical user workflows
- [ ] Test video export end-to-end

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
