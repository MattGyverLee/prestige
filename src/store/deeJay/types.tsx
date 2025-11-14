/**
 * DeeJay Redux Store Type Definitions
 *
 * This module defines the types for the DeeJay (DJ) store, which manages
 * WaveSurfer playback controls including:
 * - Volume levels for multiple WaveSurfer instances
 * - Dispatch commands for coordinating playback across instances
 * - Subtitle display for annotation text
 *
 * The DeeJay store acts as a central controller for multi-track audio/video
 * playback with synchronized transport controls.
 *
 * @module store/deeJay/types
 */

// ============================================================================
// STATE SHAPE
// ============================================================================

/**
 * DeeJay Redux state shape
 *
 * The DeeJay state manages playback coordination across multiple WaveSurfer instances.
 * It stores volume levels, dispatch commands, and subtitle text.
 */
export interface DeeJayState {
  /**
   * Current dispatch command for coordinating WaveSurfer playback
   *
   * Contains information about what playback action to perform (play, pause, seek, etc.)
   * and which WaveSurfer instances should respond to it.
   */
  dispatch: DeeJayDispatch;

  /**
   * Volume levels for WaveSurfer instances
   *
   * Array index corresponds to WaveSurfer instance number.
   * Values range from 0.0 (muted) to 1.0 (full volume).
   *
   * Typical setup:
   * - volumes[0]: Main video/audio track
   * - volumes[1]: CarefulMerged voiceover track
   * - volumes[2]: TranslationMerged voiceover track
   */
  volumes: number[];

  /**
   * Subtitle text to display
   *
   * Typically contains transcription or translation text synchronized
   * with the current playback position.
   */
  subtitle: string;
}

/**
 * Dispatch command for coordinating WaveSurfer playback
 *
 * This object describes a playback action to be executed across one or more
 * WaveSurfer instances. The dispatch mechanism allows centralized control
 * of multiple synchronized audio/video players.
 */
export interface DeeJayDispatch {
  /**
   * Type of dispatch command
   *
   * Common values:
   * - "play": Start playback
   * - "pause": Pause playback
   * - "seek": Jump to a specific time position
   * - "region": Play a specific region/clip
   * - "loop": Enable looping on a region
   */
  dispatchType: string;

  /**
   * Primary WaveSurfer instance number to target
   *
   * Identifies which WaveSurfer instance should respond to this dispatch.
   * If undefined, all instances may respond.
   */
  wsNum?: number;

  /**
   * Secondary WaveSurfer instance number
   *
   * Used for commands that involve multiple WaveSurfer instances
   * (e.g., crossfading between tracks).
   */
  wsNum2?: number;

  /**
   * Clip start time in seconds
   *
   * For "region" or "clip" dispatch types, specifies where the clip begins
   * within the audio file.
   */
  clipStart?: number;

  /**
   * Clip stop time in seconds
   *
   * For "region" or "clip" dispatch types, specifies where the clip ends
   * within the audio file.
   */
  clipStop?: number;

  /**
   * Reference start time in seconds
   *
   * Used for synchronized playback where a clip needs to align with
   * a reference timeline position.
   */
  refStart?: number;

  /**
   * Reference stop time in seconds
   *
   * Used for synchronized playback where a clip needs to align with
   * a reference timeline position.
   */
  refStop?: number;

  /**
   * Loop count
   *
   * Number of times to loop the current region.
   * - 0 or undefined: No looping
   * - Positive integer: Loop N times
   * - -1: Loop indefinitely
   */
  loop?: number;
}

// ============================================================================
// ACTION TYPE CONSTANTS
// ============================================================================

/**
 * Action type: Set volume for a specific WaveSurfer instance
 */
export const SET_WS_VOLUME = "SET_WS_VOLUME";

/**
 * Action type: Reset DeeJay state to initial clean state
 */
export const RESET_DEE_JAY = "RESET_DEE_JAY";

/**
 * Action type: Set dispatch command for WaveSurfer coordination
 */
export const SET_DISPATCH = "SET_DISPATCH";

/**
 * Action type: Set subtitle text to display
 */
export const SET_SUBTITLE = "SET_SUBTITLE";

// ============================================================================
// ACTION INTERFACES
// ============================================================================

/**
 * Action: Set volume for a specific WaveSurfer instance
 */
interface SetWSVolume {
  type: typeof SET_WS_VOLUME;
  payload: {
    /** Index of the WaveSurfer instance (0, 1, 2, ...) */
    idx: number;
    /** Volume level (0.0 to 1.0) */
    volume: number;
  };
}

/**
 * Action: Reset DeeJay state to initial values
 */
interface ResetDeeJay {
  type: typeof RESET_DEE_JAY;
}

/**
 * Action: Set dispatch command for WaveSurfer coordination
 */
interface SetDispatch {
  type: typeof SET_DISPATCH;
  payload: DeeJayDispatch;
}

/**
 * Action: Set subtitle text to display
 */
interface SetSubtitle {
  type: typeof SET_SUBTITLE;
  payload: string;
}

// ============================================================================
// UNION TYPE
// ============================================================================

/**
 * Union of all possible DeeJay action types
 *
 * This type ensures type safety when handling actions in the reducer.
 */
export type DeeJayActionTypes =
  | SetWSVolume
  | ResetDeeJay
  | SetDispatch
  | SetSubtitle;
