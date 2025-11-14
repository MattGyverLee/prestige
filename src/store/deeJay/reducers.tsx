/**
 * DeeJay Redux Reducer
 *
 * This module contains the reducer and initial state for the DeeJay store,
 * which manages WaveSurfer playback coordination.
 *
 * The reducer handles:
 * - Volume adjustments for individual WaveSurfer instances
 * - Dispatch commands for synchronized playback
 * - Subtitle text updates
 * - State resets
 *
 * @module store/deeJay/reducers
 */

import * as types from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default volume configuration for WaveSurfer instances
 *
 * - volumes[0] = 1.0: Main video/audio track at full volume
 * - volumes[1] = 0.0: CarefulMerged voiceover muted by default
 * - volumes[2] = 0.0: TranslationMerged voiceover muted by default
 *
 * This configuration ensures only the primary track plays by default,
 * allowing users to selectively enable voiceovers.
 */
const DEFAULT_VOLUMES = [1, 0, 0];

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial clean state for the DeeJay store
 *
 * This represents a fresh, uninitialized state with:
 * - Default volume configuration (main track on, voiceovers muted)
 * - Empty dispatch command
 * - No subtitle text
 *
 * Used for:
 * - Initial application load
 * - Resetting state when opening a new folder
 * - Clearing state after video export
 */
export const deeJayCleanStore: types.DeeJayState = {
  /**
   * Volume levels for WaveSurfer instances
   * [main, careful, translation]
   */
  volumes: DEFAULT_VOLUMES,

  /**
   * Empty dispatch command (no active playback action)
   */
  dispatch: { dispatchType: "" },

  /**
   * No subtitle text displayed
   */
  subtitle: "",
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * DeeJay reducer function
 *
 * Handles all actions related to WaveSurfer playback coordination.
 * Maintains immutability by always returning a new state object.
 *
 * @param {DeeJayState} state - Current DeeJay state (defaults to clean store)
 * @param {DeeJayActionTypes} action - Action to process
 * @returns {DeeJayState} New state after applying the action
 */
export function deeJayReducer(
  state = deeJayCleanStore,
  action: types.DeeJayActionTypes,
): types.DeeJayState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // RESET: Clear all state back to initial values
    // -------------------------------------------------------------------------
    case types.RESET_DEE_JAY: {
      // Reset to clean store (all volumes reset, dispatch cleared, subtitle cleared)
      return {
        ...deeJayCleanStore,
      };
    }

    // -------------------------------------------------------------------------
    // SET VOLUME: Update volume for a specific WaveSurfer instance
    // -------------------------------------------------------------------------
    case types.SET_WS_VOLUME: {
      // Update only the volume at the specified index, leave others unchanged
      return {
        ...state,
        volumes: state.volumes.map((v: number, idx: number) =>
          idx === action.payload.idx ? action.payload.volume : v,
        ),
      };
    }

    // -------------------------------------------------------------------------
    // SET DISPATCH: Update the dispatch command for playback coordination
    // -------------------------------------------------------------------------
    case types.SET_DISPATCH: {
      // Replace the dispatch command with the new one
      return {
        ...state,
        dispatch: action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // SET SUBTITLE: Update the subtitle text to display
    // -------------------------------------------------------------------------
    case types.SET_SUBTITLE: {
      // Update subtitle text
      return {
        ...state,
        subtitle: action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // DEFAULT: Return unchanged state for unknown actions
    // -------------------------------------------------------------------------
    default: {
      return state;
    }
  }
}
