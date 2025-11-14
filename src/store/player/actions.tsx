/**
 * Player Redux Action Creators
 *
 * This module provides action creators for the media player store, which manages
 * ReactPlayer state including playback controls, seeking, volume, and speed.
 *
 * Action groups:
 * - State Management: Update player state, URL changes
 * - Playback Control: Play, pause, stop, loop
 * - Progress Tracking: Progress updates, duration, ready state
 * - Seeking: Mouse events and seek position updates
 * - Audio Control: Volume and mute toggles
 * - Speed Control: Playback rate and speed presets
 *
 * @module store/player/actions
 */

import * as types from "./types";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Update entire player state
 *
 * Merges a new player state object with the current state. This is useful
 * for bulk updates or restoring saved player sessions.
 *
 * Note: This action may be deprecated in future versions. Prefer using
 * specific action creators for targeted state updates.
 *
 * @param {MediaPlayerState} newPlayerState - New player state to merge
 * @returns {PlayerActionTypes} Update player session action
 *
 * @example
 * // Restore saved player session
 * dispatch(updatePlayerAction({
 *   ...playerCleanStore,
 *   playing: true,
 *   volume: 0.7,
 *   playbackRate: 1.5
 * }));
 */
export function updatePlayerAction(
  newPlayerState: types.MediaPlayerState,
): types.PlayerActionTypes {
  return {
    type: types.UPDATE_PLAYER_SESSION,
    payload: newPlayerState,
  };
}

/**
 * Set media URL and timeline index
 *
 * Loads a new media file for playback. This resets most player state to defaults
 * (stopped, unready, etc.) while loading the new URL.
 *
 * @param {string} blobURL - Blob URL or file path to the media file
 * @param {number} timelineIndex - Index of the timeline being loaded
 * @returns {PlayerActionTypes} Set URL action
 *
 * @example
 * // Load a video file
 * dispatch(setURL('blob:http://localhost/video.mp4', 0));
 *
 * @example
 * // Load the third timeline
 * dispatch(setURL('file:///path/to/video.mp4', 2));
 */
export function setURL(
  blobURL: string,
  timelineIndex: number,
): types.PlayerActionTypes {
  return {
    type: types.SET_URL,
    payload: { blobURL, timelineIndex },
  };
}

// ============================================================================
// PLAYBACK CONTROL
// ============================================================================

/**
 * Toggle play/pause state
 *
 * Toggles between playing and paused states. Can optionally force a specific
 * state (true = play, false = pause).
 *
 * @param {boolean} [playPause] - Optional: force play (true) or pause (false)
 * @returns {PlayerActionTypes} Toggle play action
 *
 * @example
 * // Toggle between play and pause
 * dispatch(togglePlay());
 *
 * @example
 * // Force play
 * dispatch(togglePlay(true));
 *
 * @example
 * // Force pause
 * dispatch(togglePlay(false));
 */
export function togglePlay(playPause?: boolean): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_PLAY,
    payload: playPause,
  };
}

/**
 * Stop playback completely
 *
 * Stops playback and clears the current media URL. This is different from
 * pause in that it fully unloads the media.
 *
 * @returns {PlayerActionTypes} Stop playing action
 *
 * @example
 * // Stop playback and unload media
 * dispatch(stopPlaying());
 */
export function stopPlaying(): types.PlayerActionTypes {
  return {
    type: types.STOP_PLAYING,
  };
}

/**
 * Toggle loop mode
 *
 * Enables or disables looping. When enabled, the video will restart from
 * the beginning when it reaches the end.
 *
 * @returns {PlayerActionTypes} Toggle loop action
 *
 * @example
 * // Toggle loop on/off
 * dispatch(toggleLoop());
 */
export function toggleLoop(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_LOOP,
  };
}

/**
 * Handle play event from ReactPlayer
 *
 * Called when ReactPlayer starts playing. This is a callback action
 * triggered by the player component itself.
 *
 * @returns {PlayerActionTypes} On play action
 *
 * @example
 * // In ReactPlayer onPlay callback
 * <ReactPlayer onPlay={() => dispatch(onPlay())} />
 */
export function onPlay(): types.PlayerActionTypes {
  return {
    type: types.ON_PLAY,
  };
}

