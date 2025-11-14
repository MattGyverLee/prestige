# Testing Strategy for Prestige

## Philosophy: Black Box Integration Testing

This app uses **behavioral/integration tests** that verify **what works**, not **how it works internally**. This approach is ideal for a modernized legacy app because:

✅ **Tests survive refactoring** - Change implementation details without breaking tests
✅ **Tests survive UI changes** - Update components/styling without breaking tests
✅ **Tests verify real user workflows** - Ensure critical features actually work
✅ **Tests are maintainable** - No brittle component snapshots or implementation mocks

## What We Test

### Critical User Workflows

1. **Folder Loading** ([folder-loading.integration.test.ts](src/test/integration/folder-loading.integration.test.ts))
   - User selects folder → Files discovered → Timeline created
   - EAF parsing → Media categorization → Redux store updated
   - **OUTCOME**: Timeline ready for playback with correct media files

2. **DeeJay Playback** ([deejay-playback.integration.test.ts](src/test/integration/deejay-playback.integration.test.ts)) ⭐ **MOST CRITICAL**
   - Timeline loading → Auto-play triggered
   - Region clicking → Clip playback from position
   - Waveform seeking → Multi-track synchronization
   - Volume control → Track muting/soloing
   - Multi-track sync → Different playback rates coordinated
   - **OUTCOME**: Core playback engine works correctly
   - **📖 Detailed Guide**: [docs/DEEJAY_TESTING.md](docs/DEEJAY_TESTING.md)

3. **Video Export** ([video-export.integration.test.ts](src/test/integration/video-export.integration.test.ts))
   - Timeline + volume settings → Export triggered → FFmpeg receives clips
   - "Kings and Princes" audio logic (volume >= 0.7 = King, else Prince)
   - **OUTCOME**: Video exported successfully with synchronized multilingual audio

4. **File Watching** ([file-watching.integration.test.ts](src/test/integration/file-watching.integration.test.ts))
   - Files added → UI updates → Media categorized
   - Files deleted → UI updates → Media removed
   - Files changed → UI updates → Media refreshed
   - **OUTCOME**: App reflects current folder state in real-time

## What We Don't Test

❌ **Internal implementation details** - Private functions, component internals
❌ **Exact UI rendering** - No snapshot tests for layout/styling
❌ **Library internals** - Don't test chokidar, wavesurfer, FFmpeg directly
❌ **How things work underneath** - Focus on outcomes, not mechanisms

## Test Structure

```
src/test/
├── integration/              # High-level workflow tests
│   ├── folder-loading.integration.test.ts
│   ├── video-export.integration.test.ts
│   └── file-watching.integration.test.ts
│
├── fixtures/                 # Test data generators
│   ├── timeline-generator.ts           # Timeline test scenarios
│   ├── eaf-samples.ts                  # Sample EAF XML files
│   └── __tests__/
│       └── timeline-generator.test.ts  # Fixture validation
│
└── setup.ts                  # Global test configuration
```

## Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once
npm run test:unit

# Run with coverage
npm run test:coverage

# Run integration tests only
npm test -- integration

# Run specific test file
npm test -- folder-loading
```

## Test Coverage

### Well-Tested ✅
- Video export logic (48 tests)
- Timeline generation (23 tests)
- Folder loading workflow (integration)
- File watching behavior (integration)
- Audio extraction and speed calculation

### Needs Coverage ⚠️
- Redux reducers (store mutations)
- Error handling across workflows
- Edge cases (corrupt files, missing media, etc.)
- Electron IPC handlers (main process)

## Writing New Tests

### DO ✅

```typescript
// Test OUTCOMES, not implementation
it("should load folder and create timeline", async () => {
  // GIVEN: Folder with EAF and media
  store.dispatch(actions.onNewFolder(folderPath, "project"));

  // WHEN: Files are processed
  // ... dispatch file discovery actions ...

  // THEN: Timeline exists and is ready for playback
  expect(state.annot.timeline).toHaveLength(1);
  expect(state.annot.timeline[0].milestones.length).toBeGreaterThan(0);
});
```

### DON'T ❌

```typescript
// Don't test implementation details
it("should call parseEAF function with correct arguments", () => {
  const spy = vi.spyOn(utils, "parseEAF");
  // ... test that parseEAF was called ...
  // BAD: This breaks when implementation changes
});

// Don't snapshot test UI
it("should render folder selection correctly", () => {
  const { container } = render(<FolderSelection />);
  expect(container).toMatchSnapshot();
  // BAD: Breaks when styling changes
});
```

## Mock Strategy

We mock **only the boundaries** (file system, Electron APIs, FFmpeg):

- ✅ `electronAPI` - Boundary between renderer and main process
- ✅ File I/O operations (readFile, writeFile, readDir)
- ✅ FFmpeg execution (exportVideo)
- ❌ Internal functions - Let real code run
- ❌ React components - Let real components render
- ❌ Redux store - Use real store in tests

See [src/test/setup.ts](src/test/setup.ts) for mock configuration.

## Test Fixtures

### Timeline Scenarios ([src/test/fixtures/timeline-generator.ts](src/test/fixtures/timeline-generator.ts))

```typescript
import { testScenarios } from "../test/fixtures/timeline-generator";

