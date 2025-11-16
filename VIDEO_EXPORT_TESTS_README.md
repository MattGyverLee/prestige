# Video Export Test Failures - Root Cause Analysis

## Problem
The video export integration tests are failing with `expected clips.length to be greater than 0`.

## Root Cause
The `exportVideo()` function returns an empty `clips` array because the test timelines don't contain the audio file data it needs.

### What ExportVid.tsx Expects

The export function looks for audio data in `milestone.data[]` with entries like:
```typescript
{
  channel: "CarefulMerged",  // or "TranslationMerged"
  file: "/path/to/audio.mp3",
  start: 0,
  stop: 2.5,
  // ... other properties
}
```

### What The Tests Provide

The failing tests use `testScenarios.simple()` which generates timelines with:
- `hasCareful: false`
- `hasTranslation: false`

This means `milestone.data` is an **empty array** - no audio files.

When there's no audio, the export function:
1. Can't find a "King" (primary) audio track
2. Returns `null` from `buildKing()`
3. Skips the milestone entirely
4. Results in empty `clips` array

## Solutions

### Option 1: Use Different Test Data (Easiest)
Change the tests to use `testScenarios.kingsAndPrinces()` which HAS audio:
```typescript
// Before:
const timeline = testScenarios.simple();

// After:
const { timeline, volumes } = testScenarios.kingsAndPrinces();
```

### Option 2: Fix Timeline Generator
Modify `testScenarios.simple()` to include at least video audio:
```typescript
simple: (): Timeline =>
  generateTestTimeline({
    numMilestones: 3,
    videoPath: "/test/fixtures/media/test-video-5s.mp4",
    audioPath: "/test/fixtures/media/test-audio-5s.wav",
    hasCareful: true,  // Changed from false
    hasTranslation: false,
    avgDuration: 1.5,
  }),
```

### Option 3: Test The Actual Behavior
Maybe the tests should verify that export handles NO audio gracefully:
```typescript
it("should handle timeline with no annotation audio", async () => {
  const timeline = testScenarios.simple(); // No audio
  const volumes = [1.0, 0, 0];

  const result = await exportVideo(timeline, 1.0, volumes);

  // Should either:
  // 1. Return false (export failed - no audio)
  // 2. Export video-only clips
  // 3. Show toast error
  expect(result).toBe(false); // or whatever the expected behavior is
});
```

## Affected Tests

1. `should export with multilingual audio (Kings and Princes)`
2. `should categorize King as volume >= 0.84`
3. `should categorize Prince as 0 < volume < 0.84`

## Recommendation

**Use Option 1** - Update the tests to use `testScenarios.kingsAndPrinces()` which is designed for testing multilingual export. The tests are TESTING multilingual audio, so they should USE timelines that HAVE multilingual audio!

```typescript
it("should export with multilingual audio (Kings and Princes)", async () => {
  // Use the scenario designed for this!
  const { timeline, volumes } = testScenarios.kingsAndPrinces();
  const multiplier = 1.2;

  const result = await exportVideo(timeline, multiplier, volumes);
  // ... rest of test
});
```
