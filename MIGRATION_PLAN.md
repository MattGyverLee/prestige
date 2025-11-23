# Migration Plan: Class Components → Function Components + Feature-Based Structure

## Executive Summary

This document provides a detailed, phase-by-phase plan to migrate Prestige from class components to modern function components with hooks, while simultaneously reorganizing to a feature-based directory structure.

**Timeline**: 10 weeks (50-60 hours)
**Components to migrate**: 12 class components
**Custom hooks to create**: 15+
**Risk level**: Medium (Redux Toolkit already in place reduces risk)

---

## Migration Philosophy

### Core Principles

1. **Incremental Migration**: Migrate one component at a time, maintaining a working app at each step
2. **Test-First**: Write tests before refactoring (or at minimum, manual test checklists)
3. **Extract Hooks Early**: Create reusable hooks that can be shared across components
4. **Feature Isolation**: Group related code by feature, not by type
5. **Backwards Compatible**: Keep old structure until migration is complete

### Success Criteria

- ✅ Zero class components remaining
- ✅ All Redux connected via hooks (`useSelector`, `useDispatch`)
- ✅ Feature-based directory structure implemented
- ✅ All custom hooks tested and documented
- ✅ No regression in functionality
- ✅ Performance metrics unchanged or improved

---

## Phase 1: Preparation (Week 1 - 5 hours)

### Goals
- Set up feature-based directory structure
- Create shared hook utilities
- Update tooling and linting
- Document patterns

### Tasks

#### 1.1 Create Feature-Based Directory Structure

```bash
src/
├── features/
│   ├── player/              # Video/audio playback
│   │   ├── components/
│   │   │   ├── DeeJay/
│   │   │   ├── PlayerZone/
│   │   │   ├── ControlRow/
│   │   │   ├── VolumeBar/
│   │   │   └── VolumeButton/
│   │   ├── hooks/
│   │   │   ├── useWaveSurfer.ts
│   │   │   ├── useTimelineSync.ts
│   │   │   ├── useMultiTrackPlayback.ts
│   │   │   ├── usePlayerControls.ts
│   │   │   └── useReactPlayer.ts
│   │   ├── utils/
│   │   │   ├── audioEngine.ts
│   │   │   └── timelineCalculations.ts
│   │   └── index.ts         # Public API
│   │
│   ├── annotations/         # EAF parsing and annotation display
│   │   ├── components/
│   │   │   ├── AnnotationTable/
│   │   │   └── Waveform/
│   │   ├── hooks/
│   │   │   ├── useAnnotationTable.ts
│   │   │   ├── useEAFParser.ts
│   │   │   └── useWaveformRenderer.ts
│   │   ├── utils/
│   │   │   ├── eafParser.ts
│   │   │   └── annotationHelpers.ts
│   │   └── index.ts
│   │
│   ├── fileSystem/          # File/folder operations
│   │   ├── components/
│   │   │   ├── SelectFolderZone/
│   │   │   ├── FolderSelection/
│   │   │   └── FileList/
│   │   ├── hooks/
│   │   │   ├── useFileWatcher.ts
│   │   │   ├── useAudioMerge.ts
│   │   │   ├── useLocalStateCache.ts
│   │   │   └── useDirectorySelection.ts
│   │   ├── utils/
│   │   │   └── fileSystemHelpers.ts
│   │   └── index.ts
│   │
│   └── export/              # Video/audio export
│       ├── components/
│       │   └── ExportDialog/
│       ├── hooks/
│       │   ├── useFFmpeg.ts
│       │   └── useExportSession.ts
│       ├── utils/
│       │   ├── ffmpegBuilder.ts
│       │   └── exportHelpers.ts
│       └── index.ts
│
├── shared/                  # Shared across features
│   ├── hooks/
│   │   ├── useInterval.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── usePrevious.ts
│   ├── components/
│   │   ├── Button/
│   │   └── Modal/
│   └── utils/
│       └── common.ts
│
└── store/                   # Redux store (existing)
    ├── annot/
    ├── app/
    └── store.tsx
```

**Action Items:**
- [ ] Create base directory structure (no file moves yet)
- [ ] Create empty `index.ts` files with TODOs
- [ ] Update `tsconfig.json` with path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"],
      "@store/*": ["src/store/*"]
    }
  }
}
```

#### 1.2 Create Shared Hook Utilities

Create foundational hooks that will be used across the migration:

**File: `src/shared/hooks/useInterval.ts`**
```typescript
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

**File: `src/shared/hooks/useDebounce.ts`**
```typescript
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**File: `src/shared/hooks/useLocalStorage.ts`**
```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
```

**File: `src/shared/hooks/usePrevious.ts`**
```typescript
import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
```

**Action Items:**
- [ ] Create all 4 shared hooks
- [ ] Write unit tests for each hook
- [ ] Create `src/shared/hooks/index.ts` exporting all hooks

#### 1.3 Update ESLint Configuration

**File: `.eslintrc.json`** (add rules)
```json
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/prefer-stateless-function": "warn"
  },
  "settings": {
    "import/resolver": {
      "typescript": {
        "paths": "./tsconfig.json",
        "alwaysTryTypes": true
      }
    }
  }
}
```

**Action Items:**
- [ ] Add hooks linting rules
- [ ] Configure path aliases in ESLint
- [ ] Run `npm run lint` to establish baseline

#### 1.4 Document Conversion Patterns

Create a reference guide for common patterns:

**File: `docs/HOOKS_CONVERSION_GUIDE.md`**
```markdown
# Quick Reference: Class → Hooks Conversion

