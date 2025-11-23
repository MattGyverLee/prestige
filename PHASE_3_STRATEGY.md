# Phase 3 Strategy: Complex Components

**Status:** Ready to Execute
**Estimated Time:** 12-16 hours
**Risk Level:** High (largest components in the project)

---

## Overview

Phase 3 involves migrating the three most complex components in the Prestige application. Due to their size and complexity, a careful, methodical approach is required.

### Components Summary

| Component | Lines | Complexity | Hooks Needed | Priority |
|-----------|-------|------------|--------------|----------|
| AnnotationTable | 563 | HIGH | 1-2 | Start Here |
| DeeJay | 1,806 | VERY HIGH | 5+ | Primary Focus |
| SelectFolderZone | 1,275 | VERY HIGH | 4+ | Parallel |

**Total Code to Migrate:** ~3,644 lines
**Total Hooks to Create:** ~10-12 hooks

---

## Recommended Execution Strategy

### Option A: Sequential Approach (Safer)

**Week 1:** AnnotationTable
- Migrate AnnotationTable first (lowest risk)
- Test thoroughly
- Validate pattern works for complex components
- **Deliverable:** Working AnnotationTable + useAnnotationTable hook

**Week 2:** SelectFolderZone
- Tackle file system operations
- Create 4+ file system hooks
- Test file loading workflows
- **Deliverable:** Working SelectFolderZone + file system hooks

**Weeks 3-4:** DeeJay (Most Complex)
- Break into 5+ smaller hooks first
- Test each hook independently
- Migrate component using hooks
- Extensive integration testing
- **Deliverable:** Working DeeJay + all DeeJay hooks

### Option B: Parallel Approach (Faster, Higher Risk)

**Simultaneous Migration:**
- Agent 11: AnnotationTable
- Agent 12: DeeJay (with extra attention)
- Agent 14: SelectFolderZone
- Agent 13: DeeJay verification
- Agent 15: Overall verification

**Risk Mitigation:**
- DeeJay requires most careful attention
- More potential for conflicts
- Requires strong understanding of all three components

---

## Component-Specific Strategies

### AnnotationTable (563 lines)

**Current Architecture:**
- Class component with Redux connect()
- DevExtreme Grid integration
- Row selection, cell editing, sorting, filtering
- 5 instance variables

**Migration Strategy:**
1. Create `useAnnotationTable` hook
2. Extract grid state management
3. Convert event handlers to callbacks
4. Test CRUD operations thoroughly

**Custom Hook:**
```typescript
useAnnotationTable() => {
  annotations,
  columns,
  selection,
  handleSelectionChange,
  handleRowClick,
  handleCommitChanges
}
```

**Estimated Time:** 4-6 hours

**Files to Create:**
- `src/features/annotations/hooks/useAnnotationTable.ts`
- `src/features/annotations/components/AnnotationTable/AnnotationTable.tsx`
- `src/features/annotations/components/AnnotationTable/index.ts`

---

### DeeJay (1,806 lines) 🔥 PRIMARY COMPLEXITY

**Current Architecture:**
- Massive class component (1,806 lines)
- 14 instance variables
- 5 WaveSurfer instances (high/low audio, video waveform)
- Complex timeline synchronization
- Multi-track audio playback
- Custom zoom/pan controls
- FFmpeg audio preview generation

**Migration Strategy - CRITICAL:**

**Step 1: Create Hooks First (Week 1)**
Create and test each hook independently before touching the component:

1. **useWaveSurfer** (~150 lines)
   - WaveSurfer instance management
   - Container ref handling
   - Load/seek/play/pause methods
   - Event listener setup/cleanup

2. **useTimelineSync** (~100 lines)
   - Multi-timeline synchronization
   - Video time to waveform sync
   - Previous time tracking

3. **useMultiTrackPlayback** (~200 lines)
   - High/low audio track management
   - Volume control per track
   - Playback rate synchronization
   - Simultaneous play/pause

4. **useZoomPan** (~100 lines)
   - Zoom level state
   - Pan position state
   - Zoom in/out methods
   - Pan left/right methods

5. **useAudioPreview** (~150 lines)
   - FFmpeg preview generation
   - Progress tracking
   - URL management
   - Cleanup on unmount

**Step 2: Component Migration (Week 2)**
Refactor DeeJay to use the hooks:

```typescript
function DeeJay() {
  // Redux state
  const videoUrl = useSelector(...);
  const currentTime = useSelector(...);

  // Container refs
  const videoWaveRef = useRef(null);
  const highAudioRef = useRef(null);
  const lowAudioRef = useRef(null);

  // Custom hooks
  const videoWave = useWaveSurfer(videoWaveRef, {...});
  const { highWsRef, lowWsRef, play, pause } = useMultiTrackPlayback(...);

  useTimelineSync(currentTime, [
    videoWave.wavesurfer,
    highWsRef.current,
    lowWsRef.current,
  ]);

  const zoomControls = useZoomPan(videoWave.wavesurfer);
  const preview = useAudioPreview();

  // Component render...
}
```

**Estimated Time:** 10-12 hours total

**Files to Create:**
- `src/features/annotations/hooks/useWaveSurfer.ts`
- `src/features/annotations/hooks/useTimelineSync.ts`
- `src/features/annotations/hooks/useMultiTrackPlayback.ts`
- `src/features/annotations/hooks/useZoomPan.ts`
- `src/features/annotations/hooks/useAudioPreview.ts`
- `src/features/annotations/components/DeeJay/DeeJay.tsx`
- `src/features/annotations/components/DeeJay/index.ts`

**Critical Success Factors:**
1. Test each hook independently before integration
2. Keep old DeeJay component until fully verified
3. Manual testing of all workflows is essential
4. Memory leak prevention is critical (5 WaveSurfer instances)

