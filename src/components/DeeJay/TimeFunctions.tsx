/**
 * DeeJay Time Functions
 *
 * This module provides utility functions for time calculations and playback
 * rate adjustments in the DeeJay audio editor component. These functions
 * enable synchronized playback between multiple WaveSurfer tracks at different
 * speeds.
 *
 * Key Concepts:
 * - **Playback Rate**: Speed multiplier for audio playback (1.0 = normal speed)
 * - **Relative Time**: Normalized time position (0.0 to 1.0) for seeking
 * - **Clip Time**: Start or stop time of a milestone or voiceover clip
 * - **Time Synchronization**: Matching playback positions across tracks
 *
 * Playback Rate Constraints:
 * - Minimum: 0.2x (5 times slower)
 * - Maximum: 14.5x (almost 15 times faster)
 * - These limits prevent audio distortion and UI issues
 *
 * @module DeeJay/TimeFunctions
 */

import { DeeJayDispatch } from "../../store/deeJay/types";
import { roundIt } from "../globalFunctions";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum allowed playback rate (14.5x speed)
 * Prevents excessive speedup that could cause audio distortion or UI issues
 */
const MAX_PLAYBACK_RATE = 14.5;

/**
 * Minimum allowed playback rate (0.2x speed, or 5 times slower)
 * Prevents excessive slowdown that could make playback impractical
 */
const MIN_PLAYBACK_RATE = 0.2;

// ============================================================================
// TIME EXTRACTION
// ============================================================================

/**
 * Get clip start or stop time from a milestone based on track index
 *
 * Extracts the appropriate time value depending on:
 * - Which WaveSurfer track (idx)
 * - Whether we want start or stop time (startOrStop)
 *
 * Track Index Mapping:
 * - idx = 0: Use milestone.startTime or milestone.stopTime
 * - idx ≠ 0: Use milestone.data[0].clipStart or milestone.data[0].clipStop
 *
 * @param {number} idx - WaveSurfer track index (0 = source, 1+ = annotation)
 * @param {any} milestone - Milestone object with time data
 * @param {boolean} startOrStop - True for start time, false for stop time
 * @returns {number} The requested time in seconds
 *
 * @example
 * // Get source track start time
 * const startTime = clipTime(0, milestone, true);
 * // Returns: milestone.startTime (e.g., 5.0)
 *
 * @example
 * // Get annotation track stop time
 * const stopTime = clipTime(1, milestone, false);
 * // Returns: milestone.data[0].clipStop (e.g., 7.5)
 *
 * @example
 * // Get source track duration
 * const duration = clipTime(0, milestone, false) - clipTime(0, milestone, true);
 * // Returns: milestone.stopTime - milestone.startTime
 */
export function clipTime(
  idx: number,
  milestone: any,
  startOrStop: boolean,
): number {
  return idx === 0
    ? startOrStop
      ? milestone.startTime
      : milestone.stopTime
    : startOrStop
      ? milestone.data[0].clipStart
      : milestone.data[0].clipStop;
}

// ============================================================================
// PLAYBACK RATE CALCULATION
// ============================================================================

/**
 * Calculate playback rate to synchronize source video with annotation audio
 *
 * Computes the playback speed multiplier needed to make the source video
 * duration match the annotation audio duration. This enables synchronized
 * playback when voiceovers are longer or shorter than the original clip.
 *
 * Formula:
 * ```
 * playbackRate = sourceVideoDuration / annotationAudioDuration
 * ```
 *
 * The result is clamped between MIN_PLAYBACK_RATE (0.2) and MAX_PLAYBACK_RATE (14.5).
 *
 * Dispatch Parameters:
 * - dispatch: Contains annotation audio clip times (primary timing source)
 * - dispatch2: Contains source video clip times (secondary timing source)
 *
 * @param {any} milestone - Milestone object with default time ranges
 * @param {DeeJayDispatch} [dispatch] - Optional dispatch with annotation clip times
 * @param {DeeJayDispatch} [dispatch2] - Optional dispatch with source video clip times
 * @returns {number} Playback rate multiplier (clamped to [0.2, 14.5])
 *
 * @example
 * // Basic usage with milestone only
 * const rate = calcPlaybackRate(milestone);
 * // If source is 10s and annotation is 8s:
 * // Returns: 1.25 (10 / 8 = 1.25x speed)
 *
 * @example
 * // Using dispatches for precise timing
 * const dispatch = { clipStart: 2.0, clipStop: 5.0 }; // 3s annotation
 * const dispatch2 = { clipStart: 0.0, clipStop: 6.0 }; // 6s source video
 * const rate = calcPlaybackRate(milestone, dispatch, dispatch2);
 * // Returns: 2.0 (6 / 3 = 2x speed)
 *
 * @example
 * // Extreme case: Very fast required rate
 * const rate = calcPlaybackRate(milestoneWithLongVideo);
 * // If calculated rate would be 20x:
 * // Returns: 14.5 (clamped to maximum)
 *
 * @example
 * // Extreme case: Very slow required rate
 * const rate = calcPlaybackRate(milestoneWithShortVideo);
 * // If calculated rate would be 0.1x:
 * // Returns: 0.2 (clamped to minimum)
 */
