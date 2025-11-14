/**
 * Player Redux Type Definitions
 *
 * This module defines the types for the media player store, which manages
 * ReactPlayer state including playback controls, seeking, volume, and speed.
 *
 * The player store coordinates:
 * - Media loading and URL management
 * - Playback state (playing, paused, stopped)
 * - Progress tracking (current position, duration, buffering)
 * - User interactions (seeking, volume, speed adjustments)
 * - Loop and mute settings
 *
 * @module store/player/types
 */

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * Media Player State
 *
 * Represents the complete state of the ReactPlayer instance, tracking all
 * aspects of media playback and user controls.
 */
export interface MediaPlayerState {
  /**
   * Whether to show ReactPlayer controls (deprecated, not used)
   * @deprecated Player controls are handled by custom UI
   */
  controls?: boolean;

  /**
   * Total duration of the loaded media in seconds
   * Set to 0 when no media is loaded
   */
  duration: number;

  /**
   * Fraction of media buffered/loaded (0.0 to 1.0)
   * Updated continuously as media buffers
   */
  loaded: number;

  /**
   * Whether loop mode is enabled
   * When true, playback restarts from beginning on end
   */
  loop: boolean;

  /**
   * Whether audio is muted
   * When true, volume is set to 0 (but volume level is preserved)
   */
  muted: boolean;

  /**
   * Additional speed multiplier applied to playbackRate
   * Used for fine-grained speed control
   * Default: 1.0 (no additional multiplication)
   */
  playbackMultiplier: number;

  /**
   * Current playback speed multiplier
   * Range: 0.2x to 14.5x
   * Default: 1.0 (normal speed)
   */
  playbackRate: number;

  /**
   * Fraction of media played (0.0 to 1.0)
   * Represents current playback position as fraction of total duration
   */
  played: number;

  /**
   * Whether media is currently playing
   * True = playing, False = paused
   */
  playing: boolean;

  /**
   * Whether ReactPlayer is loaded and ready for playback
   * True after onReady event fires, false before or during loading
   */
  ready: boolean;

  /**
   * Seek target for jumping to a specific position
   * - time: Target position value
   * - scale: How to interpret the time value
   *   - "seconds": Absolute time in seconds
   *   - "fraction": Relative position (0.0 to 1.0)
   *   - undefined: Let player determine scale
   */
  seek: { time: number; scale: "seconds" | "fraction" | undefined };

  /**
   * Whether user is currently dragging the seek bar
   * When true, progress updates are ignored to prevent seek bar jumping
   */
  seeking?: boolean;

  /**
   * Index into speeds array for preset playback rates
   * Speeds array: [0.2, 0.33, 0.5, 0.66, 0.8, 1, 1.25, 1.5, 2, 3, 5]
   * Default: 5 (1.0x normal speed)
   */
  speedsIndex: number;

  /**
   * Media URL to load in ReactPlayer
   * Can be blob URL, file path, or HTTP(S) URL
   * Empty string when no media loaded
   */
  url: string;

  /**
   * Audio volume level (0.0 to 1.0)
   * 0.0 = silent, 1.0 = maximum volume
   */
  volume: number;
}

// ============================================================================
// ACTION TYPE CONSTANTS
// ============================================================================

// STATE MANAGEMENT
/**
 * Update entire player state with new values
 */
export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";

/**
 * Set media URL and timeline index
 */
export const SET_URL = "SET_URL";

/**
 * Hard reset entire application state
 */
export const HARD_RESET_APP = "HARD_RESET_APP";

/**
 * Reset player when opening a new folder
 */
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";

// PLAYBACK CONTROL
/**
 * Toggle between play and pause
 */
export const TOGGLE_PLAY = "TOGGLE_PLAY";

/**
 * Stop playback and unload media
 */
export const STOP_PLAYING = "STOP_PLAYING";

/**
 * Toggle loop mode on/off
 */
export const TOGGLE_LOOP = "TOGGLE_LOOP";

/**
 * ReactPlayer onPlay callback fired
 */
export const ON_PLAY = "ON_PLAY";

/**
 * ReactPlayer onPause callback fired
 */
export const ON_PAUSE = "ON_PAUSE";

/**
 * ReactPlayer onEnded callback fired
 */
export const ON_ENDED = "ON_ENDED";

// PROGRESS TRACKING
/**
 * ReactPlayer onReady callback fired
 */
export const ON_READY = "ON_READY";

/**
 * Set total media duration
 */
export const SET_DURATION = "SET_DURATION";

/**
 * ReactPlayer onProgress callback fired
 * Note: Typo in constant name (PROGESS vs PROGRESS) is intentional for backward compatibility
 */
export const ON_PROGRESS = "ON_PROGESS";

// SEEKING
/**
 * User started dragging seek bar
 */
export const ON_SEEK_MOUSE_DOWN = "ON_SEEK_MOUSE_DOWN";

/**
 * User released seek bar
 */
export const ON_SEEK_MOUSE_UP = "ON_SEEK_MOUSE_UP";

/**
 * User changed seek bar position
 */
export const ON_SEEK_CHANGE = "ON_SEEK_CHANGE";

/**
 * Set precise seek position
 */
export const SET_SEEK = "SET_SEEK";

// AUDIO CONTROL
/**
 * Toggle mute on/off
 */
export const TOGGLE_MUTED = "TOGGLE_MUTED";

