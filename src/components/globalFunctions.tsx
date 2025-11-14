/**
 * Global Utility Functions
 *
 * This module provides shared utility functions used across the Prestige
 * application for:
 * - Timeline matching and lookup
 * - File path parsing (cross-platform, secure)
 * - Media file filtering and categorization
 * - Numerical precision (rounding)
 *
 * Key Features:
 * - Timeline-to-media file matching (by filename, path, or eafFile)
 * - Secure path parsing via Electron API
 * - Media file filtering (source vs annotation, video vs audio)
 * - Merged file detection and filtering
 *
 * @module globalFunctions
 */

import { LooseObject } from "../store/annot/types";
import { electronAPI } from "../utils/electronAPI";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Internal type for timeline matching operations
 */
interface tempTimeline {
  /** Sync media file paths for this timeline */
  syncMedia: string[];

  /** Timeline array index */
  idx: number;
}

// ============================================================================
// TIMELINE LOOKUP
// ============================================================================

/**
 * Find timeline index that references a given media file
 *
 * Searches through timelines to find which one references a specific media
 * file. Uses multiple matching strategies in order of preference:
 * 1. Filename matching (most reliable)
 * 2. Full path matching (handles absolute paths)
 * 3. Direct blob URL matching (backward compatibility)
 * 4. EAF file matching (fallback for annotations)
 *
 * This function handles URL encoding/decoding and file:// URL conversion.
 *
 * @param {any} timelines - Array of timeline objects from annotation store
 * @param {string} blobURL - Blob URL of the media file to match
 * @param {LooseObject[]} [sourceMedia] - Optional array of source media objects for filename lookup
 * @returns {number} Timeline array index, or -1 if not found
 *
 * @example
 * // Find timeline containing a specific video file
 * const timelineIdx = getTimelineIndex(
 *   state.annot.timeline,
 *   "blob:http://localhost/abc123",
 *   state.tree.sourceMedia
 * );
 * if (timelineIdx !== -1) {
 *   console.log(`File is in timeline ${timelineIdx}`);
 * }
 *
 * @example
 * // No match found
 * const idx = getTimelineIndex(timelines, "blob:invalid", sourceMedia);
 * // Returns: -1
 */
