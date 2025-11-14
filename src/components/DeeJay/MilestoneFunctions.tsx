/**
 * DeeJay Milestone Functions
 *
 * This module provides utility functions for finding and navigating milestones
 * in the DeeJay audio editor component. Milestones represent segments of the
 * timeline with synchronized audio tracks.
 *
 * Key Concepts:
 * - **Milestone**: A time segment in the timeline with start/stop times
 * - **Milestone Data**: Voiceover tracks (Careful, Translation) within a milestone
 * - **WaveSurfer Track (wsNum)**:
 *   - 0: Source video/audio track
 *   - 1: Careful annotation track (typically French)
 *   - 2: Translation track (typically English)
 *
 * Milestone Data Channels:
 * - "CarefulMerged": French annotation audio
 * - "TranslationMerged": English translation audio
 * - "Transcription": Text transcription of source audio
 * - "Translation": Text translation of transcription
 *
 * @module DeeJay/MilestoneFunctions
 */

import { LooseObject, Milestone } from "../../store/annot/types";
import store from "../../store/store";
import { DeeJayDispatch } from "../../store/deeJay/types";

// ============================================================================
// MILESTONE QUERYING
// ============================================================================

/**
 * Get the milestone containing a specific time point
 *
 * Finds the milestone whose time range (startTime to stopTime) contains
 * the given time. Optionally filters milestone data to include only
 * a specific channel (Careful or Translation).
 *
 * @param {number} time - Time point in seconds to search for
 * @param {number} [wsNum] - Optional WaveSurfer track number to filter data
 *   - 0: Include all data (no filtering)
 *   - 1: Include only CarefulMerged data
 *   - 2: Include only TranslationMerged data
 *   - undefined: Include all data
 * @returns {Milestone | -1} The matching milestone with filtered data, or -1 if not found
 *
 * @example
 * // Find milestone at 5.5 seconds, include all data
 * const milestone = getInterMilestone(5.5);
 * // Returns: {
 * //   annotationID: "a1",
 * //   startTime: 5.0,
 * //   stopTime: 8.0,
 * //   data: [{ channel: "CarefulMerged", ... }, { channel: "TranslationMerged", ... }]
 * // }
 *
 * @example
 * // Find milestone at 5.5 seconds, only Careful data
 * const milestone = getInterMilestone(5.5, 1);
 * // Returns: {
 * //   annotationID: "a1",
 * //   startTime: 5.0,
 * //   stopTime: 8.0,
 * //   data: [{ channel: "CarefulMerged", ... }]  // Only CarefulMerged
 * // }
 */
export function getInterMilestone(
  time: number,
  wsNum?: number,
): Milestone | -1 {
  const state = store.getState();

  if (state.annot.currentTimeline === -1) {
    return -1;
  }

  const milestones =
    state.annot.timeline[state.annot.currentTimeline].milestones;

  // Find milestone containing the time
  const matchingMilestones = milestones
    .filter((m: Milestone) => {
      return m.startTime <= time && time < m.stopTime;
    })
    .map((m: Milestone) => {
      // Filter data based on wsNum
      const channel = wsNum === 1 ? "CarefulMerged" : "TranslationMerged";

      return {
        ...m,
        data: m.data.filter(
          (d: LooseObject) =>
            wsNum === 0 || wsNum === undefined || d.channel === channel,
        ),
      };
    });

  return matchingMilestones[0] || -1;
}

// ============================================================================
// MILESTONE INDEX FINDING
// ============================================================================

/**
 * Find the array index of a milestone by its start time
 *
 * Searches the current timeline's milestone array for a milestone
 * with a matching start time. This is used for navigation between
 * milestones.
 *
 * @param {Milestone} milestone - Milestone object to find
 * @returns {number} Array index of the milestone, or -1 if not found
 *
 * @example
 * const currentMilestone = getInterMilestone(5.5);
 * const index = findNextMilestoneIndex(currentMilestone);
 * // Returns: 0 (if this is the first milestone with startTime matching)
 *
 * @example
 * // Navigate to next milestone
 * const currentIndex = findNextMilestoneIndex(currentMilestone);
 * const nextMilestone = timeline.milestones[currentIndex + 1];
 */
export function findNextMilestoneIndex(milestone: Milestone): number {
  const state = store.getState();

  return state.annot.currentTimeline === -1
    ? -1
    : state.annot.timeline[state.annot.currentTimeline].milestones.findIndex(
        (m: Milestone) => m.startTime === milestone.startTime,
      );
}