## State
**Before (Class):**
```typescript
this.state = { count: 0 };
this.setState({ count: 1 });
```

**After (Hooks):**
```typescript
const [count, setCount] = useState(0);
setCount(1);
```

## Lifecycle: componentDidMount
**Before:**
```typescript
componentDidMount() {
  this.fetchData();
}
```

**After:**
```typescript
useEffect(() => {
  fetchData();
}, []); // Empty deps = mount only
```

## Lifecycle: componentDidUpdate
**Before:**
```typescript
componentDidUpdate(prevProps) {
  if (prevProps.id !== this.props.id) {
    this.fetchData();
  }
}
```

**After:**
```typescript
useEffect(() => {
  fetchData();
}, [id]); // Runs when `id` changes
```

## Lifecycle: componentWillUnmount
**Before:**
```typescript
componentWillUnmount() {
  this.cleanup();
}
```

**After:**
```typescript
useEffect(() => {
  return () => cleanup(); // Cleanup function
}, []);
```

## Instance Variables (non-state)
**Before:**
```typescript
this.intervalId = setInterval(...);
```

**After:**
```typescript
const intervalRef = useRef<number>();
intervalRef.current = setInterval(...);
```

## Redux Connection
**Before:**
```typescript
const mapStateToProps = (state) => ({
  data: state.app.data
});
export default connect(mapStateToProps)(MyComponent);
```

**After:**
```typescript
const data = useSelector((state: RootState) => state.app.data);
```
```

**Action Items:**
- [ ] Create conversion guide document
- [ ] Add examples from actual Prestige components
- [ ] Share with team for review

---

## Phase 2: Simple Components (Week 2 - 4 hours)

### Goals
- Migrate 4 simple presentational components
- Establish conversion patterns
- Build confidence with low-risk changes

### Components to Migrate

#### 2.1 VolumeButton (Easiest - Start Here)

**Current:** [src/components/VolumeButton/VolumeButton.tsx](src/components/VolumeButton/VolumeButton.tsx) (40 lines)
- 1 state variable (`muted`)
- No lifecycle methods
- Simple event handlers

**Migration Steps:**
1. Read existing component
2. Convert state to `useState`
3. Convert methods to functions
4. Remove `this` references
5. Test volume toggle functionality

**Before:**
```typescript
class VolumeButton extends React.Component {
  state = { muted: false };

  handleToggle = () => {
    this.setState({ muted: !this.state.muted });
    this.props.onMuteChange(!this.state.muted);
  };

