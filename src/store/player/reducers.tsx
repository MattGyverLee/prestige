/**
 * Player Redux Reducer
 *
 * This module contains the reducer and initial state for the media player store,
 * which manages ReactPlayer state including playback controls, seeking, volume,
 * and speed.
 *
 * The reducer handles:
 * - Media loading and URL changes
 * - Playback state transitions (play, pause, stop, loop)
 * - Progress tracking and seeking
 * - Volume and mute controls
 * - Playback speed adjustments with preset speeds
 *
 * @module store/player/reducers
 */

import * as types from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Preset playback speed multipliers
 *
 * These values correspond to speedsIndex in the player state:
 * - Index 0: 0.2x (very slow)
 * - Index 1: 0.33x (slow)
 * - Index 2: 0.5x (half speed)
 * - Index 3: 0.66x (two-thirds speed)
 * - Index 4: 0.8x (slightly slow)
 * - Index 5: 1.0x (normal speed) - DEFAULT
 * - Index 6: 1.25x (slightly fast)
 * - Index 7: 1.5x (1.5x speed)
 * - Index 8: 2.0x (double speed)
 * - Index 9: 3.0x (triple speed)
 * - Index 10: 5.0x (very fast)
 *
 * Used by CHANGE_SPEEDS_INDEX action to cycle through preset speeds.
 */
export const speeds: number[] = [
  0.2, 0.33, 0.5, 0.66, 0.8, 1, 1.25, 1.5, 2, 3, 5,
];

/**
 * Minimum allowed playback rate
 */
const MIN_PLAYBACK_RATE = 0.2;

/**
 * Maximum allowed playback rate
 */
const MAX_PLAYBACK_RATE = 14.5;

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial clean state for the media player
 *
 * This represents a fresh, uninitialized player state with sensible defaults:
 * - No media loaded (empty URL)
 * - Stopped (not playing)
 * - Muted by default for user-friendly autoplay
 * - Volume at 80% when unmuted
 * - Normal speed (1.0x)
 * - No looping
 *
 * Used for:
 * - Initial application load
 * - Resetting state when opening a new folder
 * - Hard app reset
 */
