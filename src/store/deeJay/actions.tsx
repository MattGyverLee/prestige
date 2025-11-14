/**
 * DeeJay Redux Action Creators
 *
 * This module provides action creators for managing the DeeJay (DJ) store,
 * which coordinates playback across multiple WaveSurfer instances.
 *
 * Key responsibilities:
 * - Volume control for individual WaveSurfer instances
 * - Dispatch commands for synchronized playback
 * - Subtitle text management
 *
 * @module store/deeJay/actions
 */

import * as types from "./types";

// ============================================================================
// STATE RESET
// ============================================================================

/**
 * Reset DeeJay state to initial clean state
 *
 * Use this action when you need to clear all DeeJay state, such as:
 * - Opening a new folder/project
 * - Resetting the application
 * - Clearing playback state after export
 *
 * This will:
 * - Reset all volumes to default ([1, 0, 0])
 * - Clear the dispatch command
 * - Clear subtitle text
 *
 * @returns {DeeJayActionTypes} Reset action
 *
 * @example
 * // Reset DeeJay state when opening a new folder
 * dispatch(resetDeeJay());
 */
export function resetDeeJay(): types.DeeJayActionTypes {
  return {
    type: types.RESET_DEE_JAY,
  };
}

// ============================================================================
// VOLUME CONTROL
// ============================================================================

/**
 * Set volume for a specific WaveSurfer instance
 *
 * Adjusts the volume level of a single WaveSurfer instance without affecting
 * others. Volume levels range from 0.0 (muted) to 1.0 (full volume).
 *
 * Typical instance indices:
 * - 0: Main video/audio track
 * - 1: CarefulMerged voiceover track
 * - 2: TranslationMerged voiceover track
 *
 * @param {number} idx - Index of the WaveSurfer instance (0, 1, 2, ...)
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {DeeJayActionTypes} Volume change action
 *
 * @example
 * // Mute the main track
 * dispatch(setWSVolume(0, 0));
 *
 * @example
 * // Set CarefulMerged voiceover to half volume
 * dispatch(setWSVolume(1, 0.5));
 *
 * @example
 * // Set TranslationMerged voiceover to full volume
 * dispatch(setWSVolume(2, 1.0));
 */
export function setWSVolume(
  idx: number,
  volume: number,
): types.DeeJayActionTypes {
  return {
    type: types.SET_WS_VOLUME,
    payload: { idx, volume },
  };
}

// ============================================================================
// PLAYBACK COORDINATION
// ============================================================================

/**
 * Set dispatch command for coordinating WaveSurfer playback
 *
 * Dispatches a command that WaveSurfer instances will respond to, enabling
 * synchronized playback control across multiple audio/video tracks.
 *
 * Common dispatch types:
 * - "play": Start playback
 * - "pause": Pause playback
 * - "seek": Jump to a time position
 * - "region": Play a specific clip/region
 * - "loop": Enable looping
 *
 * @param {DeeJayDispatch} type - Dispatch command configuration
 * @returns {DeeJayActionTypes} Dispatch action
 *
 * @example
 * // Play all WaveSurfer instances
 * dispatch(setDispatch({ dispatchType: "play" }));
 *
 * @example
 * // Play a specific clip on WaveSurfer instance 1
 * dispatch(setDispatch({
 *   dispatchType: "region",
 *   wsNum: 1,
 *   clipStart: 5.0,
 *   clipStop: 10.0,
 *   refStart: 0,
 *   refStop: 5.0
 * }));
 *
 * @example
 * // Loop a region 3 times
 * dispatch(setDispatch({
 *   dispatchType: "loop",
 *   wsNum: 1,
 *   clipStart: 5.0,
 *   clipStop: 10.0,
 *   loop: 3
 * }));
 */
export function setDispatch(
  type: types.DeeJayDispatch,
): types.DeeJayActionTypes {
  return {
    type: types.SET_DISPATCH,
    payload: type,
  };
}

// ============================================================================
// SUBTITLE MANAGEMENT
// ============================================================================

/**
 * Set subtitle text to display
 *
 * Updates the subtitle text shown to the user, typically synchronized with
 * the current playback position. Subtitles can contain transcription text,
 * translation text, or annotation metadata.
 *
 * @param {string} subtitle - Subtitle text to display
 * @returns {DeeJayActionTypes} Subtitle update action
 *
 * @example
 * // Display transcription text
 * dispatch(setSubtitle("Bonjour, comment allez-vous?"));
 *
 * @example
 * // Clear subtitle text
 * dispatch(setSubtitle(""));
 *
 * @example
 * // Display translation
 * dispatch(setSubtitle("Hello, how are you?"));
 */
export function setSubtitle(subtitle: string): types.DeeJayActionTypes {
  return {
    type: types.SET_SUBTITLE,
    payload: subtitle,
  };
}