/**
 * Find the index of the last milestone containing data for a specific track
 *
 * For source track (wsNum=0), returns the index of the very last milestone.
 * For annotation tracks (wsNum=1 or 2), returns the index of the last milestone
 * that contains data for that specific channel.
 *
 * This is useful for "skip to end" navigation or determining the last valid
 * position for a particular audio track.
 *
 * @param {number} wsNum - WaveSurfer track number (0=source, 1=Careful, 2=Translation)
 * @returns {number} Index of the last milestone with data, or -1 if no timeline
 *
 * @example
 * // Find last milestone for source track
 * const lastSourceIndex = findLastMilestoneIndex(0);
 * // Returns: 9 (if there are 10 milestones total)
 *
 * @example
 * // Find last milestone with Careful data
 * const lastCarefulIndex = findLastMilestoneIndex(1);
 * // Returns: 7 (if milestones 0-7 have Careful data, but 8-9 don't)
 */
export function findLastMilestoneIndex(wsNum: number): number {
  const state = store.getState();
  if (state.annot.currentTimeline === -1) return -1;

  const milestones =
    state.annot.timeline[state.annot.currentTimeline].milestones;

  // For source track, return the last milestone index
  if (wsNum === 0) {
    return milestones.length - 1;
  }

  // For annotation tracks, find the last milestone with data for this channel
  const channel = `${wsNum === 1 ? "Careful" : "Translation"}Merged`;

  return milestones
    .map((m: Milestone, idx: number) => {
      // Check if this milestone has data for the specified channel
      const hasChannelData =
        m.data.findIndex((d: LooseObject) => d.channel === channel) !== -1;
      return hasChannelData ? idx : 0;
    })
    .reduce((a: number, b: number) => (a > b ? a : b), 0);
}

// ============================================================================
// CURRENT MILESTONE RETRIEVAL
// ============================================================================

/**
 * Get the current milestone for a specific track at a given time
 *
 * This is the main function for determining which milestone is currently
 * active for a WaveSurfer track. It supports two modes:
 * 1. Time-based: Find milestone containing the current playback time
 * 2. Dispatch-based: Find milestone matching specific clip times from dispatch
 *
 * The dispatch mode is used when synchronizing playback between multiple
 * WaveSurfer instances.
 *
 * @param {number} wsNum - WaveSurfer track number (0=source, 1=Careful, 2=Translation)
 * @param {number} currTime - Current playback time in seconds
 * @param {DeeJayDispatch} [dispatch] - Optional dispatch with clip times for matching
 * @param {number} [filter] - Optional filter override (defaults to wsNum)
 * @returns {Milestone | -1} The current milestone with filtered data, or -1 if not found
 *
 * @example
 * // Get current milestone for source track at 5.5 seconds
 * const milestone = getCurrentMilestone(0, 5.5);
 * // Returns milestone containing time 5.5
 *
 * @example
 * // Get current milestone using dispatch (for synchronized playback)
 * const dispatch = { dispatchType: "SEEK", clipStart: 2.0, clipStop: 5.0 };
 * const milestone = getCurrentMilestone(1, 0, dispatch);
 * // Returns milestone with Careful data matching clipStart=2.0 and clipStop=5.0
 *
 * @example
 * // Get current milestone for Careful track, but include Translation data
 * const milestone = getCurrentMilestone(1, 5.5, undefined, 2);
 * // Returns milestone for Careful track, filtered to show Translation data
 */
export function getCurrentMilestone(
  wsNum: number,
  currTime: number,
  dispatch: DeeJayDispatch = { dispatchType: "" },
  filter?: number,
): Milestone | -1 {
  const state = store.getState();

  if (!filter) filter = wsNum;
  if (state.annot.currentTimeline === -1) return -1;

  const channel = `${filter === 1 ? "Careful" : "Translation"}Merged`;

  const matchingMilestones = state.annot.timeline[
    state.annot.currentTimeline
  ].milestones
    .filter((m: Milestone) => {
      // For source track (wsNum=0)
      if (wsNum === 0) {
        if (dispatch.dispatchType !== "") {
          // Dispatch mode: Match by clip times
          return (
            m.startTime === dispatch.clipStart &&
            m.stopTime === dispatch.clipStop
          );
        } else {
          // Time mode: Check if time is within milestone range
          return m.startTime <= currTime && currTime < m.stopTime;
        }
      }

      // For annotation tracks (wsNum=1 or 2)
      return (
        m.data.filter((d: LooseObject) => {
          if (d.channel !== channel) return false;

          if (dispatch.dispatchType !== "") {
            // Dispatch mode: Match by clip times
            return (
              d.clipStart === dispatch.clipStart &&
              d.clipStop === dispatch.clipStop
            );
          } else {
            // Time mode: Check if time is within clip range
            return (
              d.clipStart !== undefined &&
              d.clipStop !== undefined &&
              d.clipStart <= currTime &&
              currTime < d.clipStop
            );
          }
        }).length === 1
      );
    })
    .map((m: Milestone) => {
      return {
        ...m,
        data: m.data.filter(
          (d: LooseObject) =>
            (filter === 0 && wsNum === 0) || d.channel === channel,
        ),
      };
    });

  return matchingMilestones[0] || -1;
}

