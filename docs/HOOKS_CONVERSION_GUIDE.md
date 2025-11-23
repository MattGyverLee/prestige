# Hooks Conversion Guide

## Overview
This guide provides practical examples for converting Prestige's class components to function components with hooks. Use this as a quick reference when migrating components.

---

## Table of Contents
1. [State Conversion](#1-state-conversion)
2. [Lifecycle Methods](#2-lifecycle-methods)
3. [Instance Variables](#3-instance-variables)
4. [Redux Connection](#4-redux-connection)
5. [Common Patterns](#5-common-patterns)
6. [Prestige Custom Hooks](#6-prestige-custom-hooks)
7. [Quick Reference Table](#7-quick-reference-table)
8. [Common Gotchas](#8-common-gotchas)

---

## 1. State Conversion

### Basic State

**Before (Class):**
```typescript
class DeeJay extends Component<DeeJayProps> {
  state = {
    count: 0,
    isPlaying: false
  };

  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };
}
```

**After (Hooks):**
```typescript
function DeeJay(props: DeeJayProps) {
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = () => {
    setCount(count + 1);
  };
}
```

### Multiple State Updates

**Before (Class):**
```typescript
this.setState({
  count: this.state.count + 1,
  timestamp: Date.now()
});
```

**After (Hooks):**
```typescript
// Option 1: Separate setState calls (batched automatically)
setCount(count + 1);
setTimestamp(Date.now());

// Option 2: Use object state if values are related
const [state, setState] = useState({ count: 0, timestamp: 0 });
setState({ ...state, count: state.count + 1, timestamp: Date.now() });
```

### Functional State Updates

**Before (Class):**
```typescript
this.setState(prevState => ({
  count: prevState.count + 1
}));
```

**After (Hooks):**
```typescript
setCount(prevCount => prevCount + 1);
```

---

## 2. Lifecycle Methods

### componentDidMount

**Before (Class):**
```typescript
class DeeJay extends Component {
  componentDidMount() {
    this.createWaveSurfer(0);
    this.fetchData();
  }
}
```

**After (Hooks):**
```typescript
function DeeJay() {
  useEffect(() => {
    createWaveSurfer(0);
    fetchData();
  }, []); // Empty deps = runs once on mount
}
```

**Real Prestige Example (ResizableDiv):**
```typescript
// This effect runs on mount and whenever dependencies change
useEffect(() => {
  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);

  if (
    dimensions[className] &&
    (dimensions[className].width !== roundedWidth ||
      dimensions[className].height !== roundedHeight)
  ) {
    updateDimensions({
      width: roundedWidth,
      height: roundedHeight,
      target: className,
    });
  }
}, [width, height, dimensions, className, updateDimensions]);
```

### componentDidUpdate

**Before (Class):**
```typescript
componentDidUpdate(prevProps: DeeJayProps) {
  if (prevProps.url !== this.props.url) {
    this.handleUrlChanged();
  }

  if (prevProps.currentTimeline !== this.props.currentTimeline) {
    this.redrawRegions();
  }
}
```

**After (Hooks):**
```typescript
// Option 1: Separate effects for each concern
useEffect(() => {
  handleUrlChanged();
}, [url]); // Runs when url changes

useEffect(() => {
  redrawRegions();
}, [currentTimeline]); // Runs when currentTimeline changes

// Option 2: Combined effect with conditional logic
useEffect(() => {
  if (url !== prevUrl) {
    handleUrlChanged();
  }
  if (currentTimeline !== prevCurrentTimeline) {
    redrawRegions();
  }
}, [url, currentTimeline]);
```

### componentWillUnmount

**Before (Class):**
```typescript
componentWillUnmount() {
  this.waveSurfers.forEach(ws => ws.destroy());
  clearInterval(this.intervalId);
}
```

**After (Hooks):**
```typescript
useEffect(() => {
  // Setup code here (optional)

  return () => {
    // Cleanup function - runs on unmount
    waveSurfers.forEach(ws => ws.destroy());
    clearInterval(intervalId);
  };
}, []);
```

### Combined Lifecycle Example

**Before (Class):**
```typescript
class DeeJay extends Component {
  componentDidMount() {
    this.subscribe();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.unsubscribe();
      this.subscribe();
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }
}
```

**After (Hooks):**
```typescript
function DeeJay({ id }) {
  useEffect(() => {
    subscribe();

    return () => unsubscribe(); // Cleanup runs before re-running AND on unmount
  }, [id]); // Re-runs when id changes
}
```

---

## 3. Instance Variables

Instance variables are values that persist across renders but **don't trigger re-renders** when changed. Use `useRef` for these.

### Non-State Persistent Values

**Before (Class):**
```typescript
class DeeJay extends Component {
  private intervalId: number;
  private waveSurfers: WaveSurfer[] = [];
  private clicked: boolean[] = [];
  private currentPlaying: string[] = [];

  componentDidMount() {
    this.intervalId = setInterval(() => {
      console.log('tick');
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }
}
```

**After (Hooks):**
```typescript
function DeeJay() {
  const intervalIdRef = useRef<number>();
  const waveSurfersRef = useRef<WaveSurfer[]>([]);
  const clickedRef = useRef<boolean[]>([]);
  const currentPlayingRef = useRef<string[]>([]);

  useEffect(() => {
    intervalIdRef.current = setInterval(() => {
      console.log('tick');
    }, 1000);

    return () => clearInterval(intervalIdRef.current);
  }, []);

  // Access with .current
  const ws = waveSurfersRef.current[0];
}
```

### When to Use useRef vs useState

**Use `useState` when:**
- Changes should trigger re-renders
- The value is displayed in the UI
- Other effects/functions depend on the latest value

**Use `useRef` when:**
- You need to store a mutable value that persists across renders
- Changes should NOT trigger re-renders
- Storing DOM references
- Storing interval/timeout IDs
- Storing previous values
- Storing callback references

**Example:**
```typescript
// ❌ Wrong: This won't re-render when intervalId changes (but that's fine!)
const [intervalId, setIntervalId] = useState<number>();

// ✅ Right: We don't need re-renders for intervalId
const intervalIdRef = useRef<number>();

// ✅ Right: We DO need re-renders for count (it's displayed)
const [count, setCount] = useState(0);
```

### DOM Refs

**Before (Class):**
```typescript
class VideoPlayer extends Component {
  private videoRef: HTMLVideoElement | null = null;

  setRef = (element: HTMLVideoElement | null) => {
    this.videoRef = element;
  };

  play = () => {
    this.videoRef?.play();
  };

  render() {
    return <video ref={this.setRef} />;
  }
}
```

**After (Hooks):**
```typescript
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    videoRef.current?.play();
  };

  return <video ref={videoRef} />;
}
```

**Real Prestige Example (ResizableDiv):**
```typescript
function ResizableDiv({ children, className }) {
  const { width, height, ref } = useResizeDetector({
    handleHeight: true,
    refreshMode: "debounce",
    refreshRate: 16,
  });

  const prevSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);

    // Compare with previous value stored in ref
    if (
      prevSizeRef.current.width !== roundedWidth ||
      prevSizeRef.current.height !== roundedHeight
    ) {
      updateDimensions({ width: roundedWidth, height: roundedHeight });
      prevSizeRef.current = { width: roundedWidth, height: roundedHeight };
    }
  }, [width, height]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

---

## 4. Redux Connection

### Class Component with connect()

**Before (Class):**
```typescript
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../store';

interface StateProps {
  url: string;
  volumes: number[];
  isReady: boolean;
}

interface DispatchProps {
  togglePlay: typeof actions.togglePlay;
  setSeek: typeof actions.setSeek;
}

class DeeJay extends Component<StateProps & DispatchProps> {
  handlePlay = () => {
    this.props.togglePlay(true);
    this.props.setSeek(0, 'seconds');
  };

  render() {
    return (
      <div>
        <p>URL: {this.props.url}</p>
        <p>Volume: {this.props.volumes[0]}</p>
        <button onClick={this.handlePlay}>Play</button>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => ({
  url: state.player.url,
  volumes: state.deeJay.volumes,
  isReady: state.player.ready,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      togglePlay: actions.togglePlay,
      setSeek: actions.setSeek,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(DeeJay);
```

**After (Hooks):**
```typescript
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../store';
import type { RootState } from '../store';

function DeeJay() {
  // useSelector for reading state (replaces mapStateToProps)
  const url = useSelector((state: RootState) => state.player.url);
  const volumes = useSelector((state: RootState) => state.deeJay.volumes);
  const isReady = useSelector((state: RootState) => state.player.ready);

  // useDispatch for dispatching actions (replaces mapDispatchToProps)
  const dispatch = useDispatch();

  const handlePlay = () => {
    dispatch(actions.togglePlay(true));
    dispatch(actions.setSeek(0, 'seconds'));
  };

  return (
    <div>
      <p>URL: {url}</p>
      <p>Volume: {volumes[0]}</p>
      <button onClick={handlePlay}>Play</button>
    </div>
  );
}

export default DeeJay;
```

### Optimizing useSelector

**Basic (may cause extra re-renders):**
```typescript
// ❌ Creates new object every time, causing re-renders
const state = useSelector((state: RootState) => ({
  url: state.player.url,
  volumes: state.deeJay.volumes,
  isReady: state.player.ready,
}));
```

**Optimized (separate selectors):**
```typescript
// ✅ Each selector returns a primitive or stable reference
const url = useSelector((state: RootState) => state.player.url);
const volumes = useSelector((state: RootState) => state.deeJay.volumes);
const isReady = useSelector((state: RootState) => state.player.ready);
```

**Optimized (with shallowEqual):**
```typescript
import { shallowEqual } from 'react-redux';

// ✅ Uses shallow comparison to prevent unnecessary re-renders
const { url, volumes, isReady } = useSelector(
  (state: RootState) => ({
    url: state.player.url,
    volumes: state.deeJay.volumes,
    isReady: state.player.ready,
  }),
  shallowEqual
);
```

---

## 5. Common Patterns

### Event Handlers (No More `this` Binding!)

**Before (Class):**
```typescript
class DeeJay extends Component {
  // Option 1: Bind in constructor
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(this.props.url);
  }

  // Option 2: Arrow function (creates new function each render)
  handleClick = () => {
    console.log(this.props.url);
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

**After (Hooks):**
```typescript
function DeeJay({ url }) {
  // No binding needed! Just define the function
  const handleClick = () => {
    console.log(url);
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### Memoization with useMemo

**Before (Class):**
```typescript
class DeeJay extends Component {
  render() {
    // This recalculates on every render
    const expensiveValue = this.props.data
      .filter(item => item.active)
      .map(item => calculateExpensiveValue(item));

    return <div>{expensiveValue.length}</div>;
  }
}
```

**After (Hooks):**
```typescript
function DeeJay({ data }) {
  // Only recalculates when 'data' changes
  const expensiveValue = useMemo(() => {
    return data
      .filter(item => item.active)
      .map(item => calculateExpensiveValue(item));
  }, [data]);

  return <div>{expensiveValue.length}</div>;
}
```

### Memoized Callbacks with useCallback

**Before (Class):**
```typescript
class DeeJay extends Component {
  handleClick = (id: string) => {
    this.props.onSelect(id);
  };

  render() {
    // This creates a new function on every render
    return (
      <ChildComponent
        onClick={() => this.handleClick('item-1')}
      />
    );
  }
}
```

**After (Hooks):**
```typescript
function DeeJay({ onSelect }) {
  // Only creates new function when onSelect changes
  const handleClick = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  return (
    <ChildComponent
      onClick={() => handleClick('item-1')}
    />
  );
}
```

**When to use useCallback:**
- Passing callbacks to memoized child components
- Callbacks in dependency arrays of useEffect/useMemo
- Callbacks passed to custom hooks

### Refs for DOM Access

**Before (Class):**
```typescript
class WaveTable extends Component {
  private containerRef: HTMLDivElement | null = null;

  scrollToBottom = () => {
    if (this.containerRef) {
      this.containerRef.scrollTop = this.containerRef.scrollHeight;
    }
  };

  render() {
    return (
      <div ref={el => this.containerRef = el}>
        {/* content */}
      </div>
    );
  }
}
```

**After (Hooks):**
```typescript
function WaveTable() {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  return (
    <div ref={containerRef}>
      {/* content */}
    </div>
  );
}
```

---

## 6. Prestige Custom Hooks

Prestige provides several custom hooks in `/src/shared/hooks/`. Use these instead of reimplementing common patterns.

### useInterval

**Replaces class-based intervals with automatic cleanup.**

**Before (Class):**
```typescript
class DeeJay extends Component {
  private intervalId: number;

  componentDidMount() {
    this.intervalId = setInterval(() => {
      this.checkPlaybackStatus();
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }
}
```

**After (useInterval):**
```typescript
import { useInterval } from '@/shared/hooks';

function DeeJay() {
  useInterval(() => {
    checkPlaybackStatus();
  }, 100);

  // Cleanup is automatic!
}
```

**Full API:**
```typescript
/**
 * @param callback - Function to call on each interval tick
 * @param delay - Delay in milliseconds, or null to pause
 */
function useInterval(callback: () => void, delay: number | null): void;

// Example: Pausable interval
const [isPaused, setIsPaused] = useState(false);
useInterval(() => {
  console.log('tick');
}, isPaused ? null : 1000);
```

### useDebounce

**Delays updating a value until user stops changing it. Perfect for search inputs and API calls.**

**Before (Class):**
```typescript
class SearchBar extends Component {
  private timeoutId: number;

  handleSearchChange = (value: string) => {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.props.searchAPI(value);
    }, 500);
  };

  componentWillUnmount() {
    clearTimeout(this.timeoutId);
  }
}
```

**After (useDebounce):**
```typescript
import { useDebounce } from '@/shared/hooks';

function SearchBar({ searchAPI }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />
  );
}
```

**Full API:**
```typescript
/**
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before updating
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T;

// Example: Debounced window resize
const [windowSize, setWindowSize] = useState(window.innerWidth);
const debouncedSize = useDebounce(windowSize, 250);

useEffect(() => {
  // Only runs 250ms after resize stops
  console.log('Window stabilized at:', debouncedSize);
}, [debouncedSize]);
```

### useLocalStorage

**Syncs state with localStorage for persistence across sessions.**

**Before (Class):**
```typescript
class Settings extends Component {
  state = {
    theme: localStorage.getItem('theme') || 'light',
    volume: parseFloat(localStorage.getItem('volume') || '0.5'),
  };

  setTheme = (theme: string) => {
    this.setState({ theme });
    localStorage.setItem('theme', theme);
  };

  setVolume = (volume: number) => {
    this.setState({ volume });
    localStorage.setItem('volume', String(volume));
  };
}
```

**After (useLocalStorage):**
```typescript
import { useLocalStorage } from '@/shared/hooks';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [volume, setVolume] = useLocalStorage('volume', 0.5);

  // Automatically syncs with localStorage!
  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <input
        type="range"
        value={volume}
        onChange={e => setVolume(parseFloat(e.target.value))}
      />
    </div>
  );
}
```

**Full API:**
```typescript
/**
 * @param key - The localStorage key
 * @param initialValue - Default value if none exists
 * @returns [storedValue, setValue] tuple like useState
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void];

// Example: Complex objects
const [userPreferences, setUserPreferences] = useLocalStorage('prefs', {
  theme: 'dark',
  volume: 0.8,
  language: 'en',
});

// Update like regular state
setUserPreferences({ ...userPreferences, theme: 'light' });
```

### usePrevious

**Tracks the previous value of a variable. Useful for comparison logic.**

**Before (Class):**
```typescript
class DeeJay extends Component {
  componentDidUpdate(prevProps: DeeJayProps) {
    if (prevProps.url !== this.props.url) {
      console.log('URL changed from', prevProps.url, 'to', this.props.url);
      this.loadNewMedia();
    }
  }
}
```

**After (usePrevious):**
```typescript
import { usePrevious } from '@/shared/hooks';

function DeeJay({ url }) {
  const prevUrl = usePrevious(url);

  useEffect(() => {
    if (prevUrl !== undefined && prevUrl !== url) {
      console.log('URL changed from', prevUrl, 'to', url);
      loadNewMedia();
    }
  }, [url, prevUrl]);
}
```

**Full API:**
```typescript
/**
 * @param value - The value to track
 * @returns The previous value (undefined on first render)
 */
function usePrevious<T>(value: T): T | undefined;

// Example: Detect video seeks
function VideoPlayer({ currentTime }) {
  const prevTime = usePrevious(currentTime);

  useEffect(() => {
    if (prevTime !== undefined && Math.abs(currentTime - prevTime) > 1) {
      console.log('User seeked the video');
      trackAnalyticsEvent('video_seek');
    }
  }, [currentTime, prevTime]);
}

// Example: Animation direction
function Counter({ count }) {
  const prevCount = usePrevious(count);
  const direction = count > (prevCount ?? 0) ? 'up' : 'down';

  return (
    <div className={`counter-${direction}`}>
      {count}
    </div>
  );
}
```

---

## 7. Quick Reference Table

| Class Component | Function Component | Notes |
|----------------|-------------------|-------|
| `this.state = { count: 0 }` | `const [count, setCount] = useState(0)` | State initialization |
| `this.setState({ count: 1 })` | `setCount(1)` | Update state |
| `this.setState(prev => ({ count: prev.count + 1 }))` | `setCount(prev => prev + 1)` | Functional update |
| `componentDidMount()` | `useEffect(() => { ... }, [])` | Run once on mount |
| `componentDidUpdate()` | `useEffect(() => { ... }, [deps])` | Run when deps change |
| `componentWillUnmount()` | `useEffect(() => { return () => {...} }, [])` | Cleanup on unmount |
| `this.intervalId = ...` | `const intervalRef = useRef()` | Instance variable (non-state) |
| `this.videoRef = element` | `const videoRef = useRef(null)` | DOM reference |
| `connect(mapState, mapDispatch)` | `useSelector()` + `useDispatch()` | Redux connection |
| `shouldComponentUpdate()` | `React.memo()` | Prevent re-renders |
| Expensive calculation in render | `useMemo(() => {...}, [deps])` | Memoize value |
| Method passed as prop | `useCallback(() => {...}, [deps])` | Memoize function |
| `prevProps` in `componentDidUpdate` | `usePrevious(value)` | Track previous value |
| Manual interval setup/cleanup | `useInterval(callback, delay)` | Declarative interval |
| Manual debounce logic | `useDebounce(value, delay)` | Debounced value |
| Manual localStorage sync | `useLocalStorage(key, initial)` | Persistent state |

---

## 8. Common Gotchas

### 1. Stale Closures in useEffect

**Problem:**
```typescript
function DeeJay({ url }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // ❌ This always logs 0!
      console.log(count);
      setCount(count + 1); // ❌ This doesn't work as expected
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps = closure captures initial count (0)
}
```

**Solution 1: Add to dependencies**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // ✅ Always current
  }, 1000);

  return () => clearInterval(interval);
}, [count]); // Re-creates interval when count changes
```

**Solution 2: Use functional update**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setCount(prevCount => {
      console.log(prevCount); // ✅ Always current
      return prevCount + 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, []); // Only creates once, but always has current count
```

**Solution 3: Use useRef for latest value**
```typescript
function DeeJay({ url }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);

  // Keep ref in sync
  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log(countRef.current); // ✅ Always current
      setCount(c => c + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Only creates once
}
```

### 2. Infinite Re-render Loops

**Problem:**
```typescript
function DeeJay({ data }) {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    // ❌ Infinite loop! Setting state in useEffect without deps
    setProcessedData(data.map(item => transform(item)));
  }); // No dependency array = runs after every render!
}
```

**Solution:**
```typescript
function DeeJay({ data }) {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    // ✅ Only runs when 'data' changes
    setProcessedData(data.map(item => transform(item)));
  }, [data]);
}
```

**Better Solution (no state needed):**
```typescript
function DeeJay({ data }) {
  // ✅ Compute during render, memoize if expensive
  const processedData = useMemo(
    () => data.map(item => transform(item)),
    [data]
  );
}
```

### 3. Using Objects/Arrays in Dependency Arrays

**Problem:**
```typescript
function DeeJay({ config }) {
  useEffect(() => {
    initializePlayer(config);
  }, [config]); // ❌ May re-run even if config values haven't changed
  // (if parent creates new object each render)
}
```

**Solution 1: Destructure specific values**
```typescript
function DeeJay({ config }) {
  const { volume, playbackRate } = config;

  useEffect(() => {
    initializePlayer(config);
  }, [volume, playbackRate]); // ✅ Only re-runs if these change
}
```

**Solution 2: Deep comparison (use sparingly)**
```typescript
import { useDeepCompareEffect } from 'use-deep-compare';

function DeeJay({ config }) {
  useDeepCompareEffect(() => {
    initializePlayer(config);
  }, [config]); // ✅ Deep compares config
}
```

### 4. Missing Cleanup in useEffect

**Problem:**
```typescript
function DeeJay({ waveSurferId }) {
  useEffect(() => {
    const ws = createWaveSurfer(waveSurferId);
    // ❌ No cleanup! Memory leak when component unmounts
  }, [waveSurferId]);
}
```

**Solution:**
```typescript
function DeeJay({ waveSurferId }) {
  useEffect(() => {
    const ws = createWaveSurfer(waveSurferId);

    return () => {
      // ✅ Cleanup runs before re-running effect and on unmount
      ws.destroy();
    };
  }, [waveSurferId]);
}
```

### 5. Calling Hooks Conditionally

**Problem:**
```typescript
function DeeJay({ isReady }) {
  // ❌ Hooks must be called in the same order every render
  if (isReady) {
    const [count, setCount] = useState(0); // ❌ Breaks rules of hooks
  }

  // ❌ Hooks can't be in loops
  for (let i = 0; i < 3; i++) {
    const [state, setState] = useState(0); // ❌ Breaks rules of hooks
  }
}
```

**Solution:**
```typescript
function DeeJay({ isReady }) {
  // ✅ Always call hooks at the top level
  const [count, setCount] = useState(0);

  // ✅ Conditional logic goes INSIDE hooks
  useEffect(() => {
    if (isReady) {
      // Use count here
    }
  }, [isReady, count]);

  // ✅ For multiple similar states, use array state
  const [states, setStates] = useState([0, 0, 0]);
}
```

### 6. Not Handling Async in useEffect

**Problem:**
```typescript
function DeeJay({ url }) {
  useEffect(async () => {
    // ❌ useEffect can't be async directly
    const data = await fetchData(url);
  }, [url]);
}
```

**Solution:**
```typescript
function DeeJay({ url }) {
  useEffect(() => {
    // ✅ Create async function inside
    async function loadData() {
      const data = await fetchData(url);
      setData(data);
    }

    loadData();
  }, [url]);

  // ✅ Or use .then()
  useEffect(() => {
    fetchData(url).then(data => setData(data));
  }, [url]);
}
```

**With cleanup:**
```typescript
function DeeJay({ url }) {
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const data = await fetchData(url);
      if (!cancelled) {
        setData(data);
      }
    }

    loadData();

    return () => {
      cancelled = true; // Prevent state update if unmounted
    };
  }, [url]);
}
```

### 7. useState vs useRef Confusion

**Remember:**

**Use `useState` when:**
- The value affects what's rendered
- Changing the value should cause a re-render
- Example: `count`, `isPlaying`, `selectedItem`

**Use `useRef` when:**
- The value persists but doesn't affect rendering
- Changing the value should NOT cause a re-render
- Example: `intervalId`, `previousValue`, `domElement`, `waveSurferInstance`

```typescript
// ❌ Wrong: Using useState for interval ID (causes unnecessary re-renders)
const [intervalId, setIntervalId] = useState<number>();

// ✅ Right: Using useRef (no re-renders)
const intervalIdRef = useRef<number>();

// ❌ Wrong: Using useRef for displayed count (won't re-render)
const countRef = useRef(0);
return <div>{countRef.current}</div>; // Won't update UI!

// ✅ Right: Using useState (re-renders on change)
const [count, setCount] = useState(0);
return <div>{count}</div>;
```

### 8. useEffect Running Twice in Development

**This is normal in React 18+ Strict Mode!**

React deliberately mounts components twice in development to help you find bugs. This doesn't happen in production.

**Problem:**
```typescript
function DeeJay() {
  useEffect(() => {
    console.log('Mount'); // Logs twice in dev mode!
    fetchData();
  }, []);
}
```

**This is expected behavior.** To handle it:

```typescript
function DeeJay() {
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      const data = await fetchData();
      if (!cancelled) {
        setData(data);
      }
    }

    loadData();

    return () => {
      cancelled = true; // Cleanup from first mount
    };
  }, []);
}
```

---

## Additional Resources

### Official Documentation
- [React Hooks Documentation](https://react.dev/reference/react)
- [Redux Hooks Documentation](https://react-redux.js.org/api/hooks)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)

### Prestige-Specific
- [Migration Plan](/MIGRATION_PLAN.md) - Overall migration strategy
- [Custom Hooks Source](/src/shared/hooks/) - Browse hook implementations
- [Architectural Recommendations](/docs/ARCHITECTURAL_RECOMMENDATIONS.md)

### Common Patterns in Prestige
- **WaveSurfer Management**: Use `useRef` for WaveSurfer instances, `useEffect` for lifecycle
- **Redux State**: Prefer `useSelector` with separate selectors over combined selectors
- **Event Handlers**: Use `useCallback` only when passing to memoized children
- **Intervals**: Always use `useInterval` hook instead of manual setInterval

---

## Summary

**Key Takeaways:**

1. **State**: `this.setState()` → `useState()` or `useReducer()` for complex state
2. **Lifecycle**: Use `useEffect()` with different dependency arrays
3. **Instance Variables**: `this.property` → `useRef()` for non-rendering values
4. **Redux**: `connect()` → `useSelector()` + `useDispatch()`
5. **Event Handlers**: No more binding! Just define functions normally
6. **Custom Hooks**: Reuse `useInterval`, `useDebounce`, `useLocalStorage`, `usePrevious`
7. **Always**: Follow Rules of Hooks (top level, same order, not conditional)

**Migration Checklist:**

- [ ] Convert state to `useState` or `useReducer`
- [ ] Convert lifecycle methods to `useEffect`
- [ ] Convert instance variables to `useRef`
- [ ] Convert Redux `connect()` to hooks
- [ ] Remove `this` and arrow function bindings
- [ ] Add proper cleanup to effects
- [ ] Use Prestige custom hooks where applicable
- [ ] Test thoroughly (especially async/cleanup logic)

Happy migrating! 🚀
