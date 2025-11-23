# Prestige Migration Project Board

## Executive Summary

**Goal**: Migrate Prestige from class components to modern function components with hooks, while reorganizing to a feature-based directory structure

**Timeline**: 10 weeks (50-60 hours)
**Components to migrate**: 12 class components
**Custom hooks to create**: 15+
**Risk level**: Medium (Redux Toolkit already in place)

---

## Status Legend

- ⚪ **Not Started**: Task not yet begun
- 🔵 **In Progress**: Currently being worked on
- 🟢 **Complete**: Finished and verified
- 🔴 **Blocked**: Waiting on dependencies
- 🟡 **Review**: Ready for QA review

---

## Phase 0: Foundation Infrastructure (Week 1 - 5 hours)

### Cluster 0.1: Project Setup ⚪
**Story Points**: 2
**Dependencies**: None
**Status**: Not Started

**Tasks**:
- [x] Create feature-based directory structure
- [x] Update tsconfig.json with path aliases
- [ ] Create PROJECT_BOARD.md
- [ ] Create AGENT_STATUS.md
- [ ] Configure Vite for path aliases

**Deliverables**:
- Feature directory structure in place
- Path aliases configured
- Project tracking documents created

---

### Cluster 0.2: Shared Hooks Foundation ⚪
**Story Points**: 3
**Dependencies**: Cluster 0.1
**Status**: Not Started
**Agent**: Agent 0

**Hooks to Create**:
1. `useInterval` - Declarative interval management
2. `useDebounce` - Debounce values
3. `useLocalStorage` - localStorage persistence
4. `usePrevious` - Access previous value

**Deliverables**:
- 4 shared hooks implemented in `src/shared/hooks/`
- Each hook exported from `src/shared/hooks/index.ts`
- TypeScript types defined

---

### Cluster 0.3: Hook Unit Tests ⚪
**Story Points**: 2
**Dependencies**: Cluster 0.2
**Status**: Not Started
**Agent**: Agent 1

**Test Coverage**:
- `useInterval.test.ts` - Test interval setup/cleanup
- `useDebounce.test.ts` - Test debounce timing
- `useLocalStorage.test.ts` - Test storage persistence
- `usePrevious.test.ts` - Test previous value tracking

**Requirements**:
- Use `@testing-library/react-hooks`
- 100% coverage for each hook
- Test edge cases and cleanup

**Deliverables**:
- 4 test files with full coverage
- All tests passing

---

### Cluster 0.4: Tooling Configuration ⚪
**Story Points**: 1
**Dependencies**: Cluster 0.2
**Status**: Not Started
**Agent**: Agent 2

**Tasks**:
- [ ] Update ESLint configuration for hooks
- [ ] Add hooks linting rules (rules-of-hooks, exhaustive-deps)
- [ ] Configure path aliases in ESLint
- [ ] Run baseline linting

**Deliverables**:
- ESLint configured for hooks
- No linting errors on new hooks

---

### Cluster 0.5: Documentation ⚪
**Story Points**: 2
**Dependencies**: Cluster 0.2
**Status**: Not Started
**Agent**: Agent 3

**Documents to Create**:
- `docs/HOOKS_CONVERSION_GUIDE.md` - Reference guide
- Include examples from actual Prestige components
- Document common patterns (state, lifecycle, refs, Redux)

**Deliverables**:
- Comprehensive conversion guide
- Pattern examples ready for team

---

## Phase 1: Simple Components (Week 2 - 4 hours)

### Cluster 1.1: VolumeButton Migration ⚪
**Story Points**: 1
**Dependencies**: Phase 0 complete
**Status**: Not Started
**Component**: `src/components/VolumeButton/VolumeButton.tsx` (40 lines)

**Complexity**: EASIEST - Start here
**State**: 1 variable (`muted`)
**Lifecycle**: None

**Migration Steps**:
1. Convert state to `useState`
2. Convert methods to functions
3. Remove `this` references
4. Move to `src/features/player/components/VolumeButton/`

**Testing Checklist**:
- [ ] Volume mute/unmute works
- [ ] Icon updates correctly

