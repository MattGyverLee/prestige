# Testing Quick Start Guide

## What You Need to Know

### 1. **Your App Already Has Tests** ✅

**Current test coverage**:
- ✅ **Video Export Logic** - 48 tests ([public/__tests__/video-export-lib.test.js](public/__tests__/video-export-lib.test.js))
- ✅ **Timeline Generation** - 23 tests ([src/test/fixtures/__tests__/timeline-generator.test.ts](src/test/fixtures/__tests__/timeline-generator.test.ts))
- ✅ **Audio Extraction** - Tests in [src/components/FolderSelection/__tests__/ExportVid.test.ts](src/components/FolderSelection/__tests__/ExportVid.test.ts)

**Run existing tests**:
```bash
npm test              # Watch mode
npm run test:unit     # Single run
npm run test:coverage # With coverage
```

---

### 2. **Testing Philosophy: Black Box**

**Test OUTCOMES, not implementation:**

✅ **Good** - Tests behavior:
```typescript
it("should export video with correct clip count", () => {
  const result = await exportVideo(timeline, 1.0, [1, 0, 0]);
  expect(result).toBe(true);
  expect(mockAPI.exportVideo).toHaveBeenCalled();
});
```

❌ **Bad** - Tests internals:
```typescript
it("should call internal parseTimeline function", () => {
  const spy = vi.spyOn(utils, "parseTimeline");
  // Breaks when refactoring internals
});
```

---

### 3. **Critical DeeJay Playback Functions**

**What needs testing** (from [docs/DEEJAY_TESTING.md](docs/DEEJAY_TESTING.md)):

| Function | What It Does | Why It's Critical |
|----------|--------------|-------------------|
| **Timeline Loading** | Load EAF → Create timeline → Auto-play first clip | Entry point for all playback |
| **Region Clicking** | Click waveform region → Play from that position | Primary user interaction |
| **Waveform Seeking** | Drag cursor → Seek all active tracks to position | Navigation within audio |
| **Volume Control** | Click volume button → Cycle 100% → 50% → 0% | "Kings and Princes" mixing |
| **Multi-Track Sync** | Play video + annotation → Different speeds → Stay synced | Core feature |
| **PlayPause** | Press play/pause → All tracks start/stop together | Basic control |

**Key files**:
- [src/components/DeeJay/DeeJay.tsx](src/components/DeeJay/DeeJay.tsx) - Main playback controller (1,565 lines)
- [src/components/DeeJay/TimeFunctions.tsx](src/components/DeeJay/TimeFunctions.tsx) - Time calculations
- [src/components/DeeJay/RegionFunctions.tsx](src/components/DeeJay/RegionFunctions.tsx) - Region visualization
- [src/store/deeJay/](src/store/deeJay/) - Redux state management

---

### 4. **How to Test DeeJay Playback**

**Simple manual tests**:

1. **Timeline Loading**:
   - Open a folder with EAF file
   - ✅ Timeline appears
   - ✅ First clip auto-plays

2. **Region Clicking**:
   - Click a region on waveform
   - ✅ Audio plays from that region
   - ✅ Clicked track is soloed (louder)

3. **Seeking**:
   - Drag cursor on waveform
   - ✅ Position updates
   - ✅ All active tracks stay in sync

4. **Volume Control**:
   - Click volume button repeatedly
   - ✅ Cycles: Full → Background → Muted → Full

5. **Multi-Track Sync**:
   - Enable video audio (WS0) + annotation audio (WS1)
   - ✅ Both play at different speeds
   - ✅ Stay synchronized

**Automated tests** (when integration tests are working):
```bash
npm test -- deejay-playback
```

---

### 5. **Test Infrastructure Created**

**New test files** (may need TypeScript fixes):
- [src/test/integration/folder-loading.integration.test.ts](src/test/integration/folder-loading.integration.test.ts) - Folder workflow tests
- [src/test/integration/video-export.integration.test.ts](src/test/integration/video-export.integration.test.ts) - Export workflow tests
- [src/test/integration/file-watching.integration.test.ts](src/test/integration/file-watching.integration.test.ts) - File watching tests
- [src/test/integration/deejay-playback.integration.test.ts](src/test/integration/deejay-playback.integration.test.ts) - Playback tests

**Test fixtures**:
- [src/test/fixtures/timeline-generator.ts](src/test/fixtures/timeline-generator.ts) - Pre-built timeline scenarios
- [src/test/fixtures/eaf-samples.ts](src/test/fixtures/eaf-samples.ts) - Sample EAF XML files

**Enhanced mocks**:
- [src/test/setup.ts](src/test/setup.ts) - Global test setup with Electron API mocks

---

### 6. **Quick Testing Checklist**

When making changes, verify these still work:

**Folder Loading**:
- [ ] Select folder → Files appear
- [ ] EAF parsed → Timeline created
- [ ] Media categorized (source vs annotation)

**DeeJay Playback**:
- [ ] Timeline loads → Auto-play
- [ ] Click region → Play from position
- [ ] Drag waveform → Seek
- [ ] Volume button → Cycles states
- [ ] Multi-track → Stays synced

**Video Export**:
- [ ] Set volumes → Export → FFmpeg receives clips
- [ ] "Kings" (≥0.7) vs "Princes" (<0.7) logic
- [ ] Output file created

**File Watching**:
- [ ] Add file → Appears in UI
- [ ] Delete file → Removed from UI
- [ ] Change file → UI updates

---

### 7. **Next Steps**

**To make integration tests work**:
1. Fix TypeScript errors in integration test files
2. Add proper type definitions for Redux state
3. Adjust mocks to match actual API signatures

**Or, rely on existing tests**:
1. Current unit tests cover core logic (video export, timeline generation)
2. Manual testing covers user workflows
3. Integration tests are **aspirational** - templates for future work

---

### 8. **Documentation**

**Full guides**:
- **[TESTING.md](TESTING.md)** - Complete testing philosophy and strategy
- **[docs/DEEJAY_TESTING.md](docs/DEEJAY_TESTING.md)** - Detailed DeeJay playback testing guide

**Quick references**:
- Test fixtures: [src/test/fixtures/](src/test/fixtures/)
- Existing tests: [src/components/FolderSelection/__tests__/](src/components/FolderSelection/__tests__/)
- Mock setup: [src/test/setup.ts](src/test/setup.ts)

---

## Bottom Line

**What works now**:
- ✅ 70+ existing unit tests for core logic
- ✅ Test fixtures and mock infrastructure
- ✅ Clear testing documentation

**What's aspirational**:
- ⚠️ Integration tests (templates created, need TypeScript fixes)
- ⚠️ E2E tests (optional, for future)

**What you should do**:
1. **Run existing tests**: `npm run test:unit`
2. **Manually verify critical workflows** (see checklist above)
3. **Use test fixtures** when adding features
4. **Follow black-box philosophy**: Test outcomes, not implementation

**The testing foundation is solid** - you can refactor, modernize, and update the UI with confidence that the core functionality (video export, timeline generation) is covered by tests!