  render() {
    return <button onClick={this.handleToggle}>
      {this.state.muted ? '🔇' : '🔊'}
    </button>;
  }
}
```

**After:**
```typescript
function VolumeButton({ onMuteChange }: VolumeButtonProps) {
  const [muted, setMuted] = useState(false);

  const handleToggle = () => {
    setMuted(!muted);
    onMuteChange(!muted);
  };

  return (
    <button onClick={handleToggle}>
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
```

**New Location:** `src/features/player/components/VolumeButton/VolumeButton.tsx`

**Action Items:**
- [ ] Create new file in feature directory
- [ ] Migrate component
- [ ] Update imports in parent components
- [ ] Test manually (volume mute/unmute)
- [ ] Delete old file

#### 2.2 VolumeBar

**Current:** 60 lines, 2 state variables, drag handlers

**Migration Steps:**
1. Convert `volume` and `isDragging` to `useState`
2. Convert drag handlers to functions
3. Consider extracting `useDraggable` hook for reuse

**Custom Hook to Create:** `useDraggable.ts`
```typescript
export function useDraggable(onDrag: (value: number) => void) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const value = (e.clientX - rect.left) / rect.width;
    onDrag(Math.max(0, Math.min(1, value)));
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return { isDragging, handleMouseDown };
}
```

**New Location:** `src/features/player/components/VolumeBar/VolumeBar.tsx`

**Action Items:**
- [ ] Create `useDraggable` hook
- [ ] Migrate VolumeBar using the hook
- [ ] Test volume slider drag
- [ ] Update imports

#### 2.3 FileList

**Current:** 120 lines, simple list rendering, no complex state

**Migration Steps:**
1. Convert to function component
2. Use `useMemo` for filtered file list
3. Consider extracting `useFileFilter` hook

**Before:**
```typescript
class FileList extends React.Component {
  filterFiles() {
    return this.props.files.filter(f =>
      f.name.toLowerCase().includes(this.props.searchTerm.toLowerCase())
    );
  }

  render() {
    const filtered = this.filterFiles();
    return <ul>{filtered.map(f => <li key={f.id}>{f.name}</li>)}</ul>;
  }
}
```

**After:**
```typescript
function FileList({ files, searchTerm }: FileListProps) {
  const filteredFiles = useMemo(() =>
    files.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [files, searchTerm]
  );

  return (
    <ul>
      {filteredFiles.map(f => (
        <li key={f.id}>{f.name}</li>
      ))}
    </ul>
  );
}
```

**New Location:** `src/features/fileSystem/components/FileList/FileList.tsx`

**Action Items:**
- [ ] Migrate to function component
- [ ] Add `useMemo` for performance
- [ ] Test file filtering
- [ ] Update imports

#### 2.4 Waveform

**Current:** 180 lines, WaveSurfer integration, refs

**Migration Steps:**
1. Convert WaveSurfer instance to `useRef`
2. Convert lifecycle to `useEffect`
3. Consider extracting to `useWaveformRenderer` hook

**Custom Hook:** `useWaveformRenderer.ts`
```typescript
export function useWaveformRenderer(
  containerRef: RefObject<HTMLDivElement>,
  audioUrl: string,
  options: WaveSurferOptions
) {
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      ...options,
    });

    ws.load(audioUrl);
    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [audioUrl, options]);

  return wavesurferRef;
}
```

**New Location:** `src/features/annotations/components/Waveform/Waveform.tsx`

**Action Items:**
- [ ] Create `useWaveformRenderer` hook
- [ ] Migrate Waveform component
- [ ] Test waveform rendering
- [ ] Update imports

---

## Phase 3: Medium Components (Weeks 3-4 - 10 hours)

### Goals
- Migrate medium-complexity components
- Create player-related custom hooks
- Refine patterns based on Phase 2 learnings

### Components to Migrate

#### 3.1 ControlRow (Week 3 - 3 hours)

**Current:** [src/components/ControlRow/ControlRow.tsx](src/components/ControlRow/ControlRow.tsx) (250 lines)
- Redux connected (playback state)
- Multiple event handlers (play/pause, seek, speed)
- Some local state (UI toggles)

**Custom Hook to Create:** `usePlayerControls.ts`
```typescript
export function usePlayerControls() {
  const dispatch = useDispatch();
  const isPlaying = useSelector((state: RootState) => state.app.isPlaying);
  const currentTime = useSelector((state: RootState) => state.app.currentTime);
  const speed = useSelector((state: RootState) => state.app.playbackSpeed);

  const play = useCallback(() => {
    dispatch(setPlaying(true));
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch(setPlaying(false));
  }, [dispatch]);

  const seek = useCallback((time: number) => {
    dispatch(setCurrentTime(time));
  }, [dispatch]);

  const setSpeed = useCallback((speed: number) => {
    dispatch(setPlaybackSpeed(speed));
  }, [dispatch]);

  return {
    isPlaying,
    currentTime,
    speed,
    play,
    pause,
    seek,
    setSpeed,
  };
}
```

**Migration Steps:**
1. Create `usePlayerControls` hook
2. Convert component to function
3. Replace `connect()` with `usePlayerControls()`
4. Convert class methods to functions
5. Test all control buttons

**New Location:** `src/features/player/components/ControlRow/ControlRow.tsx`

**Action Items:**
- [ ] Create `usePlayerControls` hook
- [ ] Write hook unit tests
- [ ] Migrate ControlRow
- [ ] Manual testing checklist:
  - [ ] Play/pause works
  - [ ] Seek bar updates
  - [ ] Speed control works
  - [ ] Keyboard shortcuts work

#### 3.2 PlayerZone (Week 3 - 2 hours)

**Current:** [src/components/PlayerZone/PlayerZone.tsx](src/components/PlayerZone/PlayerZone.tsx) (197 lines)
- ReactPlayer integration
- Progress tracking
- Duration handling

**Custom Hook to Create:** `useReactPlayer.ts`
```typescript
export function useReactPlayer() {
  const playerRef = useRef<ReactPlayer>(null);
  const dispatch = useDispatch();

  const [duration, setDuration] = useState(0);
  const currentTime = useSelector((state: RootState) => state.app.currentTime);

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    dispatch(setCurrentTime(state.playedSeconds));
  }, [dispatch]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
    dispatch(setVideoDuration(duration));
  }, [dispatch]);

  const seekTo = useCallback((time: number) => {
    playerRef.current?.seekTo(time, 'seconds');
  }, []);

  return {
    playerRef,
    duration,
    currentTime,
    handleProgress,
    handleDuration,
    seekTo,
  };
}
```

**Migration Steps:**
1. Create `useReactPlayer` hook
2. Convert component
3. Test video playback and seeking

**New Location:** `src/features/player/components/PlayerZone/PlayerZone.tsx`

**Action Items:**
- [ ] Create `useReactPlayer` hook
- [ ] Migrate PlayerZone
- [ ] Test video playback
- [ ] Test seeking synchronization

---

## Phase 4: Complex Components (Weeks 5-8 - 25 hours)

### Goals
- Migrate the most complex components
- Extract multiple custom hooks per component
- Maintain all existing functionality

### 4.1 AnnotationTable (Week 5 - 6 hours)

**Current:** [src/components/AnnotationTable/AnnotationTable.tsx](src/components/AnnotationTable/AnnotationTable.tsx) (563 lines)

**Complexity:**
- 5 instance variables
- DevExtreme Grid integration
- Column configuration
- Row selection
- Cell editing
- Redux integration (annotations data)

**Custom Hook to Create:** `useAnnotationTable.ts`
```typescript
interface UseAnnotationTableOptions {
  onRowClick?: (row: Annotation) => void;
  onCellEdit?: (row: Annotation, field: string, value: any) => void;
}