export function calcPlaybackRate(
  milestone: any,
  dispatch?: DeeJayDispatch,
  dispatch2?: DeeJayDispatch,
): number {
  // Calculate source video duration (numerator)
  const sourceVideoDuration =
    (dispatch2 ? dispatch2.clipStop : milestone.stopTime) -
    (dispatch2 ? dispatch2.clipStart : milestone.startTime);

  // Calculate annotation audio duration (denominator)
  const annotationAudioDuration =
    (dispatch ? dispatch.clipStop : milestone.data[0].clipStop) -
    (dispatch ? dispatch.clipStart : milestone.data[0].clipStart);

  // Calculate raw playback rate
  const playbackRate = sourceVideoDuration / annotationAudioDuration;

  // Clamp to valid range
  return playbackRate >= MAX_PLAYBACK_RATE
    ? MAX_PLAYBACK_RATE
    : playbackRate <= MIN_PLAYBACK_RATE
      ? MIN_PLAYBACK_RATE
      : playbackRate;
}

// ============================================================================
// RELATIVE TIME CALCULATION
// ============================================================================

/**
 * Calculate relative time position for synchronized seeking
 *
 * Converts a current time position in one track to a normalized relative
 * time (0.0 to 1.0) that accounts for different clip durations and playback
 * rates. This enables seeking to the same "relative position" across tracks.
 *
 * Formula:
 * ```
 * relativeTime = ((currTime1 - clipStart1) * playbackRate + clipStart2) / duration
 * ```
 *
 * Use Cases:
 * - Synchronizing seek operations across WaveSurfer instances
 * - Converting time from annotation track to source track
 * - Converting time from source track to annotation track
 *
 * @param {number} currTime1 - Current time in the source track (seconds)
 * @param {number} clipStart1 - Start time of the source clip (seconds)
 * @param {number} duration - Total duration of the target track (seconds)
 * @param {number} playbackRate - Playback rate multiplier
 * @param {number} clipStart2 - Start time of the target clip (seconds)
 * @returns {number} Relative time position (0.0 to 1.0), rounded to 3 decimal places
 *
 * @example
 * // Convert annotation time to source video relative time
 * const currAnnotTime = 2.5;  // 2.5 seconds into annotation
 * const annotStart = 2.0;     // Annotation starts at 2.0s
 * const sourceStart = 0.0;    // Source starts at 0.0s
 * const videoDuration = 10.0; // Video is 10 seconds long
 * const playbackRate = 2.0;   // Video plays at 2x speed
 *
 * const relativeTime = calcRelativeTime(
 *   currAnnotTime,
 *   annotStart,
 *   videoDuration,
 *   playbackRate,
 *   sourceStart
 * );
 * // Calculation: ((2.5 - 2.0) * 2.0 + 0.0) / 10.0 = 0.1
 * // Returns: 0.1 (10% through the video)
 *
 * @example
 * // Seeking from source to annotation
 * const currSourceTime = 5.0;
 * const sourceStart = 0.0;
 * const annotDuration = 8.0;
 * const playbackRate = 0.5; // Annotation is slower
 * const annotStart = 2.0;
 *
 * const relativeTime = calcRelativeTime(
 *   currSourceTime,
 *   sourceStart,
 *   annotDuration,
 *   playbackRate,
 *   annotStart
 * );
 * // Calculation: ((5.0 - 0.0) * 0.5 + 2.0) / 8.0 = 4.5 / 8.0 = 0.562
 * // Returns: 0.562 (56.2% through the annotation)
 */
export function calcRelativeTime(
  currTime1: number,
  clipStart1: number,
  duration: number,
  playbackRate: number,
  clipStart2: number,
): number {
  return roundIt(
    ((currTime1 - clipStart1) * playbackRate + clipStart2) / duration,
    3,
  );
}