**Deliverables**:
- Function component in new location
- Old file removed
- Imports updated

---

### Cluster 1.2: VolumeBar Migration ⚪
**Story Points**: 2
**Dependencies**: Cluster 1.1
**Status**: Not Started
**Component**: `src/components/VolumeBar/VolumeBar.tsx` (60 lines)

**State**: 2 variables (`volume`, `isDragging`)
**Custom Hook**: Extract `useDraggable.ts`

**Migration Steps**:
1. Create `useDraggable` hook for reuse
2. Convert component to function
3. Move to `src/features/player/components/VolumeBar/`

**Testing Checklist**:
- [ ] Volume slider drag works
- [ ] Value updates correctly
- [ ] Mouse up/down handlers work

**Deliverables**:
- `useDraggable` hook created
- Function component migrated
- Manual testing complete

---

### Cluster 1.3: FileList Migration ⚪
**Story Points**: 1
**Dependencies**: None (parallel with 1.1)
**Status**: Not Started
**Component**: `src/components/FileList/*.tsx` (120 lines)

**Optimization**: Use `useMemo` for filtered list

**Migration Steps**:
1. Convert to function component
2. Add `useMemo` for file filtering
3. Move to `src/features/fileSystem/components/FileList/`

**Testing Checklist**:
- [ ] File list renders
- [ ] Filtering works

**Deliverables**:
- Function component with memoization
- Performance verified

---

### Cluster 1.4: Waveform Migration ⚪
**Story Points**: 3
**Dependencies**: None (parallel)
**Status**: Not Started
**Component**: `src/components/Waveform/*.tsx` (180 lines)

**Custom Hook**: Create `useWaveformRenderer.ts`
**Complexity**: WaveSurfer integration with refs

**Migration Steps**:
1. Create `useWaveformRenderer` hook
2. Convert WaveSurfer instance to `useRef`
3. Convert lifecycle to `useEffect`
4. Move to `src/features/annotations/components/Waveform/`

**Testing Checklist**:
- [ ] Waveform renders
- [ ] Audio loads correctly
- [ ] Cleanup on unmount

**Deliverables**:
- `useWaveformRenderer` hook
- Function component migrated
- No memory leaks

---

## Phase 2: Medium Components (Weeks 3-4 - 10 hours)

### Cluster 2.1: ControlRow Migration ⚪
**Story Points**: 3
**Dependencies**: Phase 1 complete
**Status**: Not Started
**Component**: `src/components/ControlRow/ControlRow.tsx` (250 lines)

**Custom Hook**: Create `usePlayerControls.ts`
**Redux**: Connected via hooks

**Migration Steps**:
1. Create `usePlayerControls` hook
2. Replace `connect()` with hooks
3. Convert methods to functions
4. Move to `src/features/player/components/ControlRow/`

**Testing Checklist**:
- [ ] Play/pause works
- [ ] Seek bar updates
- [ ] Speed control works
- [ ] Keyboard shortcuts work

**Deliverables**:
- `usePlayerControls` hook with tests
- Function component migrated

---

### Cluster 2.2: PlayerZone Migration ⚪
**Story Points**: 2
**Dependencies**: Cluster 2.1
**Status**: Not Started
**Component**: `src/components/PlayerZone/PlayerZone.tsx` (197 lines)

**Custom Hook**: Create `useReactPlayer.ts`

**Migration Steps**:
1. Create `useReactPlayer` hook
2. Convert component
3. Test video playback and seeking

**Testing Checklist**:
- [ ] Video playback works
- [ ] Seeking synchronization works

**Deliverables**:
- `useReactPlayer` hook
- Function component migrated

---

## Phase 3: Complex Components (Weeks 5-8 - 25 hours)

### Cluster 3.1: AnnotationTable Migration 🔴
**Story Points**: 6
**Dependencies**: Phase 2 complete
**Status**: Blocked
**Component**: `src/components/AnnotationTable/AnnotationTable.tsx` (563 lines)

