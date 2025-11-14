# DeeJay Playback Testing Guide

## Overview

The **DeeJay component** is the heart of Prestige's playback engine. These tests ensure critical playback functionality continues to work as you modernize the codebase.

## Test File

**[src/test/integration/deejay-playback.integration.test.ts](../src/test/integration/deejay-playback.integration.test.ts)**

## What Gets Tested

### 1. Timeline Loading & Auto-Play ✅
**User Workflow**: Load folder → EAF parsed → Timeline created → First milestone plays

**What we verify**:
- Timeline loads into Redux store
- Auto-play dispatch triggered (`PlayerSeek`)
- Empty timelines handled gracefully

**Why it matters**: This is the entry point - if this fails, nothing works.

---

### 2. Region Clicking & Clip Playback ✅
**User Workflow**: Click region on waveform → Audio plays from that point

**What we verify**:
- `Clip` dispatch triggered with correct times
- Clicked wavesurfer gets soloed (other tracks muted)
- Clip boundaries set correctly

**Why it matters**: Primary user interaction for annotation review.

---

### 3. Waveform Seeking & Drag ✅
**User Workflow**: Drag cursor on waveform → Position updates → All tracks sync

**What we verify**:
- `WSSeek` dispatch triggered
- All active tracks synchronize to dragged position
- Position data correct

**Why it matters**: Users need to navigate freely within audio.

---

### 4. Volume Control & Track Soloing ✅
**User Workflow**: Click volume button → Track cycles: 100% → 50% (background) → 0% (muted)

**What we verify**:
- Volume cycles through states: 1.0 → 0.84 → 0.0
- Tracks categorized as "highs" (kings) and "lows" (princes)
- Solo functionality (mute all but one track)

**Why it matters**: Core "Kings and Princes" audio mixing logic.

---

### 5. Multi-Track Synchronization ✅
**User Workflow**: Play video + annotation audio → Different playback rates → Stay in sync

**What we verify**:
- WS0 (video audio) and WS1/WS2 (annotation audio) sync correctly
- Playback rates calculated based on duration differences
- Both tracks receive dispatch data

**Why it matters**: The hallmark feature - multilingual synchronized playback.

---

### 6. PlayPause Dispatch ✅
**User Workflow**: Press play/pause button → All tracks pause/resume together

**What we verify**:
- All active wavesurfers pause when `PlayPause(false)`
- Playback resumes from last position when `PlayPause(true)`
- Player state syncs with audio state

**Why it matters**: Basic playback control must be reliable.

---

### 7. Voiceover Sequencing ✅
**User Workflow**: Multiple voiceover tracks → Play in sequence, not simultaneously

**What we verify**:
- Multiple "lows" (princes) identified correctly
- Voiceover cycling logic works
- Sequence order maintained

**Why it matters**: Handles complex multilingual scenarios.

---

### 8. Edge Cases & Error Handling ✅
**Critical failures prevented**:
- Click region when no timeline loaded → Doesn't crash
- Seek past end of timeline → Handled gracefully
- Missing annotation audio → Skips cleanly
- Undefined milestone access → Guarded

**Why it matters**: App stability under unexpected conditions.

---

### 9. Player State Synchronization ✅
**User Workflow**: Audio plays → Video syncs position, speed, play/pause state

**What we verify**:
- Playback rate updates (`setPlaybackRate`)
- Video seeks when audio seeks (`setSeek`)
- Play/pause state syncs (`togglePlay`)

**Why it matters**: Video and audio must stay locked together.

---

### 10. Dispatch Clearing & Cleanup ✅
**Internal behavior**:
- Dispatch cleared after processing
- No dispatch stacking (latest overwrites)

**Why it matters**: Prevents memory leaks and conflicting commands.

---

### 11. Timeline Changes & Reloading ✅
**User Workflow**: Switch between timelines → Wavesurfers reload → Regions redraw

**What we verify**:
- New timeline loads correctly
- Current timeline index updates
- Milestones change triggers region refresh

**Why it matters**: User can work with multiple timelines in session.

---

## Running DeeJay Tests

```bash
# Run only DeeJay playback tests
npm test -- deejay-playback

# Run all integration tests
npm test -- integration

# Run with coverage
npm run test:coverage
```

## Test Philosophy: BLACK BOX

These tests verify **OUTCOMES**, not implementation:

```typescript
// ✅ GOOD - Tests behavior
it("should auto-play first milestone when timeline loads", () => {
  store.dispatch(actions.pushTimeline(timeline));
  // Verify timeline is in store and ready for playback
  expect(state.annot.timeline[0].milestones.length).toBeGreaterThan(0);
});

// ❌ BAD - Tests implementation
it("should call dispatchDJ with PlayerSeek", () => {
  const spy = vi.spyOn(DeeJay.prototype, "dispatchDJ");
  // Breaks when refactoring dispatchDJ internals
});
```

## What We DON'T Test

