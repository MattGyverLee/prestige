# How to View Tests in Prestige

## Quick Start

```bash
# Option 1: Run once and see results
npm run test:unit

# Option 2: Watch mode (auto-refresh on file save)
npm run test:watch

# Option 3: Beautiful UI in browser
npm run test:ui

# Option 4: Generate coverage report
npm run test:coverage
```

---

## Detailed Guide

### 1. **Command Line Output**

```bash
npm run test:unit
```

**What you see:**
```
✓ src/test/fixtures/__tests__/timeline-generator.test.ts (19 tests) 12ms
✓ public/__tests__/video-export-lib.test.js (27 tests) 10ms
✓ src/components/FolderSelection/__tests__/ExportVid.test.ts (15 tests) 6ms

Test Files  3 passed (3)
Tests       61 passed (61)
Duration    4.08s
```

**When to use:** Quick check before committing

---

### 2. **Watch Mode (Interactive)** ⭐ Recommended

```bash
npm run test:watch
```

**What you get:**
- Tests re-run automatically when you save files
- Interactive menu:
  - Press `a` to run all tests
  - Press `f` to run only failed tests
  - Press `p` to filter by filename pattern
  - Press `t` to filter by test name pattern
  - Press `q` to quit

**When to use:** While writing tests or refactoring code

**Example workflow:**
1. Open `ExportVid.test.ts` in your editor
2. Run `npm run test:watch` in terminal
3. Make changes → Save → Tests auto-run
4. See instant feedback

---

### 3. **UI Mode (Browser Interface)** ⭐ Most Visual

```bash
npm run test:ui
```

**What you get:**
- Opens browser at `http://localhost:51204/__vitest__/`
- Visual test explorer with:
  - Tree view of all test files
  - Green/red indicators for pass/fail
  - Click any test to see details
  - Console logs for each test
  - Stack traces for failures
  - Code coverage inline

**Screenshots of what you'll see:**

```
┌─────────────────────────────────────────┐
│ Vitest UI                               │
├─────────────────────────────────────────┤
│ 📁 src/test/fixtures/__tests__/         │
│   ├─ ✅ timeline-generator.test.ts (19) │
│ 📁 src/components/FolderSelection/      │
│   └─ ✅ ExportVid.test.ts (15)          │
│ 📁 public/__tests__/                    │
│   └─ ✅ video-export-lib.test.js (27)   │
│                                          │
│ All Tests Passed: 61/61 ✓               │
└─────────────────────────────────────────┘
```

**When to use:**
- Exploring what tests exist
- Debugging test failures
- Showing tests to team members

---

### 4. **Coverage Report (HTML)** ⭐ For Analysis

```bash
npm run test:coverage
```

**What you get:**
- Generates `coverage/` directory
- Open `coverage/index.html` in browser
- See exactly which lines are tested:
  - Green = Covered by tests
  - Red = Not covered
  - Yellow = Partially covered

**Coverage breakdown:**
```
File                              | % Stmts | % Branch | % Funcs | % Lines
----------------------------------|---------|----------|---------|--------
ExportVid.tsx                     |   85.2  |   76.3   |   90.0  |   84.8
video-export-lib.mjs              |   100   |   100    |   100   |   100
timeline-generator.ts             |   100   |   100    |   100   |   100
```

**When to use:**
- Finding untested code
- Before major releases
- Code review

---

## Where Are the Test Files?

### Current Test Files (61 tests):

1. **`src/components/FolderSelection/__tests__/ExportVid.test.ts`** (15 tests)
   - Tests for `getAudio()` function
   - Kings/princes volume categorization
   - Speed calculations

2. **`src/test/fixtures/__tests__/timeline-generator.test.ts`** (19 tests)
   - Timeline generation
   - Pre-configured scenarios
   - Annotation table generation

3. **`public/__tests__/video-export-lib.test.js`** (27 tests)
   - FFmpeg tempo filter stacking
   - Filter complex generation
   - Clip validation
   - Duration calculations

### Old Test Files (Excluded):
These are skipped because they need migration from Jest to Vitest:
- `src/__tests__/App.test.tsx`
- `src/components/__tests__/deeJay.test.tsx`
- `src/components/__tests__/annotTable.test.tsx`
- `src/components/__tests__/fileList.test.tsx`
- `src/store/deeJay/__tests__/deeJayStore.test.tsx`

---

## Test File Structure

```
your-test-file.test.ts
├── import { describe, it, expect } from 'vitest'
├── describe('Feature Name')
│   ├── it('should do X when Y')
│   ├── it('should handle edge case Z')
│   └── it('should throw error for invalid input')
└── Results appear in all viewing modes above
```

---

## Quick Commands Reference

```bash
# Run once
npm run test:unit

# Watch mode (recommended for development)
npm run test:watch

# UI mode (recommended for exploration)
npm run test:ui

# Coverage report
npm run test:coverage

# Generate test fixtures
npm run generate:fixtures

# Helper script (interactive menu)
./scripts/view-tests.sh
```

---

## Tips

1. **Keep watch mode running** while coding
2. **Use UI mode** when debugging failures
3. **Check coverage** before creating PR
4. **Filter tests** to focus on what you're working on:
   ```bash
   npm run test:watch
   # Then press 'p' and type 'ExportVid' to only run those tests
   ```

---

## GitHub Actions (Automatic)

Every time you push code, tests run automatically:
- View results at: https://github.com/MattGyverLee/prestige/actions
- Green checkmark = all tests passed
- Red X = some tests failed

You'll see the same 61 tests run in CI that you see locally!