**Complexity**: HIGH
**Custom Hook**: Create `useAnnotationTable.ts`
**Integration**: DevExtreme Grid, Redux

**Instance Variables**: 5
**Features**: Column config, row selection, cell editing

**Migration Steps**:
1. Create `useAnnotationTable` hook (Week 5)
2. Convert component to function
3. Extensive testing

**Testing Checklist**:
- [ ] Table renders all annotations
- [ ] Row selection works
- [ ] Cell editing works
- [ ] Column sorting works
- [ ] Filtering works
- [ ] Row click navigation works

**Deliverables**:
- `useAnnotationTable` hook with tests
- Function component migrated
- Full manual testing complete

---

### Cluster 3.2: DeeJay Migration 🔴
**Story Points**: 12
**Dependencies**: Phase 2 complete
**Status**: Blocked
**Component**: `src/components/DeeJay/DeeJay.tsx` (1806 lines) 🔥

**Complexity**: HIGHEST - Most complex component
**Time Allocation**: 2 full weeks (Weeks 6-7)

**Instance Variables**: 14
**WaveSurfer Instances**: 5 (high/low audio, video waveform)

**Custom Hooks to Create**:
1. `useWaveSurfer.ts` - WaveSurfer instance management
2. `useTimelineSync.ts` - Multi-timeline synchronization
3. `useMultiTrackPlayback.ts` - Multi-track audio control
4. `useZoomPan.ts` - Waveform zoom/pan controls
5. `useAudioPreview.ts` - FFmpeg audio preview

**Migration Strategy**:
- Week 6: Create all 5 hooks + tests
- Week 7: Migrate component using hooks
- Extensive testing of all scenarios

**Testing Checklist** (Critical!):
- [ ] Video waveform renders
- [ ] High audio waveform renders
- [ ] Low audio waveform renders
- [ ] Timeline sync works (all 3 waveforms)
- [ ] Multi-track playback works
- [ ] Volume controls work independently
- [ ] Speed control affects all tracks
- [ ] Zoom/pan works
- [ ] Audio preview generation works
- [ ] No memory leaks (DevTools check)

**Deliverables**:
- 5 custom hooks with full test coverage
- Function component migrated
- Performance benchmarked
- No regressions

---

### Cluster 3.3: SelectFolderZone Migration 🔴
**Story Points**: 7
**Dependencies**: Phase 2 complete
**Status**: Blocked
**Component**: `src/components/SelectFolderZone/SelectFolderZone.tsx` (1275 lines) 🔥

**Complexity**: VERY HIGH
**Time Allocation**: Week 8

**Instance Variables**: 11
**Features**: File watching, EAF parsing, FFmpeg merging, localStorage

**Custom Hooks to Create**:
1. `useFileWatcher.ts` - File system watching
2. `useEAFParser.ts` - EAF file parsing
3. `useAudioMerge.ts` - FFmpeg audio merging
4. `useLocalStateCache.ts` - Cached state management

**Migration Steps**:
1. Create all 4 hooks
2. Refactor component
3. Test complex workflows

**Testing Checklist**:
- [ ] Folder selection works
- [ ] File watcher detects changes
- [ ] EAF parsing works
- [ ] Audio merging works
- [ ] Progress updates during merge
- [ ] localStorage persistence works
- [ ] Error handling displays correctly

**Deliverables**:
- 4 custom hooks with tests
- Function component migrated
- All workflows tested

---

## Phase 4: Final Components & Integration (Weeks 9-10 - 10 hours)

### Cluster 4.1: Remaining Components ⚪
**Story Points**: 3
**Dependencies**: Phase 3 complete
**Status**: Not Started

**Components**:
- FolderSelection (simple, uses existing hooks)
- App component (Redux Provider, initialization)

**Deliverables**:
- All components migrated to functions
- Zero class components remaining

---

### Cluster 4.2: Integration Testing ⚪
**Story Points**: 3
**Dependencies**: Cluster 4.1
**Status**: Not Started

**Full Workflow Tests**:
1. Open folder → Parse EAF → Play video
2. Audio merging workflow
3. Annotation editing workflow
4. Export workflow (if time permits)

