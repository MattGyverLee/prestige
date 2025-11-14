/**
 * DeeJay File Functions
 *
 * This module provides utility functions for finding and validating audio files
 * in the DeeJay audio editor component. It handles:
 * - Finding valid source audio files (normalized MP3s from original WAV files)
 * - Finding valid annotation audio files (Careful and Translation merged voiceovers)
 * - Matching files against timeline sync media
 * - Checking if current files are part of the active timeline
 *
 * Audio File Types:
 * - Source Audio: Original audio from video/audio files, normalized to MP3
 *   - Format: "{filename}_StandardAudio_Normalized.mp3"
 *   - Example: "interview_StandardAudio_Normalized.mp3" (from "interview.wav")
 *
 * - Annotation Audio: Voiceover tracks created during annotation
 *   - Careful: French annotation audio (channel: "CarefulMerged")
 *   - Translation: English translation audio (channel: "TranslationMerged")
 *   - Format: "*_Careful_Merged.mp3" or "*_Translation_Merged.mp3"
 *
 * @module DeeJay/FileFunctions
 */

import { sourceAudio, annotAudio } from "../globalFunctions";
import { LooseObject } from "../../store/annot/types";
import store from "../../store/store";

// ============================================================================
// SYNC MEDIA RETRIEVAL
// ============================================================================

/**
 * Get sync media file paths from the current timeline
 *
 * Returns the array of sync media file paths (video and audio) associated
 * with the currently active timeline. Sync media represents the primary
 * source files for a timeline.
 *
 * @returns {string[]} Array of sync media file paths (file:// URLs), or empty array if no timeline selected
 *
 * @example
 * const syncMedia = getSyncMedia();
 * // Returns: ["file:///project/interview.mp4", "file:///project/interview.wav"]
 *
 * @example
 * // When no timeline is selected
 * const syncMedia = getSyncMedia();
 * // Returns: []
 */
export function getSyncMedia(): string[] {
  const state = store.getState();
  return state.annot.currentTimeline !== -1
    ? state.annot.timeline[state.annot.currentTimeline].syncMedia
    : [];
}

// ============================================================================
// AUDIO FILE DISCOVERY
// ============================================================================

/**
 * Find valid audio file for a given WaveSurfer track index
 *
 * This is the main entry point for finding audio files to load into
 * WaveSurfer instances in the DeeJay component.
 *
 * Track Index Mapping:
 * - idx = 0: Source audio (normalized MP3 from original video/audio)
 * - idx = 1: Careful annotation audio (French voiceover)
 * - idx = 2: Translation annotation audio (English voiceover)
 *
 * @param {number} idx - WaveSurfer track index (0 = source, 1 = careful, 2 = translation)
 * @returns {string} Blob URL of the audio file, or empty string if not found or multiple matches
 *
 * @example
 * // Find source audio for main WaveSurfer
 * const sourceAudioURL = findValidAudio(0);
 * if (sourceAudioURL) {
 *   wavesurfer.load(sourceAudioURL);
 * }
 *
 * @example
 * // Find Careful annotation audio
 * const carefulAudioURL = findValidAudio(1);
 * if (carefulAudioURL) {
 *   wavesurfer.load(carefulAudioURL);
 * }
 */
export function findValidAudio(idx: number): string {
  const audio: LooseObject[] =
    idx === 0 ? findValidSourceAudio() : findValidAnnotAudio(idx);
  return audio.length === 1 ? audio[0].blobURL : "";
}

/**
 * Find valid source audio files for the current timeline
 *
 * Searches for normalized MP3 files that:
 * 1. Have the "_StandardAudio_Normalized.mp3" suffix
 * 2. Match the WAV files referenced in the current timeline's sync media
 *
 * Matching Logic:
 * - Extract base filename from normalized MP3 (e.g., "interview_StandardAudio_Normalized.mp3")
 * - Reconstruct original WAV filename (e.g., "interview.wav")
 * - Check if this WAV file is in the timeline's sync media
 *
 * @returns {LooseObject[]} Array of matching source audio file objects (usually 0 or 1 results)
 *
 * @example
 * const sourceAudio = findValidSourceAudio();
 * // With timeline selected and matching file:
 * // Returns: [{
 * //   name: "interview_StandardAudio_Normalized.mp3",
 * //   blobURL: "blob:http://localhost/abc123",
 * //   path: "/project/interview_StandardAudio_Normalized.mp3",
 * //   ...
 * // }]
 *
 * @example
 * // No timeline selected - returns all normalized MP3s
 * const sourceAudio = findValidSourceAudio();
 * // Returns: [all files with "_StandardAudio_Normalized.mp3" suffix]
 */