---

### SelectFolderZone (1,275 lines) 🔥

**Current Architecture:**
- Large class component (1,275 lines)
- 11 instance variables
- File system watching
- EAF file parsing
- FFmpeg audio merging
- localStorage caching
- Complex async workflows

**Migration Strategy:**

**Custom Hooks to Create:**

1. **useFileWatcher** (~150 lines)
   - File system watcher setup
   - Event listener registration
   - File change detection
   - Cleanup on unmount

2. **useEAFParser** (~100 lines)
   - EAF file parsing logic
   - Annotation extraction
   - Media file extraction
   - Error handling

3. **useAudioMerge** (~150 lines)
   - FFmpeg integration
   - Progress tracking
   - Output file management
   - Error handling

4. **useLocalStateCache** (~80 lines)
   - localStorage integration
   - Cache management
   - Load/save operations

**Component Structure:**
```typescript
function SelectFolderZone() {
  const [selectedFolder, setSelectedFolder] = useState(null);

  const { files, isWatching } = useFileWatcher(selectedFolder);
  const { parseEAFFile, isParsing, error } = useEAFParser();
  const { mergeAudioFiles, isMerging, progress } = useAudioMerge();
  const { cachedValue, updateCache } = useLocalStateCache('lastFolder', null);

  // Component logic...
}
```

**Estimated Time:** 6-8 hours

**Files to Create:**
- `src/features/fileSystem/hooks/useFileWatcher.ts`
- `src/features/fileSystem/hooks/useEAFParser.ts`
- `src/features/fileSystem/hooks/useAudioMerge.ts`
- `src/features/fileSystem/hooks/useLocalStateCache.ts`
- `src/features/fileSystem/components/SelectFolderZone/SelectFolderZone.tsx`
- `src/features/fileSystem/components/SelectFolderZone/index.ts`

---

## Testing Strategy

### Per-Component Testing

**AnnotationTable:**
- [ ] Table renders with data
- [ ] Row selection works
- [ ] Cell editing works
- [ ] Sorting works
- [ ] Filtering works
- [ ] Redux state updates

**DeeJay (Critical):**
- [ ] All 5 WaveSurfer instances initialize
- [ ] Timeline synchronization works
- [ ] Multi-track playback synchronized
- [ ] Zoom/pan controls work
- [ ] Audio preview generation works
- [ ] No memory leaks (DevTools check)

**SelectFolderZone:**
- [ ] Folder selection works
- [ ] File watcher detects changes
- [ ] EAF parsing works
- [ ] Audio merging works
- [ ] Progress updates correctly
- [ ] localStorage persistence works

### Integration Testing

After all components migrated:
- [ ] Full workflow: Open folder → Parse EAF → Play video → Edit annotations
- [ ] DeeJay workflows: Create milestones, edit regions, export clips
- [ ] File system: Watch folders, parse files, merge audio

---

## Risk Mitigation

### High-Risk Areas

1. **DeeJay Complexity**
   - **Risk:** 1,806 lines, 5 WaveSurfer instances, complex state
   - **Mitigation:** Create hooks first, test independently, incremental migration

2. **Memory Leaks**
   - **Risk:** WaveSurfer instances not properly destroyed
   - **Mitigation:** useEffect cleanup functions, ref management, DevTools monitoring

3. **Redux State Synchronization**
   - **Risk:** Selector usage causing re-renders
   - **Mitigation:** Separate selectors, memoization, profiling

4. **File System Operations**
   - **Risk:** Async operations, error handling
   - **Mitigation:** Proper error boundaries, loading states, user feedback

### Rollback Plan

- Keep all old class components until fully tested
- Git commit per component for easy reversion
- Feature flags for optional toggling (if needed)

---

## Success Criteria

### Code Quality
- ✅ 0 ESLint errors
- ✅ 0 TypeScript errors
- ✅ All hooks follow React best practices
- ✅ Proper cleanup prevents memory leaks
- ✅ Comprehensive JSDoc documentation

### Functionality
- ✅ All existing features work identically
- ✅ No regressions in user workflows
- ✅ Performance same or better
- ✅ Redux state flow correct

### Testing
- ✅ Manual testing checklist 100% complete
- ✅ Integration testing passed
- ✅ Memory leak testing passed
- ✅ Performance profiling acceptable

---

## Deliverables

### Phase 3 Complete When:

1. **All Components Migrated:**
   - ✅ AnnotationTable → function component
   - ✅ DeeJay → function component
   - ✅ SelectFolderZone → function component

2. **All Hooks Created:**
   - ✅ useAnnotationTable
   - ✅ useWaveSurfer, useTimelineSync, useMultiTrackPlayback, useZoomPan, useAudioPreview
   - ✅ useFileWatcher, useEAFParser, useAudioMerge, useLocalStateCache

3. **Documentation:**
   - ✅ PHASE_3_COMPLETE.md created
   - ✅ AGENT_STATUS.md updated
   - ✅ All hooks documented

4. **Quality Gates:**
   - ✅ ESLint passing
   - ✅ TypeScript passing
   - ✅ Manual testing complete
   - ✅ Integration testing complete

---

## Recommendation

**For this session, I recommend:**

Given the scope and complexity, the most effective approach is to:

1. **Now:** Create comprehensive strategy document (this file) ✅
2. **Next:** Begin with AnnotationTable (lowest complexity)
3. **Then:** Tackle SelectFolderZone
4. **Finally:** DeeJay (most complex, requires most care)
5. **Verify:** Comprehensive testing and verification

This ensures:
- Build confidence with AnnotationTable success
- Validate patterns before tackling DeeJay
- Reduce risk of errors in most complex component
- Allow for thorough testing at each step

**Ready to proceed with Phase 3 execution?**