export function useAnnotationTable(options: UseAnnotationTableOptions = {}) {
  const annotations = useSelector((state: RootState) => state.annot.annotations);
  const dispatch = useDispatch();

  const [selection, setSelection] = useState<number[]>([]);
  const [columns, setColumns] = useState<Column[]>([
    { name: 'startTime', title: 'Start' },
    { name: 'endTime', title: 'End' },
    { name: 'text', title: 'Text' },
    { name: 'translation', title: 'Translation' },
  ]);

  const handleSelectionChange = useCallback((newSelection: number[]) => {
    setSelection(newSelection);
  }, []);

  const handleRowClick = useCallback((row: Annotation) => {
    options.onRowClick?.(row);
  }, [options]);

  const handleCommitChanges = useCallback(({ changed }: ChangeSet) => {
    if (!changed) return;

    Object.keys(changed).forEach((rowId) => {
      const annotation = annotations[parseInt(rowId)];
      const changes = changed[rowId];

      dispatch(updateAnnotation({
        id: annotation.id,
        changes,
      }));

      options.onCellEdit?.(annotation, Object.keys(changes)[0], Object.values(changes)[0]);
    });
  }, [annotations, dispatch, options]);

  return {
    annotations,
    columns,
    selection,
    handleSelectionChange,
    handleRowClick,
    handleCommitChanges,
  };
}
```

**Migration Steps:**
1. Create `useAnnotationTable` hook
2. Convert component to function
3. Replace class state with hook state
4. Test table rendering, selection, editing

**New Location:** `src/features/annotations/components/AnnotationTable/AnnotationTable.tsx`

**Testing Checklist:**
- [ ] Table renders all annotations
- [ ] Row selection works
- [ ] Cell editing works
- [ ] Column sorting works
- [ ] Filtering works
- [ ] Row click navigation works

### 4.2 DeeJay (Weeks 6-7 - 12 hours)

**Current:** [src/components/DeeJay/DeeJay.tsx](src/components/DeeJay/DeeJay.tsx) (1806 lines) 🔥

**Complexity:** HIGHEST
- 14 instance variables
- 5 WaveSurfer instances (high/low audio, video waveform)
- Complex timeline synchronization
- Multi-track audio playback
- Custom zoom/pan controls
- FFmpeg audio preview

**Strategy:** Break into 5+ custom hooks

#### Hook 1: `useWaveSurfer.ts`
```typescript
export function useWaveSurfer(
  containerRef: RefObject<HTMLDivElement>,
  options: WaveSurferOptions
) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      ...options,
    });

    ws.on('ready', () => setIsReady(true));
    wsRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [containerRef, options]);

  const loadAudio = useCallback((url: string) => {
    wsRef.current?.load(url);
  }, []);

  const seekTo = useCallback((time: number) => {
    wsRef.current?.seekTo(time / (wsRef.current.getDuration() || 1));
  }, []);

  const play = useCallback(() => wsRef.current?.play(), []);
  const pause = useCallback(() => wsRef.current?.pause(), []);

  return {
    wavesurfer: wsRef.current,
    isReady,
    loadAudio,
    seekTo,
    play,
    pause,
  };
}
```

#### Hook 2: `useTimelineSync.ts`
```typescript
export function useTimelineSync(
  videoTime: number,
  wavesurfers: (WaveSurfer | null)[]
) {
  const prevTimeRef = usePrevious(videoTime);

  useEffect(() => {
    // Only sync if time actually changed
    if (prevTimeRef === videoTime) return;

    // Sync all WaveSurfer instances to video time
    wavesurfers.forEach(ws => {
      if (!ws) return;
      const duration = ws.getDuration();
      if (duration > 0) {
        ws.seekTo(videoTime / duration);
      }
    });
  }, [videoTime, wavesurfers, prevTimeRef]);
}
```

#### Hook 3: `useMultiTrackPlayback.ts`
```typescript
export function useMultiTrackPlayback(
  highAudioUrl: string | null,
  lowAudioUrl: string | null,
  options: PlaybackOptions
) {
  const highWsRef = useRef<WaveSurfer | null>(null);
  const lowWsRef = useRef<WaveSurfer | null>(null);

  const [highVolume, setHighVolume] = useState(options.highVolume ?? 1.0);
  const [lowVolume, setLowVolume] = useState(options.lowVolume ?? 0.5);
  const [speed, setSpeed] = useState(options.speed ?? 1.0);

  // Load high audio
  useEffect(() => {
    if (!highAudioUrl || !highWsRef.current) return;
    highWsRef.current.load(highAudioUrl);
  }, [highAudioUrl]);

  // Load low audio
  useEffect(() => {
    if (!lowAudioUrl || !lowWsRef.current) return;
    lowWsRef.current.load(lowAudioUrl);
  }, [lowAudioUrl]);

  // Sync volume
  useEffect(() => {
    highWsRef.current?.setVolume(highVolume);
  }, [highVolume]);

  useEffect(() => {
    lowWsRef.current?.setVolume(lowVolume);
  }, [lowVolume]);

  // Sync playback rate
  useEffect(() => {
    highWsRef.current?.setPlaybackRate(speed);
    lowWsRef.current?.setPlaybackRate(speed);
  }, [speed]);

  const play = useCallback(() => {
    highWsRef.current?.play();
    lowWsRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    highWsRef.current?.pause();
    lowWsRef.current?.pause();
  }, []);

  return {
    highWsRef,
    lowWsRef,
    highVolume,
    setHighVolume,
    lowVolume,
    setLowVolume,
    speed,
    setSpeed,
    play,
    pause,
  };
}
```

#### Hook 4: `useZoomPan.ts`
```typescript
export function useZoomPan(wavesurfer: WaveSurfer | null) {
  const [zoom, setZoom] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.zoom(zoom);
  }, [wavesurfer, zoom]);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 50, 500));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 50, 0));
  }, []);

  const panLeft = useCallback(() => {
    setScrollX(prev => Math.max(prev - 100, 0));
  }, []);

  const panRight = useCallback(() => {
    setScrollX(prev => prev + 100);
  }, []);

  return {
    zoom,
    scrollX,
    zoomIn,
    zoomOut,
    panLeft,
    panRight,
  };
}
```

#### Hook 5: `useAudioPreview.ts`
```typescript
export function useAudioPreview() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePreview = useCallback(async (
    segments: AudioSegment[],
    options: PreviewOptions
  ) => {
    setIsGenerating(true);
    try {
      // Generate preview using FFmpeg (or Web Audio API in PWA mode)
      const url = await mergeAudioSegments(segments, options);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return {
    previewUrl,
    isGenerating,
    generatePreview,
    clearPreview,
  };
}
```

**Migration Steps:**
1. Week 6: Create all 5 hooks + tests
2. Week 7: Migrate DeeJay component using the hooks
3. Extensive testing of all playback scenarios

**Refactored Component Structure:**
```typescript
function DeeJay() {
  // Redux state
  const videoUrl = useSelector((state: RootState) => state.app.videoUrl);
  const currentTime = useSelector((state: RootState) => state.app.currentTime);
  const isPlaying = useSelector((state: RootState) => state.app.isPlaying);
  const highAudioUrl = useSelector((state: RootState) => state.annot.highAudioUrl);
  const lowAudioUrl = useSelector((state: RootState) => state.annot.lowAudioUrl);

  // Refs for containers
  const videoWaveRef = useRef<HTMLDivElement>(null);
  const highAudioRef = useRef<HTMLDivElement>(null);
  const lowAudioRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const videoWave = useWaveSurfer(videoWaveRef, { waveColor: 'blue' });
  const { highWsRef, lowWsRef, play, pause, ...playbackControls } = useMultiTrackPlayback(
    highAudioUrl,
    lowAudioUrl,
    { highVolume: 1.0, lowVolume: 0.5 }
  );

  useTimelineSync(currentTime, [
    videoWave.wavesurfer,
    highWsRef.current,
    lowWsRef.current,
  ]);

  const zoomControls = useZoomPan(videoWave.wavesurfer);
  const preview = useAudioPreview();

  // Sync playback state with Redux
  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  return (
    <div className="deejay">
      <div ref={videoWaveRef} />
      <div ref={highAudioRef} />
      <div ref={lowAudioRef} />

      <ZoomControls {...zoomControls} />
      <PlaybackControls {...playbackControls} />
      {preview.isGenerating && <LoadingSpinner />}
    </div>
  );
}
```

**New Location:** `src/features/player/components/DeeJay/DeeJay.tsx`

**Testing Checklist (Critical!):**
- [ ] Video waveform renders
- [ ] High audio waveform renders
- [ ] Low audio waveform renders
- [ ] Timeline sync works (all 3 waveforms)
- [ ] Multi-track playback works
- [ ] Volume controls work independently
- [ ] Speed control affects all tracks
- [ ] Zoom/pan works
- [ ] Audio preview generation works
- [ ] No memory leaks (check DevTools)

### 4.3 SelectFolderZone (Week 8 - 7 hours)

**Current:** [src/components/SelectFolderZone/SelectFolderZone.tsx](src/components/SelectFolderZone/SelectFolderZone.tsx) (1275 lines) 🔥

**Complexity:** VERY HIGH
- 11 instance variables
- File system watching
- EAF parsing
- FFmpeg audio merging
- localStorage caching
- Complex async workflows

**Strategy:** Break into 4 custom hooks

#### Hook 1: `useFileWatcher.ts`
```typescript
export function useFileWatcher(folderPath: string | null) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isWatching, setIsWatching] = useState(false);
  const watcherIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!folderPath) return;

    const startWatching = async () => {
      try {
        const watcherId = await api.startWatcher(folderPath, {
          recursive: true,
          ignored: /(^|[\/\\])\../, // Ignore hidden files
        });

        watcherIdRef.current = watcherId;
        setIsWatching(true);

        // Initial scan
        const initialFiles = await api.readDirectory(folderPath);
        setFiles(initialFiles);
      } catch (error) {
        console.error('File watcher error:', error);
      }
    };

    startWatching();

    return () => {
      if (watcherIdRef.current) {
        api.stopWatcher(watcherIdRef.current);
      }
    };
  }, [folderPath]);

  // Listen for file system events
  useEffect(() => {
    const handleFileChange = (event: FileSystemEvent) => {
      if (event.path.startsWith(folderPath || '')) {
        // Refresh files
        api.readDirectory(folderPath!).then(setFiles);
      }
    };

    api.onFileSystemEvent(handleFileChange);

    return () => {
      api.removeFileSystemEventListener();
    };
  }, [folderPath]);

  return {
    files,
    isWatching,
  };
}
```

#### Hook 2: `useEAFParser.ts`
```typescript
export function useEAFParser() {
  const dispatch = useDispatch();
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseEAFFile = useCallback(async (filePath: string) => {
    setIsParsing(true);
    setError(null);

    try {
      const eafData = await api.parseEAF(filePath);

      // Extract annotations
      const annotations = extractAnnotations(eafData);
      dispatch(setAnnotations(annotations));

      // Extract media links
      const mediaFiles = extractMediaFiles(eafData);
      dispatch(setMediaFiles(mediaFiles));

      return { annotations, mediaFiles };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, [dispatch]);

  return {
    parseEAFFile,
    isParsing,
    error,
  };
}
```

#### Hook 3: `useAudioMerge.ts`
```typescript
export function useAudioMerge() {
  const [isMerging, setIsMerging] = useState(false);
  const [progress, setProgress] = useState(0);

  const mergeAudioFiles = useCallback(async (
    segments: string[],
    outputPath: string,
    options: MergeOptions = {}
  ) => {
    setIsMerging(true);
    setProgress(0);

    try {
      // Listen to FFmpeg progress
      const progressHandler = (data: { percent: number }) => {
        setProgress(data.percent);
      };

      api.onFFmpegProgress(progressHandler);

      const result = await api.mergeAudioFiles(segments, outputPath, options);

      api.removeFFmpegProgressListener();
      setProgress(100);

      return result;
    } catch (error) {
      console.error('Audio merge failed:', error);
      throw error;
    } finally {
      setIsMerging(false);
    }
  }, []);

  return {
    mergeAudioFiles,
    isMerging,
    progress,
  };
}
```

#### Hook 4: `useLocalStateCache.ts`
```typescript
export function useLocalStateCache<T>(key: string, initialValue: T) {
  const [cachedValue, setCachedValue] = useLocalStorage(key, initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark as loaded after first render
    setIsLoaded(true);
  }, []);

  const updateCache = useCallback((value: T) => {
    setCachedValue(value);
  }, [setCachedValue]);

  const clearCache = useCallback(() => {
    setCachedValue(initialValue);
  }, [setCachedValue, initialValue]);

  return {
    cachedValue,
    isLoaded,
    updateCache,
    clearCache,
  };
}
```

**Refactored Component:**
```typescript
function SelectFolderZone() {
  const dispatch = useDispatch();

  // Local state
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Custom hooks
  const { files, isWatching } = useFileWatcher(selectedFolder);
  const { parseEAFFile, isParsing, error: parseError } = useEAFParser();
  const { mergeAudioFiles, isMerging, progress } = useAudioMerge();
  const { cachedValue: lastFolder, updateCache } = useLocalStateCache(
    'lastOpenedFolder',
    null
  );

  // Handle folder selection
  const handleSelectFolder = useCallback(async () => {
    const folder = await api.selectDirectory();
    if (folder) {
      setSelectedFolder(folder);
      updateCache(folder);

      // Find and parse EAF file
      const eafFile = files.find(f => f.name.endsWith('.eaf'));
      if (eafFile) {
        await parseEAFFile(eafFile.path);
      }
    }
  }, [files, parseEAFFile, updateCache]);

  // Auto-merge audio on folder change
  useEffect(() => {
    if (!selectedFolder) return;

    const annotationsFolder = files.find(f =>
      f.name.includes('_Annotations') && f.isDirectory
    );

    if (annotationsFolder) {
      // Check if merged files exist, if not, create them
      const carefulSegments = files.filter(f =>
        f.path.includes(annotationsFolder.name) && f.name.includes('Careful.wav')
      );

      if (carefulSegments.length > 0) {
        const outputPath = `${annotationsFolder.path}/Careful_Merged.mp3`;
        mergeAudioFiles(
          carefulSegments.map(s => s.path),
          outputPath
        );
      }
    }
  }, [selectedFolder, files, mergeAudioFiles]);

  return (
    <div className="select-folder-zone">
      <button onClick={handleSelectFolder}>Select Folder</button>

      {isWatching && <div>Watching folder: {selectedFolder}</div>}
      {isParsing && <div>Parsing EAF file...</div>}
      {isMerging && <div>Merging audio: {progress}%</div>}
      {parseError && <div className="error">{parseError}</div>}

      <FileList files={files} />
    </div>
  );
}
```

**New Location:** `src/features/fileSystem/components/SelectFolderZone/SelectFolderZone.tsx`

**Testing Checklist:**
- [ ] Folder selection works
- [ ] File watcher detects changes
- [ ] EAF parsing works
- [ ] Audio merging works
- [ ] Progress updates during merge
- [ ] localStorage persistence works
- [ ] Error handling displays correctly

---

## Phase 5: Final Components & Integration (Weeks 9-10 - 10 hours)

### Goals
- Migrate remaining components
- Final integration testing
- Performance optimization
- Documentation

### 5.1 FolderSelection (Week 9 - 3 hours)

**Current:** Simple component, mostly UI

**Migration Steps:**
1. Convert to function component
2. Use existing `useDirectorySelection` hook from SelectFolderZone
3. Test folder picker dialog

**New Location:** `src/features/fileSystem/components/FolderSelection/FolderSelection.tsx`

### 5.2 App Component (Week 9 - 2 hours)

**Current:** [src/App.tsx](src/App.tsx)

**Migration Steps:**
1. Convert to function component
2. Keep Redux Provider in index.tsx
3. Use `useEffect` for initialization
4. Test app-wide state management

### 5.3 Integration Testing (Week 10 - 3 hours)

**Full Workflow Tests:**
1. **Open folder → Parse EAF → Play video**
   - Select folder
   - Verify EAF parsing
   - Play video with synchronized audio
   - Check all waveforms sync

2. **Audio merging workflow**
   - Select folder with segments
   - Wait for auto-merge
   - Verify merged files created
   - Play merged audio

3. **Annotation editing**
   - Open annotation table
   - Edit annotation text
   - Verify Redux state updates
   - Verify changes persist

4. **Export workflow** (if time permits)
   - Configure export settings
   - Start export
   - Monitor progress
   - Verify output file

### 5.4 Performance Optimization (Week 10 - 2 hours)

**Profiling:**
1. Use React DevTools Profiler
2. Identify expensive re-renders
3. Add `React.memo()` where needed
4. Add `useMemo()` for expensive calculations
5. Add `useCallback()` to prevent recreating functions

**Target Metrics:**
- Initial render: < 1s
- Folder open: < 2s
- Video seek: < 100ms
- Waveform sync: < 50ms

**Optimization Checklist:**
- [ ] Memo-ize heavy list components
- [ ] Debounce slider inputs
- [ ] Lazy load annotation table rows
- [ ] Virtualize long file lists
- [ ] Optimize WaveSurfer rendering

---

## Migration Dependency Graph

```
Legend: A → B means "B depends on A, migrate A first"

Shared Hooks (Week 1)
  ↓
VolumeButton, VolumeBar, FileList, Waveform (Week 2)
  ↓
ControlRow, PlayerZone (Week 3-4)
  ↓
AnnotationTable (Week 5)
  ↓
DeeJay (Week 6-7)
  ↓
SelectFolderZone (Week 8)
  ↓
FolderSelection, App (Week 9)
  ↓
Integration Testing & Optimization (Week 10)
```

**Critical Path:**
1. Shared hooks must be created first
2. Simple components build confidence
3. Custom hooks extracted during medium component migration
4. Complex components use hooks created in previous phases
5. Integration testing validates entire migration

---

## Testing Strategy

### Unit Tests (Per Hook)

Each custom hook should have unit tests using `@testing-library/react-hooks`:

```typescript
// Example: usePlayerControls.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { usePlayerControls } from './usePlayerControls';

describe('usePlayerControls', () => {
  it('should play and pause', () => {
    const { result } = renderHook(() => usePlayerControls());

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should seek to time', () => {
    const { result } = renderHook(() => usePlayerControls());

    act(() => {
      result.current.seek(30);
    });

    expect(result.current.currentTime).toBe(30);
  });
});
```

### Component Tests

Use `@testing-library/react` for component testing:

```typescript
// Example: VolumeButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VolumeButton } from './VolumeButton';

describe('VolumeButton', () => {
  it('should toggle mute state', () => {
    const onMuteChange = jest.fn();
    render(<VolumeButton onMuteChange={onMuteChange} />);

    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(onMuteChange).toHaveBeenCalledWith(true);

    fireEvent.click(button);
    expect(onMuteChange).toHaveBeenCalledWith(false);
  });
});
```

### Integration Tests

Test feature workflows end-to-end:

```typescript
// Example: player.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './store';

describe('Player Integration', () => {
  it('should play video and sync timeline', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Open folder
    const selectButton = screen.getByText('Select Folder');
    await userEvent.click(selectButton);

    // Wait for video to load
    await waitFor(() => {
      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    // Play video
    const playButton = screen.getByLabelText('Play');
    await userEvent.click(playButton);

    // Verify timeline updates
    await waitFor(() => {
      const timeline = screen.getByTestId('timeline');
      expect(timeline).toHaveAttribute('aria-valuenow', expect.not.toBe('0'));
    });
  });
});
```

### Manual Testing Checklist

Before merging each phase:

#### Phase 2 Checklist
- [ ] Volume button toggles mute
- [ ] Volume slider adjusts volume
- [ ] File list displays and filters
- [ ] Waveform renders correctly

#### Phase 3 Checklist
- [ ] Play/pause works
- [ ] Seek bar updates
- [ ] Speed control works
- [ ] Video playback smooth

#### Phase 4 Checklist
- [ ] Annotation table renders
- [ ] Row selection works
- [ ] Cell editing works
- [ ] All waveforms sync
- [ ] Multi-track playback works
- [ ] Zoom/pan works
- [ ] File watcher works
- [ ] EAF parsing works
- [ ] Audio merging works

#### Phase 5 Checklist
- [ ] Full workflow: open → parse → play
- [ ] Export workflow (if implemented)
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance acceptable

---

## Risk Mitigation

### High-Risk Areas

1. **DeeJay Component (Week 6-7)**
   - **Risk**: Most complex component, many dependencies
   - **Mitigation**:
     - Allocate 2 full weeks
     - Create hooks first, test independently
     - Incremental migration (one hook at a time)
     - Keep old component until fully tested

2. **WaveSurfer Integration**
   - **Risk**: Lifecycle timing issues with refs
   - **Mitigation**:
     - Use `useEffect` with proper dependencies
     - Test on multiple browsers
     - Add cleanup functions

3. **Redux State Management**
   - **Risk**: Incorrect selector usage causing re-renders
   - **Mitigation**:
     - Use React DevTools Profiler
     - Add `shallowEqual` where needed
     - Memoize selectors with `createSelector`

### Rollback Plan

If a migration phase fails:
1. **Keep old code**: Don't delete old components until new ones are tested
2. **Git branches**: Use feature branches for each phase
3. **Feature flags**: Optionally toggle between old/new components
4. **Revert commits**: Each phase should be a clean commit

Example rollback:
```bash
# Revert Phase 4 if DeeJay migration fails
git revert <commit-hash>
git push

# Or use feature flag
const USE_NEW_DEEJAY = false;
{USE_NEW_DEEJAY ? <DeeJayNew /> : <DeeJayOld />}
```

---

## Post-Migration Cleanup

After all components migrated:

### 1. Delete Old Files
```bash
# Remove old component structure
rm -rf src/components/

# Verify no imports remain
grep -r "from.*components/" src/
```

### 2. Update Documentation
- [ ] Update README with new structure
- [ ] Document all custom hooks
- [ ] Update contributing guide
- [ ] Add architecture diagrams

### 3. Performance Baseline
- [ ] Run Lighthouse audit
- [ ] Measure bundle size
- [ ] Measure load time
- [ ] Compare to pre-migration metrics

### 4. Code Quality
- [ ] Run full linting
- [ ] Fix all warnings
- [ ] Update TypeScript types
- [ ] Remove unused imports

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

## Appendix A: Hook Catalog

All custom hooks created during migration:

### Shared Hooks
1. `useInterval` - Declarative intervals
2. `useDebounce` - Debounce values
3. `useLocalStorage` - localStorage persistence
4. `usePrevious` - Access previous value

### Player Hooks
5. `useWaveSurfer` - WaveSurfer instance management
6. `useTimelineSync` - Sync multiple timelines
7. `useMultiTrackPlayback` - Multi-track audio control
8. `useZoomPan` - Waveform zoom/pan
9. `useAudioPreview` - Audio preview generation
10. `usePlayerControls` - Playback controls
11. `useReactPlayer` - ReactPlayer integration

### Annotation Hooks
12. `useAnnotationTable` - Table state management
13. `useEAFParser` - EAF file parsing
14. `useWaveformRenderer` - Waveform rendering

### File System Hooks
15. `useFileWatcher` - File system watching
16. `useAudioMerge` - FFmpeg audio merging
17. `useLocalStateCache` - Cached state management
18. `useDirectorySelection` - Directory picker
19. `useDraggable` - Drag interaction

---

## Appendix B: Resources

### Official Documentation
- [React Hooks](https://react.dev/reference/react)
- [Redux Toolkit + Hooks](https://redux-toolkit.js.org/tutorials/quick-start#use-typed-hooks-in-components)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### Conversion Guides
- [From Classes to Hooks](https://react.dev/reference/react/Component#alternatives)
- [Hooks FAQ](https://react.dev/reference/react/hooks#state-hooks)

### Tools
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Why Did You Render](https://github.com/welldone-software/why-did-you-render)

---

## Conclusion

This migration plan provides a structured, low-risk approach to modernizing Prestige's codebase. By breaking the work into 5 phases over 10 weeks, we can incrementally migrate components while maintaining a working application throughout.

**Key Takeaways:**
- Start with simple components to build confidence
- Extract reusable hooks early
- Test thoroughly at each phase
- Keep old code until new code is validated
- Measure success with concrete metrics

**Next Steps:**
1. Review this plan with the team
2. Get approval for timeline and resource allocation
3. Begin Phase 1: Preparation
4. Schedule weekly check-ins to track progress

Good luck with the migration! 🚀