export function getTimelineIndex(
  timelines: any,
  blobURL: string,
  sourceMedia?: LooseObject[],
): number {
  // Validate inputs
  if (
    blobURL === undefined ||
    blobURL === null ||
    blobURL === "" ||
    timelines.length === 0
  ) {
    return -1;
  }

  // Find the file object matching this blobURL to get its original filename/path
  let fileName: string | null = null;
  let filePath: string | null = null;

  if (sourceMedia) {
    const fileObj = sourceMedia.find((f) => f.blobURL === blobURL);
    if (fileObj) {
      fileName = fileObj.name; // e.g., "audio.wav"
      filePath = fileObj.path; // e.g., "/home/user/project/audio.wav"
    }
  }

  // Create lookup array with timeline indices
  const temp = timelines.map((t: LooseObject, idx: number) => {
    const x: tempTimeline = { syncMedia: t.syncMedia, idx };
    return x;
  });

  // -------------------------------------------------------------------------
  // STRATEGY 1: Try matching by filename (most reliable)
  // -------------------------------------------------------------------------
  if (fileName) {
    for (let i = 0, l = temp.length; i < l; i++) {
      for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
        const syncMediaURL = temp[i].syncMedia[j];
        // Extract filename from file:// URL or path and decode URL encoding
        const syncMediaNameEncoded = syncMediaURL.substring(
          syncMediaURL.lastIndexOf("/") + 1,
        );
        const syncMediaName = decodeURIComponent(syncMediaNameEncoded);
        if (syncMediaName === fileName) {
          return temp[i].idx;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // STRATEGY 2: Try matching by full path
  // -------------------------------------------------------------------------
  if (filePath) {
    for (let i = 0, l = temp.length; i < l; i++) {
      for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
        const syncMediaURL = temp[i].syncMedia[j];
        // Convert file:// URL back to path for comparison and decode URL encoding
        let syncMediaPath = syncMediaURL.startsWith("file://")
          ? syncMediaURL.substring(7) // Remove "file://" prefix
          : syncMediaURL;
        // Decode URL-encoded characters
        syncMediaPath = decodeURIComponent(syncMediaPath);
        if (syncMediaPath === filePath) {
          return temp[i].idx;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // STRATEGY 3: Fallback - Try direct URL matching (backward compatibility)
  // -------------------------------------------------------------------------
  for (let i = 0, l = temp.length; i < l; i++) {
    for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
      if (temp[i].syncMedia[j] === blobURL) {
        return temp[i].idx;
      }
    }
  }

  // -------------------------------------------------------------------------
  // STRATEGY 4: Try matching by eafFile (annotation fallback)
  // -------------------------------------------------------------------------
  if (fileName) {
    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));
    for (let i = 0, l = timelines.length; i < l; i++) {
      if (timelines[i].eafFile.includes(fileNameWithoutExt)) {
        return i;
      }
    }
  }

  return -1;
}

// ============================================================================
// PATH PARSING (SECURE)
// ============================================================================

/**
 * Parse a file path in a safe, cross-platform way
 *
 * Uses the secure Electron API to parse file paths. This ensures correct
 * parsing on all platforms (Windows, macOS, Linux) without exposing Node.js
 * APIs to the renderer process.
 *
 * Returns an object with: `{ root, dir, base, ext, name }`
 *
 * @param {string} inPath - File path to parse
 * @returns {Promise<any>} Parsed path object
 *
 * @example
 * const parsed = await safeParse("/home/user/project/video.mp4");
 * // Returns: {
 * //   root: '/',
 * //   dir: '/home/user/project',
 * //   base: 'video.mp4',
 * //   ext: '.mp4',
 * //   name: 'video'
 * // }
 *
 * @example
 * // Windows path
 * const parsed = await safeParse("C:\\Users\\name\\video.mp4");
 * // Returns: {
 * //   root: 'C:\\',
 * //   dir: 'C:\\Users\\name',
 * //   base: 'video.mp4',
 * //   ext: '.mp4',
 * //   name: 'video'
 * // }
 */
export async function safeParse(inPath: string): Promise<any> {
  // Use the secure Electron API
  return await electronAPI.parsePath(inPath);
}

/**
 * Synchronous version of safeParse for backward compatibility
 *
 * **DEPRECATED**: This function is no longer truly synchronous and may cause issues.
 * Please migrate to the async `safeParse()` function.
 *
 * This is a temporary shim that caches path parse results to avoid async calls
 * in most cases, but falls back to a basic parser for uncached paths.
 *
 * @param {string} inPath - File path to parse
 * @returns {any} Parsed path object (cached or basic fallback)
 *
 * @deprecated Use async `safeParse()` instead
 *
 * @example
 * const parsed = safeParseSync("/home/user/video.mp4");
 * // Returns cached result or basic parse
 */
const pathParseCache = new Map<string, any>();

export function safeParseSync(inPath: string): any {
  // Check cache first
  if (pathParseCache.has(inPath)) {
    return pathParseCache.get(inPath);
  }

  // Fallback: Basic path parsing for browser context
  // This handles most common cases without requiring Node.js APIs
  const normalizedPath = inPath.replace(/\\/g, "/");
  const lastSlash = normalizedPath.lastIndexOf("/");
  const lastDot = normalizedPath.lastIndexOf(".");

  const dir = lastSlash >= 0 ? normalizedPath.substring(0, lastSlash) : "";
  const base =
    lastSlash >= 0 ? normalizedPath.substring(lastSlash + 1) : normalizedPath;
  const ext = lastDot > lastSlash ? normalizedPath.substring(lastDot) : "";
  const name =
    lastDot > lastSlash ? base.substring(0, base.length - ext.length) : base;

  const result = {
    root: normalizedPath.match(/^[a-zA-Z]:/)
      ? normalizedPath.substring(0, 2)
      : "",
    dir: dir,
    base: base,
    ext: ext,
    name: name,
  };

  // Cache the result
  pathParseCache.set(inPath, result);

  return result;
}

// ============================================================================
// MEDIA FILE FILTERING
// ============================================================================

/**
 * Get source media files (video and audio)
 *
 * Filters and sorts source media files, excluding:
 * - Annotation files (isAnnotation = true)
 * - Standard audio extracts ("_StandardAudio.mp3" files)
 * - Normalized MP3s ("_StandardAudio_Normalized.mp3" files)
 * - Duplicate WAV files when MP3 versions exist
 *
 * Returns video files followed by audio files, both sorted alphabetically.
 *
 * @param {LooseObject[]} sourceMedia - Array of source media file objects
 * @param {boolean} allOrViewer - True: return all files, False: filter for viewer
 * @returns {LooseObject[]} Filtered and sorted array of source media files
 *
 * @example
 * const media = getSourceMedia(state.tree.sourceMedia, true);
 * // Returns: [
 * //   { name: "interview.mp4", mimeType: "video/mp4", ... },
 * //   { name: "narration.wav", mimeType: "audio/wav", ... }
 * // ]
 */
export function getSourceMedia(
  sourceMedia: LooseObject[],
  allOrViewer: boolean,
): LooseObject[] {
  // Get video files
  const sourceVids = sourceMedia
    .filter((file) => !file.isAnnotation && file.mimeType.startsWith("video"))
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );

  const mp3s: string[] = [];

  // Get audio files, filtering out standard audio extracts
  const sourceAud = sourceAudio(sourceMedia, allOrViewer)
    .filter((sa: any) => {
      const parsedPath = safeParseSync(sa.path);
      if (parsedPath.ext.toLowerCase() === ".mp3") mp3s.push(parsedPath.name);

      // Filter out StandardAudio files that belong to videos
      for (let i = 0, l = sourceVids.length; i < l; i++) {
        if (
          parsedPath.name ===
          safeParseSync(sourceVids[i].path).name + "_StandardAudio"
        ) {
          return false;
        }
      }
      return !parsedPath.base.endsWith("_StandardAudio_Normalized.mp3");
    })
    .filter((sa: any) => {
      const parsedPath = safeParseSync(sa.path);
      // Filter out WAV files when MP3 version exists
      return !(
        mp3s.indexOf(parsedPath.name) !== -1 &&
        parsedPath.ext.toLowerCase() === ".wav"
      );
    });

  return [...sourceVids, ...sourceAud];
}

/**
 * Get source audio files only
 *
 * Filters source media to return only audio files (not videos).
 * Optionally excludes merged files based on the allOrViewer flag.
 *
 * @param {LooseObject[]} sourceMedia - Array of source media file objects
 * @param {boolean} allOrViewer - True: include merged, False: exclude merged
 * @returns {LooseObject[]} Filtered and sorted array of source audio files
 *
 * @example
 * const audioFiles = sourceAudio(state.tree.sourceMedia, true);
 * // Returns only audio files from sourceMedia
 */
export function sourceAudio(
  sourceMedia: LooseObject[],
  allOrViewer: boolean,
): LooseObject[] {
  const sourceAud = sourceMedia
    .filter(
      (file) =>
        !file.isAnnotation &&
        file.mimeType.startsWith("audio") &&
        (!file.isMerged || allOrViewer),
    )
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );
  return [...sourceAud];
}

/**
 * Get annotation audio files for a specific timeline
 *
 * Filters annotation media to return only audio files that belong to the
 * specified timeline. Optionally filters by split vs merged files.
 *
 * Matching Logic:
 * 1. Check if file is annotation audio and matches split/merged filter
 * 2. Extract base path (before "_Annotations" directory)
 * 3. Find corresponding source media file
 * 4. Verify source file belongs to the specified timeline
 *
 * @param {LooseObject[]} annotMedia - Array of annotation media file objects
 * @param {boolean} splitOrMerged - True: merged only, False: split only
 * @param {number} timelineIdx - Timeline index to match against
 * @param {any[]} timelines - Array of all timelines
 * @param {LooseObject[]} [sourceMedia] - Array of source media for timeline matching
 * @returns {LooseObject[]} Filtered and sorted array of annotation audio files
 *
 * @example
 * // Get merged annotation audio for timeline 0
 * const annotAudio = annotAudio(
 *   state.tree.annotMedia,
 *   true,  // merged only
 *   0,     // timeline index
 *   state.annot.timeline,
 *   state.tree.sourceMedia
 * );
 * // Returns: ["interview-Careful_Merged.mp3", "interview-Translation_Merged.mp3"]
 */
export function annotAudio(
  annotMedia: LooseObject[],
  splitOrMerged: boolean,
  timelineIdx: number,
  timelines: any[],
  sourceMedia?: LooseObject[],
): LooseObject[] {
  const annotAud = annotMedia
    .filter((file) => {
      if (
        !file.isAnnotation ||
        !file.mimeType.startsWith("audio") ||
        (splitOrMerged ? !file.isMerged : file.isMerged)
      ) {
        return false;
      }

      // Get the base path (before _Annotations directory)
      const basePath = file.path.substring(
        0,
        file.path.indexOf("_Annotations"),
      );

      // Find the source media file that has this base path
      const sourceFile = sourceMedia?.find(
        (s: LooseObject) => s.path === basePath,
      );

      if (!sourceFile) {
        return false;
      }

      // Use the source file's blobURL to match against timeline
      return (
        getTimelineIndex(timelines, sourceFile.blobURL, sourceMedia) ===
        timelineIdx
      );
    })
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );
  return [...annotAud];
}

/**
 * Sort helper function for alphabetical filename sorting
 *
 * @param {string} a - First filename
 * @param {string} b - Second filename
 * @returns {number} -1 if a < b, 1 if a > b, 0 if equal
 */
function sortName(a: string, b: string): number {
  if (a < b) return -1;
  else if (a > b) return 1;
  else return 0;
}

// ============================================================================
// NUMERICAL UTILITIES
// ============================================================================

/**
 * Round a number to a specific number of decimal places
 *
 * Uses exponential notation to avoid floating point precision errors.
 * This is more reliable than multiplication/division for decimal rounding.
 *
 * @param {number} value - Number to round
 * @param {number} decimals - Number of decimal places to keep
 * @returns {number} Rounded number
 *
 * @example
 * roundIt(3.14159, 2);
 * // Returns: 3.14
 *
 * @example
 * roundIt(1.005, 2);
 * // Returns: 1.01 (correctly handles .5 rounding)
 *
 * @example
 * roundIt(1234.5678, 0);
 * // Returns: 1235
 */
export function roundIt(value: number, decimals: number): number {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}