// Pre-configured realistic timelines
testScenarios.simple();            // 3 milestones, no voiceovers
testScenarios.complex();           // 10 milestones, multilingual
testScenarios.kingsAndPrinces();   // Volume logic testing
testScenarios.manyShort();         // Stress test (50 milestones)
testScenarios.noClipTimes();       // Edge case (missing data)
```

### EAF File Samples ([src/test/fixtures/eaf-samples.ts](src/test/fixtures/eaf-samples.ts))

```typescript
import { allEAFSamples } from "../test/fixtures/eaf-samples";

// Realistic EAF XML content
allEAFSamples.minimal;        // Simple 2-annotation file
allEAFSamples.multilingual;   // CarefulMerged + TranslationMerged
allEAFSamples.long;           // 20 annotations (stress test)
allEAFSamples.corrupt;        // Invalid XML (error handling)
allEAFSamples.overlapping;    // Overlapping time slots (edge case)
```

## Coverage Goals

Target: **70%** coverage (configured in [vitest.config.ts](vitest.config.ts))

Focus on:
- Critical user workflows (folder loading, export, playback)
- Error handling (corrupt files, missing media, failed exports)
- Edge cases (empty folders, special characters, long files)

Don't obsess over:
- UI component rendering details
- Styling/layout code
- Development-only code

## Future: E2E Testing (Optional)

For absolute confidence, consider **Playwright for Electron**:

```typescript
// E2E test with real files
test("complete workflow with real test folder", async () => {
  // Launch real Electron app
  const app = await electron.launch({ args: ["main.js"] });

  // Use real test fixtures folder
  await app.selectFolder("test-fixtures/sample-project");

  // Verify timeline appears
  await page.waitForSelector(".timeline");

  // Export video
  await page.click("button[aria-label='Export']");

  // Verify output file exists
  const outputExists = await fs.pathExists("export-*.mp4");
  expect(outputExists).toBe(true);
});
```

**Pros**: Tests the real app with real files
**Cons**: Slower, requires test media files, harder to debug

For now, **integration tests provide 90% of the confidence with 10% of the complexity**.

## Example Test: Folder Loading

```typescript
describe("Folder Loading Workflow", () => {
  it("should successfully load folder with EAF and media files", async () => {
    // GIVEN: A folder with files
    const folderPath = "/test/project-folder";
    mockElectronAPI.selectFolder.mockResolvedValue(folderPath);
    mockElectronAPI.readFile.mockResolvedValue(allEAFSamples.minimal.content);

    // WHEN: User selects folder
    store.dispatch(actions.onNewFolder(folderPath, "project"));

    // Simulate file discovery
    store.dispatch(actions.fileAdded({ path: `${folderPath}/video.mp4`, ... }));
    store.dispatch(actions.sourceMediaAdded({ path: `${folderPath}/video.mp4`, ... }));

    // Parse EAF and create timeline
    const timeline = { milestones: [...], syncMedia: [...] };
    store.dispatch(actions.pushTimeline(timeline));

    // THEN: Store reflects loaded state
    const state = store.getState();
    expect(state.tree.folderPath).toBe(folderPath);
    expect(state.annot.sourceMedia).toHaveLength(1);
    expect(state.annot.timeline).toHaveLength(1);

    // CRITICAL: Timeline is ready for playback
    expect(state.annot.timeline[0].syncMedia).toBeDefined();
  });
});
```

**Key Points**:
- Tests the complete workflow end-to-end
- Uses mocked file system, but real Redux store
- Verifies OUTCOME (timeline created), not HOW (internal functions called)
- Survives refactoring (components, functions can change freely)

## Debugging Failed Tests

### 1. Check Mock Configuration
```typescript
// In your test
console.log(mockElectronAPI.selectFolder.mock.calls);
console.log(mockElectronAPI.selectFolder.mock.results);
```

### 2. Inspect Redux Store State
```typescript
const state = store.getState();
console.log(JSON.stringify(state, null, 2));
```

### 3. Use Vitest UI
```bash
npm run test:ui
# Opens browser with interactive test explorer
```

### 4. Isolate the Test
```typescript
it.only("should load folder", async () => {
  // Only this test runs
});
```

## Contributing Tests

When adding new features:

1. **Write integration test first** (TDD optional but recommended)
2. **Test the user workflow**, not the implementation
3. **Use existing fixtures** ([timeline-generator.ts](src/test/fixtures/timeline-generator.ts), [eaf-samples.ts](src/test/fixtures/eaf-samples.ts))
4. **Mock only boundaries** (file system, Electron, FFmpeg)
5. **Verify outcomes** (timeline created, export succeeded, etc.)

## Questions?

- **"Should I test this internal function?"** → No, test the workflow that uses it
- **"Should I snapshot this component?"** → No, test the behavior it enables
- **"Should I mock this Redux action?"** → No, use the real action and real store
- **"How do I test without real files?"** → Use mocks in [setup.ts](src/test/setup.ts) and fixtures

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)
- [Integration Testing Best Practices](https://kentcdodds.com/blog/write-tests)