**Deliverables**:
- All workflows tested end-to-end
- No regressions found

---

### Cluster 4.3: Performance Optimization ⚪
**Story Points**: 2
**Dependencies**: Cluster 4.2
**Status**: Not Started

**Tasks**:
- [ ] React DevTools profiling
- [ ] Add `React.memo()` where needed
- [ ] Add `useMemo()` for expensive calculations
- [ ] Add `useCallback()` to prevent function recreation
- [ ] Optimize WaveSurfer rendering

**Target Metrics**:
- Initial render: < 1s
- Folder open: < 2s
- Video seek: < 100ms
- Waveform sync: < 50ms

**Deliverables**:
- Performance benchmarks met
- Optimization report

---

### Cluster 4.4: Documentation & Cleanup ⚪
**Story Points**: 2
**Dependencies**: Cluster 4.3
**Status**: Not Started

**Tasks**:
- [ ] Delete old component files
- [ ] Update README with new structure
- [ ] Document all custom hooks
- [ ] Update contributing guide
- [ ] Create PHASE_1_COMPLETE.md

**Deliverables**:
- All old files removed
- Documentation updated
- Phase completion documented

---

## Success Metrics

### Quantitative
- ✅ 0 class components
- ✅ 15+ custom hooks created
- ✅ 100% test coverage for hooks
- ✅ Bundle size < 5% increase
- ✅ Load time < 10% increase
- ✅ Zero console errors in production

### Qualitative
- ✅ Code is more readable
- ✅ Easier to add new features
- ✅ Better separation of concerns
- ✅ Reusable hooks across features
- ✅ Team velocity increases

---

## Migration Dependency Graph

```
Phase 0: Foundation (Week 1)
  │
  ├─ Cluster 0.1: Project Setup
  ├─ Cluster 0.2: Shared Hooks (Agent 0)
  ├─ Cluster 0.3: Unit Tests (Agent 1)
  ├─ Cluster 0.4: Tooling (Agent 2)
  └─ Cluster 0.5: Documentation (Agent 3)
  │
  ↓
Phase 1: Simple Components (Week 2)
  │
  ├─ Cluster 1.1: VolumeButton
  ├─ Cluster 1.2: VolumeBar
  ├─ Cluster 1.3: FileList
  └─ Cluster 1.4: Waveform
  │
  ↓
Phase 2: Medium Components (Weeks 3-4)
  │
  ├─ Cluster 2.1: ControlRow
  └─ Cluster 2.2: PlayerZone
  │
  ↓
Phase 3: Complex Components (Weeks 5-8)
  │
  ├─ Cluster 3.1: AnnotationTable (Week 5)
  ├─ Cluster 3.2: DeeJay (Weeks 6-7) 🔥
  └─ Cluster 3.3: SelectFolderZone (Week 8) 🔥
  │
  ↓
Phase 4: Integration & Polish (Weeks 9-10)
  │
  ├─ Cluster 4.1: Remaining Components
  ├─ Cluster 4.2: Integration Testing
  ├─ Cluster 4.3: Performance Optimization
  └─ Cluster 4.4: Documentation & Cleanup
```

---

## Critical Path

1. ✅ Foundation must complete first (enables all other work)
2. Simple components build confidence and establish patterns
3. Medium components create reusable player hooks
4. Complex components depend on all previous hooks
5. Integration validates entire migration

---

## Risk Mitigation

### High-Risk Areas

**DeeJay Component (Cluster 3.2)**:
- **Risk**: Most complex, many dependencies
- **Mitigation**: 2 full weeks, hooks-first approach, keep old until tested

**WaveSurfer Integration**:
- **Risk**: Lifecycle timing issues with refs
- **Mitigation**: Proper useEffect dependencies, cleanup functions, multi-browser testing

**Redux State Management**:
- **Risk**: Selector usage causing re-renders
- **Mitigation**: React DevTools Profiler, shallowEqual, memoized selectors

### Rollback Plan

- Keep old components until new ones validated
- Use feature branches for each phase
- Clean commits for easy reversion
