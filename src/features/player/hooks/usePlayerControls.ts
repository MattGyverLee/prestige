/**
 * usePlayerControls Hook
 *
 * Custom hook that provides player control functionality by connecting to Redux state
 * and dispatching player actions. This hook encapsulates all playback control logic
 * including play/pause, seeking, speed control, and loop functionality.
 *
 * @module features/player/hooks/usePlayerControls
 *
 * @example
 * ```tsx
 * function ControlRow() {
 *   const {
 *     isPlaying,
 *     currentTime,
 *     duration,
 *     speed,
 *     speedsIndex,
 *     play,
 *     pause,
 *     togglePlayPause,
 *     seek,
 *     setSpeed,
 *     incrementSpeed,
 *     decrementSpeed,
 *     toggleLoop
 *   } = usePlayerControls();
 *
 *   return (
 *     <button onClick={togglePlayPause}>
 *       {isPlaying ? 'Pause' : 'Play'}
 *     </button>
 *   );
 * }
 * ```
 */

import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { StateProps } from "@/store";
import * as actions from "@/store";

/**
 * Player controls state returned by the hook
 */
export interface PlayerControlsState {
  /** Whether the player is currently playing */
  isPlaying: boolean;
  /** Current playback position as a fraction (0.0 to 1.0) */
  currentTime: number;
  /** Total duration of the media in seconds */
  duration: number;
  /** Current playback speed multiplier */
  speed: number;
  /** Current playback rate */
  playbackRate: number;
  /** Index of the current speed preset in the speeds array */
  speedsIndex: number;
  /** Whether the player is in loop mode */
  loop: boolean;
  /** Whether the user is currently seeking */
  seeking: boolean;
}

/**
 * Player control methods returned by the hook
 */
export interface PlayerControlsMethods {
  /** Start playback */
  play: () => void;
  /** Pause playback */
  pause: () => void;
  /** Toggle between play and pause */
  togglePlayPause: () => void;
  /** Seek to a specific time (fraction 0.0 to 1.0) */
  seek: (time: number) => void;
  /** Set playback speed multiplier */
  setSpeed: (speed: number) => void;
  /** Increment to next speed preset */
  incrementSpeed: () => void;
  /** Decrement to previous speed preset */
  decrementSpeed: () => void;
  /** Toggle loop mode on/off */
  toggleLoop: () => void;
  /** Handle seek bar mouse down event */
  onSeekMouseDown: () => void;
  /** Handle seek bar mouse up event */
  onSeekMouseUp: () => void;
  /** Handle seek bar value change during drag */
  onSeekChange: (time: number) => void;
  /** Dispatch a custom player/DeeJay action */
  dispatchPlayerAction: (action: {
    dispatchType: string;
    wsNum: number;
    refStart?: number;
  }) => void;
}

/**
 * Complete return type of usePlayerControls hook
 */
export type UsePlayerControlsReturn = PlayerControlsState &
  PlayerControlsMethods;