/**
 * Handle pause event from ReactPlayer
 *
 * Called when ReactPlayer pauses. This is a callback action
 * triggered by the player component itself.
 *
 * @returns {PlayerActionTypes} On pause action
 *
 * @example
 * // In ReactPlayer onPause callback
 * <ReactPlayer onPause={() => dispatch(onPause())} />
 */
export function onPause(): types.PlayerActionTypes {
  return {
    type: types.ON_PAUSE,
  };
}

/**
 * Handle ended event from ReactPlayer
 *
 * Called when the video reaches the end. If loop mode is enabled,
 * playback will continue automatically.
 *
 * @returns {PlayerActionTypes} On ended action
 *
 * @example
 * // In ReactPlayer onEnded callback
 * <ReactPlayer onEnded={() => dispatch(onEnded())} />
 */
export function onEnded(): types.PlayerActionTypes {
  return {
    type: types.ON_ENDED,
  };
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Handle ready event from ReactPlayer
 *
 * Called when the media is loaded and ready to play. Use this to know
 * when you can safely start playback or seek.
 *
 * @param {boolean} ready - Whether the player is ready
 * @returns {PlayerActionTypes} On ready action
 *
 * @example
 * // In ReactPlayer onReady callback
 * <ReactPlayer onReady={() => dispatch(onReady(true))} />
 */
export function onReady(ready: boolean): types.PlayerActionTypes {
  return {
    type: types.ON_READY,
    payload: ready,
  };
}

/**
 * Set media duration
 *
 * Sets the total duration of the loaded media in seconds.
 * Usually called from ReactPlayer's onDuration callback.
 *
 * @param {number} duration - Total duration in seconds
 * @returns {PlayerActionTypes} Set duration action
 *
 * @example
 * // In ReactPlayer onDuration callback
 * <ReactPlayer onDuration={(duration) => dispatch(setDuration(duration))} />
 */
export function setDuration(duration: number): types.PlayerActionTypes {
  return {
    type: types.SET_DURATION,
    payload: duration,
  };
}

/**
 * Handle progress update from ReactPlayer
 *
 * Called continuously during playback to update played/loaded progress.
 * Updates are ignored while the user is seeking.
 *
 * @param {any} playState - Progress state object from ReactPlayer
 *   - played: Fraction of video played (0.0 to 1.0)
 *   - loaded: Fraction of video buffered (0.0 to 1.0)
 * @returns {PlayerActionTypes} On progress action
 *
 * @example
 * // In ReactPlayer onProgress callback
 * <ReactPlayer onProgress={(state) => dispatch(onProgress(state))} />
 */
export function onProgress(playState: any): types.PlayerActionTypes {
  return {
    type: types.ON_PROGRESS,
    payload: playState,
  };
}

// ============================================================================
// SEEKING
// ============================================================================

/**
 * Handle seek mouse down event
 *
 * Called when the user starts dragging the seek bar. Sets seeking state
 * to true, which prevents progress updates from interfering with the seek.
 *
 * @returns {PlayerActionTypes} Seek mouse down action
 *
 * @example
 * // In seek bar onMouseDown handler
 * <input onMouseDown={() => dispatch(onSeekMouseDown())} />
 */
export function onSeekMouseDown(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_DOWN,
  };
}

/**
 * Handle seek mouse up event
 *
 * Called when the user releases the seek bar. Sets seeking state to false,
 * allowing progress updates to resume.
 *
 * @returns {PlayerActionTypes} Seek mouse up action
 *
 * @example
 * // In seek bar onMouseUp handler
 * <input onMouseUp={() => dispatch(onSeekMouseUp())} />
 */
export function onSeekMouseUp(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_UP,
  };
}

/**
 * Handle seek position change
 *
 * Updates the played position while the user is dragging the seek bar.
 * This updates the visual position without actually seeking the player yet.
 *
 * @param {number} time - New playback position (0.0 to 1.0 fraction)
 * @returns {PlayerActionTypes} Seek change action
 *
 * @example
 * // In seek bar onChange handler
 * <input onChange={(e) => dispatch(onSeekChange(parseFloat(e.target.value)))} />
 */
export function onSeekChange(time: number): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_CHANGE,
    payload: time,
  };
}