/**
 * Change volume level
 */
export const ON_VOLUME_CHANGE = "ON_VOLUME_CHANGE";

/**
 * Set volume (alternative to ON_VOLUME_CHANGE)
 */
export const SET_VOLUME = "SET_VOLUME";

// SPEED CONTROL
/**
 * Set playback rate (speed)
 */
export const SET_PLAYBACK_RATE = "SET_PLAYBACK_RATE";

/**
 * Set playback multiplier
 */
export const SET_PLAYBACK_MULTIPLIER = "SET_PLAYBACK_MULTIPLIER";

/**
 * Change speed using preset indices
 */
export const CHANGE_SPEEDS_INDEX = "CHANGE_SPEEDS_INDEX";

// ============================================================================
// ACTION INTERFACES
// ============================================================================

/**
 * Update entire player state
 */
interface UpdatePlayerAction {
  type: typeof UPDATE_PLAYER_SESSION;
  payload: MediaPlayerState;
}

/**
 * Set media URL and timeline index
 */
interface SetURL {
  type: typeof SET_URL;
  payload: { blobURL: string; timelineIndex: number };
}

/**
 * Hard reset application state
 */
interface PlayHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

/**
 * Open new folder/project
 */
interface PlayOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { path: string; blobURL?: string };
}

/**
 * Toggle play/pause state
 * Payload: optional boolean to force play (true) or pause (false)
 */
interface TogglePlay {
  type: typeof TOGGLE_PLAY;
  payload?: boolean;
}

/**
 * Stop playback completely
 */
interface StopPlaying {
  type: typeof STOP_PLAYING;
}

/**
 * Toggle loop mode
 */
interface ToggleLoop {
  type: typeof TOGGLE_LOOP;
}

/**
 * ReactPlayer started playing
 */
interface OnPlay {
  type: typeof ON_PLAY;
}

/**
 * ReactPlayer paused
 */
interface OnPause {
  type: typeof ON_PAUSE;
}

/**
 * ReactPlayer reached end of media
 */
interface OnEnded {
  type: typeof ON_ENDED;
}

/**
 * ReactPlayer is ready for playback
 * Payload: whether player is ready
 */
interface OnReady {
  type: typeof ON_READY;
  payload: boolean;
}

/**
 * Set media duration
 * Payload: duration in seconds
 */
interface SetDuration {
  type: typeof SET_DURATION;
  payload: number;
}

/**
 * Update playback progress
 * Payload: progress state from ReactPlayer
 *   - played: fraction played (0.0 to 1.0)
 *   - loaded: fraction buffered (0.0 to 1.0)
 */
interface OnProgress {
  type: typeof ON_PROGRESS;
  payload: any;
}

/**
 * User started dragging seek bar
 */
interface OnSeekMouseDown {
  type: typeof ON_SEEK_MOUSE_DOWN;
}

/**
 * User released seek bar
 */
interface OnSeekMouseUp {
  type: typeof ON_SEEK_MOUSE_UP;
}

/**
 * User changed seek position
 * Payload: new position (0.0 to 1.0)
 */
interface OnSeekChange {
  type: typeof ON_SEEK_CHANGE;
  payload: number;
}

/**
 * Set precise seek position
 * Payload: { time, scale }
 */
interface SetSeek {
  type: typeof SET_SEEK;
  payload: { time: number; scale: "seconds" | "fraction" | undefined };
}

/**
 * Toggle mute state
 */
interface ToggleMuted {
  type: typeof TOGGLE_MUTED;
}

/**
 * Change volume level
 * Payload: volume (0.0 to 1.0)
 */
interface OnVolumeChange {
  type: typeof ON_VOLUME_CHANGE;
  payload: number;
}

/**
 * Set volume level
 * Payload: volume (0.0 to 1.0)
 */
interface SetVolume {
  type: typeof SET_VOLUME;
  payload: number;
}

/**
 * Set playback rate
 * Payload: speed multiplier
 */
interface SetPlaybackRate {
  type: typeof SET_PLAYBACK_RATE;
  payload: number;
}

/**
 * Set playback multiplier
 * Payload: additional speed multiplier
 */
interface SetPlaybackMultiplier {
  type: typeof SET_PLAYBACK_MULTIPLIER;
  payload: number;
}

/**
 * Change speed using preset indices
 * Payload: "+" to increase, "-" to decrease
 */
interface ChangeSpeedsIndex {
  type: typeof CHANGE_SPEEDS_INDEX;
  payload: string;
}

// ============================================================================
// ACTION UNION TYPE
// ============================================================================

/**
 * Union of all player action types
 *
 * This type ensures type safety across all player-related actions,
 * allowing TypeScript to infer the correct payload type based on
 * the action type in reducers and middleware.
 */
export type PlayerActionTypes =
  | UpdatePlayerAction
  | SetURL
  | PlayHardResetApp
  | PlayOnNewFolder
  | TogglePlay
  | StopPlaying
  | ToggleLoop
  | OnPlay
  | OnPause
  | OnEnded
  | OnReady
  | SetDuration
  | OnProgress
  | OnSeekMouseDown
  | OnSeekMouseUp
  | OnSeekChange
  | SetSeek
  | ToggleMuted
  | OnVolumeChange
  | SetVolume
  | SetPlaybackRate
  | SetPlaybackMultiplier
  | ChangeSpeedsIndex;