export function findValidSourceAudio(): LooseObject[] {
  const state = store.getState();
  const allSourceAudio = sourceAudio(state.tree.sourceMedia, true);
  const syncMedia = getSyncMedia();

  const filtered = allSourceAudio.filter((sa: LooseObject) => {
    // Check the filename, not the blob URL (blob URLs are random UUIDs)
    const hasNormalized =
      sa.name && sa.name.includes("_StandardAudio_Normalized.mp3");

    // If no timeline is selected (syncMedia is empty), just return normalized MP3 files
    if (syncMedia.length === 0) {
      return hasNormalized;
    }

    // If timeline exists, check if the .wav file is in syncMedia
    // Extract base name from the filename
    // "interview_StandardAudio_Normalized.mp3" -> "interview.wav"
    const wavName =
      sa.name.substring(0, sa.name.indexOf("_Normalized.mp3")) + ".wav";

    // syncMedia contains file:// URLs, so we need to check if any URL ends with this filename
    const inSync = syncMedia.some((url: string) => {
      const urlFileName = decodeURIComponent(
        url.substring(url.lastIndexOf("/") + 1),
      );
      return urlFileName === wavName;
    });

    return hasNormalized && inSync;
  });

  return filtered;
}

/**
 * Find valid annotation audio files for a given track
 *
 * Searches for merged annotation audio files (Careful or Translation)
 * that match the specified track index.
 *
 * Channel Mapping:
 * - idx = 1: Careful_Merged.mp3 (French voiceover)
 * - idx = 2: Translation_Merged.mp3 (English voiceover)
 *
 * @param {number} idx - Track index (1 = Careful, 2 = Translation)
 * @returns {LooseObject[]} Array of matching annotation audio file objects
 *
 * @example
 * // Find Careful annotation audio
 * const carefulAudio = findValidAnnotAudio(1);
 * // Returns files with "Careful_Merged.mp3" in name
 *
 * @example
 * // Find Translation annotation audio
 * const translationAudio = findValidAnnotAudio(2);
 * // Returns files with "Translation_Merged.mp3" in name
 */
function findValidAnnotAudio(idx: number): LooseObject[] {
  const state = store.getState();

  // Calculate channel name: idx=1 -> "Careful_Merged.mp3", idx=2 -> "Translation_Merged.mp3"
  const channelName = (idx - 1 ? "Translation" : "Careful") + "_Merged.mp3";

  const allAnnot = annotAudio(
    state.tree.annotMedia,
    true,
    state.annot.currentTimeline,
    state.annot.timeline,
    state.tree.sourceMedia,
  );

  const filtered = allAnnot.filter(
    (aa: LooseObject) =>
      // Use filename instead of blob URL for matching
      aa.name && aa.name.includes(channelName),
  );

  return filtered;
}

// ============================================================================
// TIMELINE MEMBERSHIP CHECKING
// ============================================================================

/**
 * Check if a file is part of the current timeline's sync media
 *
 * Determines whether a given file (by blob URL) is referenced in the
 * currently active timeline's sync media. This is used to validate
 * if a file should be loaded in the DeeJay component.
 *
 * @param {string} currBlob - Blob URL of the file to check
 * @returns {boolean} True if file is in sync media, false otherwise
 *
 * @example
 * // Check if currently selected file is in timeline
 * if (syncContainsCurrent(selectedFile.blobURL)) {
 *   console.log("File is part of the active timeline");
 * } else {
 *   console.log("File is not in timeline - select a different file");
 * }
 *
 * @example
 * // When no timeline is selected
 * const result = syncContainsCurrent("blob:http://localhost/abc123");
 * // Returns: false (no timeline active)
 */
export function syncContainsCurrent(currBlob: string): boolean {
  const state = store.getState();
  const syncMedia = getSyncMedia();

  // If no timeline/sync media, return false
  if (syncMedia.length === 0) {
    return false;
  }

  // Find the file object by blobURL to get its name/path
  const sourceMedia = state.tree.sourceMedia;
  const fileObj = sourceMedia.find((f: LooseObject) => f.blobURL === currBlob);

  if (!fileObj || !fileObj.name) {
    return false;
  }

  // Check if any syncMedia URL matches this file's name
  return syncMedia.some((url: string) => {
    const urlFileName = decodeURIComponent(
      url.substring(url.lastIndexOf("/") + 1),
    );
    return urlFileName === fileObj.name;
  });
}