/**
 * Custom hook for player controls
 *
 * Provides a comprehensive interface for controlling media playback by connecting
 * to the Redux player store. All methods are memoized with useCallback for optimal
 * performance in child components.
 *
 * **State provided:**
 * - Playing status, playback position, duration
 * - Speed settings and loop mode
 * - Seeking state
 *
 * **Methods provided:**
 * - Play/pause controls
 * - Seeking and progress tracking
 * - Speed control (presets and custom values)
 * - Loop toggle
 * - Low-level dispatch for advanced use cases
 *
 * @returns {UsePlayerControlsReturn} Player state and control methods
 *
 * @example
 * ```tsx
 * function PlayPauseButton() {
 *   const { isPlaying, togglePlayPause } = usePlayerControls();
 *
 *   return (
 *     <button onClick={togglePlayPause}>
 *       {isPlaying ? '⏸' : '▶'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function SpeedControl() {
 *   const { speed, incrementSpeed, decrementSpeed } = usePlayerControls();
 *
 *   return (
 *     <div>
 *       <button onClick={decrementSpeed}>-</button>
 *       <span>{speed}x</span>
 *       <button onClick={incrementSpeed}>+</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlayerControls(): UsePlayerControlsReturn {
  const dispatch = useDispatch();

  // ============================================================================
  // SELECTORS - Read state from Redux store
  // ============================================================================

  // Playback state
  const isPlaying = useSelector((state: StateProps) => state.player.playing);

  const currentTime = useSelector((state: StateProps) => state.player.played);

  const duration = useSelector((state: StateProps) => state.player.duration);

  const loop = useSelector((state: StateProps) => state.player.loop);

  const seeking = useSelector(
    (state: StateProps) => state.player.seeking ?? false,
  );

  // Speed state
  const speed = useSelector(
    (state: StateProps) => state.player.playbackMultiplier,
  );

  const playbackRate = useSelector(
    (state: StateProps) => state.player.playbackRate,
  );

  const speedsIndex = useSelector(
    (state: StateProps) => state.player.speedsIndex,
  );

  // ============================================================================
  // ACTION DISPATCHERS - Memoized callbacks for dispatching actions
  // ============================================================================

  /**
   * Start playback
   */
  const play = useCallback(() => {
    dispatch(actions.togglePlay(true));
  }, [dispatch]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    dispatch(actions.togglePlay(false));
  }, [dispatch]);

  /**
   * Toggle between play and pause
   */
  const togglePlayPause = useCallback(() => {
    dispatch(actions.togglePlay());
  }, [dispatch]);

  /**
   * Seek to a specific position
   *
   * @param time - Playback position as fraction (0.0 to 1.0)
   */
  const seek = useCallback(
    (time: number) => {
      dispatch(actions.setSeek(time, "fraction"));
    },
    [dispatch],
  );

  /**
   * Set playback speed multiplier
   *
   * @param newSpeed - Speed multiplier (e.g., 1.0 = normal, 2.0 = double)
   */
  const setSpeed = useCallback(
    (newSpeed: number) => {
      dispatch(actions.setPlaybackMultiplier(newSpeed));
    },
    [dispatch],
  );

  /**
   * Increment to next speed preset
   */
  const incrementSpeed = useCallback(() => {
    dispatch(actions.changeSpeedsIndex("+"));
  }, [dispatch]);

  /**
   * Decrement to previous speed preset
   */
  const decrementSpeed = useCallback(() => {
    dispatch(actions.changeSpeedsIndex("-"));
  }, [dispatch]);

  /**
   * Toggle loop mode on/off
   */
  const toggleLoop = useCallback(() => {
    dispatch(actions.toggleLoop());
  }, [dispatch]);

  /**
   * Handle seek bar mouse down event
   *
   * Sets seeking state to true, preventing progress updates during drag
   */
  const onSeekMouseDown = useCallback(() => {
    dispatch(actions.onSeekMouseDown());
  }, [dispatch]);

  /**
   * Handle seek bar mouse up event
   *
   * Sets seeking state to false, allowing progress updates to resume
   */
  const onSeekMouseUp = useCallback(() => {
    dispatch(actions.onSeekMouseUp());
  }, [dispatch]);

  /**
   * Handle seek bar value change during drag
   *
   * Updates the visual playback position without actually seeking yet
   *
   * @param time - New playback position as fraction (0.0 to 1.0)
   */
  const onSeekChange = useCallback(
    (time: number) => {
      dispatch(actions.onSeekChange(time));
    },
    [dispatch],
  );

  /**
   * Dispatch a custom player or DeeJay action
   *
   * This is a low-level method for dispatching complex actions like
   * PlayPause or PlayerSeek that require additional parameters.
   *
   * @param action - Action configuration object
   * @param action.dispatchType - Type of action (e.g., "PlayPause", "PlayerSeek")
   * @param action.wsNum - WaveSurfer number (-1 for player controls)
   * @param action.refStart - Optional start reference time in seconds
   */
  const dispatchPlayerAction = useCallback(
    (action: { dispatchType: string; wsNum: number; refStart?: number }) => {
      dispatch(actions.setDispatch(action));
    },
    [dispatch],
  );

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    speed,
    playbackRate,
    speedsIndex,
    loop,
    seeking,

    // Methods
    play,
    pause,
    togglePlayPause,
    seek,
    setSpeed,
    incrementSpeed,
    decrementSpeed,
    toggleLoop,
    onSeekMouseDown,
    onSeekMouseUp,
    onSeekChange,
    dispatchPlayerAction,
  };
}