/**
 * Get the first milestone for a specific track
 *
 * Returns the first milestone in the timeline, with data filtered
 * to the specified channel. This is used for "skip to start" navigation.
 *
 * @param {number} wsNum - WaveSurfer track number (0=source, 1=Careful, 2=Translation)
 * @param {number} [filter] - Optional filter override (defaults to wsNum)
 * @returns {Milestone | -1} The first milestone with filtered data, or -1 if no timeline
 *
 * @example
 * // Get first milestone for source track
 * const firstMilestone = getFirstMilestone(0);
 * // Returns: { startTime: 0, stopTime: 3.5, data: [...], ... }
 *
 * @example
 * // Get first milestone for Careful track
 * const firstCareful = getFirstMilestone(1);
 * // Returns first milestone with Careful data filtered
 */
export function getFirstMilestone(
  wsNum: number,
  filter?: number,
): Milestone | -1 {
  const state = store.getState();

  if (!filter) filter = wsNum;
  if (state.annot.currentTimeline === -1) return -1;

  const channel = `${filter === 1 ? "Careful" : "Translation"}Merged`;

  const milestones =
    state.annot.timeline[state.annot.currentTimeline].milestones;

  if (milestones.length === 0) return -1;

  return {
    ...milestones[0],
    data: milestones[0].data.filter(
      (d: LooseObject) =>
        (filter === 0 && wsNum === 0) || d.channel === channel,
    ),
  };
}

// ============================================================================
// SUBTITLE RETRIEVAL
// ============================================================================

/**
 * Get subtitle text for a specific annotation
 *
 * Retrieves transcription or translation text for a milestone identified
 * by its annotation ID. Used for displaying subtitles during playback.
 *
 * @param {string} targetAnnotationID - Annotation ID of the milestone (e.g., "a1", "a2")
 * @param {number} mode - Subtitle mode (0 or 1 = Transcription, 2+ = Translation)
 * @returns {string} Subtitle text, or empty string if not found or marked as "%ignore%"
 *
 * @example
 * // Get transcription subtitle for annotation "a5"
 * const transcription = getSubtitle("a5", 0);
 * // Returns: "Bonjour, comment allez-vous?"
 *
 * @example
 * // Get translation subtitle for annotation "a5"
 * const translation = getSubtitle("a5", 2);
 * // Returns: "Hello, how are you?"
 *
 * @example
 * // Subtitle marked as ignored
 * const ignored = getSubtitle("a7", 0);
 * // Returns: "" (empty string if data is "%ignore%")
 */
export function getSubtitle(targetAnnotationID: string, mode: number): string {
  const state = store.getState();
  if (state.annot.currentTimeline === -1) return "";

  let result = "";

  // Find milestone with matching annotation ID
  const milestones =
    state.annot.timeline[state.annot.currentTimeline].milestones;
  const matchingMilestones = milestones.filter((m: Milestone) => {
    return m.annotationID === targetAnnotationID;
  });

  if (matchingMilestones.length === 0) return "";

  const ms = matchingMilestones[0];

  // Get transcription or translation based on mode
  if (mode <= 1) {
    // Transcription mode
    if (ms.data[0] && ms.data[0].channel === "Transcription") {
      result = ms.data[0].data;
    }
  } else {
    // Translation mode
    if (ms.data[1] && ms.data[1].channel === "Translation") {
      result = ms.data[1].data;
    }
  }

  // Filter out null, undefined, or "%ignore%" markers
  if (result === undefined || result === null || result === "%ignore%") {
    result = "";
  }

  return result;
}