export const playerCleanStore: types.MediaPlayerState = {
  /**
   * Custom player controls disabled (handled by custom UI)
   */
  controls: false,

  /**
   * Duration starts at 0 (no media loaded)
   */
  duration: 0,

  /**
   * No media buffered yet
   */
  loaded: 0,

  /**
   * Loop disabled by default
   */
  loop: false,

  /**
   * Muted by default to allow autoplay (browser autoplay policies)
   */
  muted: true,

  /**
   * Normal playback rate (1.0x speed)
   */
  playbackRate: 1.0,

  /**
   * No additional speed multiplier
   */
  playbackMultiplier: 1.0,

  /**
   * Playback position at start (0%)
   */
  played: 0,

  /**
   * Not playing initially
   */
  playing: false,

  /**
   * Player not ready until media loads
   */
  ready: false,

  /**
   * No pending seek operation (-1 signals no seek)
   */
  seek: { time: -1, scale: "fraction" },

  /**
   * User not currently seeking
   */
  seeking: false,

  /**
   * Default speed index 5 = 1.0x normal speed
   */
  speedsIndex: 5,

  /**
   * No media URL loaded
   */
  url: "",

  /**
   * Volume at 80% (when unmuted)
   */
  volume: 0.8,
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Player reducer function
 *
 * Handles all actions related to media playback state management.
 * Maintains immutability by always returning a new state object.
 *
 * @param {MediaPlayerState} state - Current player state (defaults to clean store)
 * @param {PlayerActionTypes} action - Action to process
 * @returns {MediaPlayerState} New state after applying the action
 */
export function playerReducer(
  state = playerCleanStore,
  action: types.PlayerActionTypes,
): types.MediaPlayerState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // STATE MANAGEMENT
    // -------------------------------------------------------------------------

    case types.HARD_RESET_APP: {
      // Complete reset to initial clean state
      return playerCleanStore;
    }

    case types.ON_NEW_FOLDER: {
      // Reset player state when opening a new folder
      // If a blobURL is provided, preload it; otherwise start fresh
      if (action.payload.blobURL !== undefined) {
        return {
          ...playerCleanStore,
          url: action.payload.blobURL,
        };
      }
      return playerCleanStore;
    }

    case types.UPDATE_PLAYER_SESSION: {
      // Bulk update player state
      // Note: May be deprecated in future - prefer specific actions
      return {
        ...state,
        ...action.payload,
      };
    }

    case types.SET_URL: {
      // Load new media URL and reset player to clean state
      // Preserves only the new URL, resets everything else
      return {
        ...playerCleanStore,
        url: action.payload.blobURL,
      };
    }

    // -------------------------------------------------------------------------
    // PLAYBACK CONTROL
    // -------------------------------------------------------------------------

    case types.TOGGLE_PLAY: {
      // Toggle play/pause or force specific state
      // If payload provided, use it; otherwise toggle current state
      return {
        ...state,
        playing: action.payload !== undefined ? action.payload : !state.playing,
      };
    }

    case types.STOP_PLAYING: {
      // Stop playback completely and unload media
      // Sets URL to "none" to signal media should be unloaded
      return {
        ...state,
        playing: false,
        url: "none",
      };
    }

    case types.TOGGLE_LOOP: {
      // Toggle loop mode on/off
      return {
        ...state,
        loop: !state.loop,
      };
    }

    case types.ON_PLAY: {
      // ReactPlayer onPlay callback fired
      // Note: Playing state already managed by TOGGLE_PLAY
      // This action exists for potential future use or logging
      return {
        ...state,
      };
    }

    case types.ON_PAUSE: {
      // ReactPlayer onPause callback fired
      // Note: Playing state already managed by TOGGLE_PLAY
      // This action exists for potential future use or logging
      return {
        ...state,
      };
    }

    case types.ON_ENDED: {
      // Video reached end - continue playing only if loop enabled
      return {
        ...state,
        playing: state.loop,
      };
    }

    // -------------------------------------------------------------------------
    // PROGRESS TRACKING
    // -------------------------------------------------------------------------

    case types.ON_READY: {
      // Media loaded and ready for playback
      return {
        ...state,
        ready: action.payload,
      };
    }

    case types.ON_PROGRESS: {
      // Update playback progress from ReactPlayer
      // IMPORTANT: Ignore progress updates while user is seeking
      // to prevent seek bar from jumping around during drag
      if (!state.seeking && action.payload !== undefined) {
        return {
          ...state,
          ...action.payload,
        };
      } else {
        return state;
      }
    }

    case types.SET_DURATION: {
      // Set total media duration in seconds
      return {
        ...state,
        duration: action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // SEEKING
    // -------------------------------------------------------------------------

    case types.ON_SEEK_MOUSE_DOWN: {
      // User started dragging seek bar
      // Set seeking flag to prevent progress updates during drag
      return {
        ...state,
        seeking: true,
      };
    }

    case types.ON_SEEK_MOUSE_UP: {
      // User released seek bar
      // Clear seeking flag to resume progress updates
      return {
        ...state,
        seeking: false,
      };
    }

    case types.ON_SEEK_CHANGE: {
      // Update played position while dragging seek bar
      // This updates the visual position without actually seeking yet
      return {
        ...state,
        played: action.payload,
      };
    }

    case types.SET_SEEK: {
      // Set precise seek target for ReactPlayer to jump to
      return {
        ...state,
        seek: action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // AUDIO CONTROL
    // -------------------------------------------------------------------------

    case types.TOGGLE_MUTED: {
      // Toggle mute on/off
      // Volume level is preserved when muted
      return {
        ...state,
        muted: !state.muted,
      };
    }

    case types.ON_VOLUME_CHANGE: {
      // Update volume level (0.0 to 1.0)
      return {
        ...state,
        volume: action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // SPEED CONTROL
    // -------------------------------------------------------------------------

    case types.SET_PLAYBACK_RATE: {
      // Set playback speed with clamping to valid range
      // Clamp between MIN (0.2x) and MAX (14.5x) to prevent extreme speeds
      return {
        ...state,
        playbackRate:
          action.payload >= MAX_PLAYBACK_RATE + 0.5
            ? MAX_PLAYBACK_RATE
            : action.payload <= MIN_PLAYBACK_RATE
              ? MIN_PLAYBACK_RATE
              : action.payload,
      };
    }

    case types.SET_PLAYBACK_MULTIPLIER: {
      // Set additional speed multiplier for fine-grained control
      return {
        ...state,
        playbackMultiplier: action.payload,
      };
    }

    case types.CHANGE_SPEEDS_INDEX: {
      // Cycle through preset speeds using + or - direction
      const idx =
        action.payload === "+" ? state.speedsIndex + 1 : state.speedsIndex - 1;
      return {
        ...state,
        speedsIndex: idx,
        playbackMultiplier: speeds[idx],
      };
    }

    // -------------------------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------------------------

    default: {
      return state;
    }
  }
}