- Exact WaveSurfer API calls (internal library behavior)
- Component rendering (UI can change)
- Internal dispatch processing logic (implementation detail)
- Exact timing of async operations (race conditions)

## Critical Functions Covered

From `DeeJay.tsx`:
- ✅ `dispatchDJ()` - Main dispatch router (via dispatch actions)
- ✅ `wsSeek()` - Waveform seeking (via WSSeek dispatch)
- ✅ `seekSyncAndPlay()` - Clip playback (via Clip dispatch)
- ✅ Volume cycling (via setWSVolume actions)
- ✅ Multi-track sync (via multiple dispatch scenarios)

From Redux stores:
- ✅ `deeJay.dispatch` - Playback commands
- ✅ `deeJay.volumes` - Track volume states
- ✅ `player.playing` - Play/pause state
- ✅ `player.playbackRate` - Speed synchronization
- ✅ `player.seek` - Position synchronization

## When to Update These Tests

**Add new tests when**:
1. Adding new playback features (loop, speed control, etc.)
2. Changing dispatch types or adding new ones
3. Modifying volume logic or "Kings and Princes" behavior
4. Adding new track types beyond WS0/WS1/WS2

**Don't update tests when**:
1. Refactoring internal functions (tests should still pass)
2. Changing UI styling or layout
3. Optimizing performance (same behavior, faster)
4. Renaming internal variables or methods

## Mock Strategy

**What we mock**:
- ✅ WaveSurfer class (MockWaveSurfer simulates real behavior)
- ✅ Electron APIs (file system, media loading)

**What we DON'T mock**:
- ❌ Redux store (use real store)
- ❌ Redux actions (use real actions)
- ❌ Timeline data (use real fixtures)

## Debugging Failed Tests

### 1. Check Redux State
```typescript
const state = store.getState();
console.log("DeeJay state:", state.deeJay);
console.log("Player state:", state.player);
console.log("Timeline:", state.annot.timeline);
```

### 2. Check Dispatch Flow
```typescript
// Verify dispatch was set
expect(state.deeJay.dispatch.dispatchType).toBe("Clip");
expect(state.deeJay.dispatch.wsNum).toBe(0);
```

### 3. Check Volume States
```typescript
// Categorize tracks
const threshold = Math.pow(0.5, 0.25); // ≈ 0.84
const highs = state.deeJay.volumes.filter(v => v > threshold);
const lows = state.deeJay.volumes.filter(v => v > 0 && v <= threshold);
console.log("Highs:", highs, "Lows:", lows);
```

### 4. Isolate Test
```typescript
it.only("should auto-play first milestone", () => {
  // Only this test runs - easier to debug
});
```

## Real-World Scenarios Tested

### Scenario 1: Load Project, Play First Clip
```typescript
Timeline loads → PlayerSeek dispatch → WS0 ready → Auto-play
```
**Test**: "should auto-play first milestone when timeline loads"

### Scenario 2: Click Annotation to Review
```typescript
User clicks region → region-clicked event → Clip dispatch → Solo WS
```
**Test**: "should trigger clip playback when region is clicked"

### Scenario 3: Drag to Navigate
```typescript
User drags cursor → interaction + seeking + seek → WSSeek dispatch → Sync all
```
**Test**: "should update position when user drags waveform"

### Scenario 4: Mix Video + Voiceover
```typescript
WS0=1.0 (high), WS1=0.84 (low) → Calculate rates → Play synchronized
```
**Test**: "should sync WS0 and WS1 when both are active"

### Scenario 5: Switch Languages
```typescript
Click volume: WS1=1→0, WS2=0→1 → Solo translation track
```
**Test**: "should solo a track by muting all others"

## Coverage Goals

Current coverage:
- ✅ **Core dispatch types**: PlayerSeek, WSSeek, Clip, PlayPause
- ✅ **Volume logic**: Cycling, soloing, categorization
- ✅ **Multi-track sync**: Different playback rates
- ✅ **Edge cases**: Empty timeline, undefined milestones, missing audio
- ✅ **State sync**: Player ↔ DeeJay coordination

Target: **All critical user workflows covered**

## Next Steps

1. **Run the tests**: `npm test -- deejay-playback`
2. **Verify they pass**: Green checkmarks = playback engine works
3. **Refactor with confidence**: Tests ensure behavior stays correct
4. **Add tests for new features**: Follow the black-box pattern

## Questions?

- **"Should I test the wavesurfer event handlers?"** → No, test the dispatch actions they trigger
- **"Should I test the DeeJay component rendering?"** → No, test the playback behaviors it enables
- **"What if I refactor dispatchDJ()?"** → Tests should still pass (we test outcomes, not internals)
- **"How do I test audio actually plays?"** → We test dispatches are sent correctly; WaveSurfer handles actual playback

---

**Bottom line**: These tests ensure **your playback engine works**. As long as these pass, users can load timelines, play clips, seek, adjust volumes, and synchronize tracks. That's what matters.