/**
 * Set precise seek position
 *
 * Sets a seek target with a specific time and scale. This tells ReactPlayer
 * to jump to a specific position.
 *
 * @param {number} inTime - Time value to seek to
 * @param {"seconds" | "fraction" | undefined} inScale - Time scale
 *   - "seconds": Absolute time in seconds
 *   - "fraction": Relative position (0.0 to 1.0)
 *   - undefined: Let player determine scale
 * @returns {PlayerActionTypes} Set seek action
 *
 * @example
 * // Seek to 30 seconds
 * dispatch(setSeek(30, "seconds"));
 *
 * @example
 * // Seek to halfway point
 * dispatch(setSeek(0.5, "fraction"));
 */
export function setSeek(
  inTime: number,
  inScale: "seconds" | "fraction" | undefined,
): types.PlayerActionTypes {
  return {
    type: types.SET_SEEK,
    payload: { time: inTime, scale: inScale },
  };
}

// ============================================================================
// AUDIO CONTROL
// ============================================================================

/**
 * Toggle mute state
 *
 * Toggles between muted and unmuted audio. When muted, volume is set to 0
 * but the previous volume level is preserved.
 *
 * @returns {PlayerActionTypes} Toggle muted action
 *
 * @example
 * // Toggle mute on/off
 * dispatch(toggleMuted());
 */
export function toggleMuted(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_MUTED,
  };
}

/**
 * Handle volume change
 *
 * Updates the player volume level. Volume ranges from 0.0 (silent) to 1.0 (full).
 *
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {PlayerActionTypes} Volume change action
 *
 * @example
 * // Set volume to half
 * dispatch(onVolumeChange(0.5));
 *
 * @example
 * // Set volume to full
 * dispatch(onVolumeChange(1.0));
 */
export function onVolumeChange(volume: number): types.PlayerActionTypes {
  return {
    type: types.ON_VOLUME_CHANGE,
    payload: volume,
  };
}

// ============================================================================
// SPEED CONTROL
// ============================================================================

/**
 * Set playback rate (speed)
 *
 * Sets the playback speed multiplier. Values are clamped between 0.2x and 14.5x.
 *
 * Common speeds:
 * - 0.5x: Half speed
 * - 1.0x: Normal speed
 * - 1.5x: 1.5x speed
 * - 2.0x: Double speed
 *
 * @param {number} speed - Playback speed multiplier
 * @returns {PlayerActionTypes} Set playback rate action
 *
 * @example
 * // Play at double speed
 * dispatch(setPlaybackRate(2.0));
 *
 * @example
 * // Play at half speed
 * dispatch(setPlaybackRate(0.5));
 */
export function setPlaybackRate(speed: number): types.PlayerActionTypes {
  return {
    type: types.SET_PLAYBACK_RATE,
    payload: speed,
  };
}

/**
 * Set playback multiplier
 *
 * Sets an additional speed multiplier that works in combination with
 * playback rate. Used for fine-grained speed control.
 *
 * @param {number} multiplier - Speed multiplier
 * @returns {PlayerActionTypes} Set playback multiplier action
 *
 * @example
 * // Apply 1.5x multiplier
 * dispatch(setPlaybackMultiplier(1.5));
 */
export function setPlaybackMultiplier(
  multiplier: number,
): types.PlayerActionTypes {
  return {
    type: types.SET_PLAYBACK_MULTIPLIER,
    payload: multiplier,
  };
}

/**
 * Change speed using preset indices
 *
 * Increments or decrements the speed preset index. The speeds array
 * contains preset values: [0.2, 0.33, 0.5, 0.66, 0.8, 1, 1.25, 1.5, 2, 3, 5]
 *
 * Default index is 5 (1.0x normal speed).
 *
 * @param {string} manner - Direction to change: "+" to increase, "-" to decrease
 * @returns {PlayerActionTypes} Change speeds index action
 *
 * @example
 * // Increase speed to next preset
 * dispatch(changeSpeedsIndex("+"));
 *
 * @example
 * // Decrease speed to previous preset
 * dispatch(changeSpeedsIndex("-"));
 */
export function changeSpeedsIndex(manner: string): types.PlayerActionTypes {
  return {
    type: types.CHANGE_SPEEDS_INDEX,
    payload: manner,
  };
}
