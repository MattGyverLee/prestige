/**
 * Video Export Library - FFmpeg Video Processing Utilities
 *
 * This module provides pure, testable functions for building FFmpeg commands
 * to process and export video clips with complex audio configurations.
 *
 * Key Features:
 * - Speed adjustment for video and audio tracks
 * - Multi-track audio mixing (up to 2 audio sources per clip)
 * - Volume control for each audio track
 * - FFmpeg filter chain generation
 * - Clip validation and duration calculations
 *
 * @module video-export-lib
 */

import path from 'path';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * FFmpeg's atempo filter only supports speeds between 0.5x and 2.0x.
 * For speeds outside this range, we must stack multiple filters.
 */
const ATEMPO_MIN_SPEED = 0.5;
const ATEMPO_MAX_SPEED = 2.0;

// ============================================================================
// FFmpeg FILTER GENERATION
// ============================================================================

/**
 * Build a complete FFmpeg filter complex string for a video clip
 *
 * This function generates the FFmpeg filter chain that:
 * 1. Adjusts video playback speed using setpts
 * 2. Adjusts audio playback speed using atempo filters
 * 3. Applies volume adjustments to audio tracks
 * 4. Mixes multiple audio tracks if needed
 *
 * @param {Object} clip - Clip configuration object
 * @param {string} clip.V1 - Video source file path
 * @param {number} clip.V1Speed - Video playback speed multiplier (e.g., 2.0 for 2x speed)
 * @param {string} clip.A1 - Primary audio source file path
 * @param {number} clip.A1Speed - Primary audio playback speed multiplier
 * @param {number} clip.A1Vol - Primary audio volume (0.0 to 1.0)
 * @param {boolean} clip.isA2 - Whether secondary audio track is present
 * @param {string} [clip.A2] - Secondary audio source file path (if isA2 is true)
 * @param {number} [clip.A2Speed] - Secondary audio playback speed multiplier
 * @param {number} [clip.A2Vol] - Secondary audio volume (0.0 to 1.0)
 * @param {boolean} hasA2 - Whether the clip has a secondary audio track
 *
 * @returns {string} Complete FFmpeg filter complex string
 *
 * @example
 * const clip = {
 *   V1Speed: 2.0,
 *   A1Speed: 1.5,
 *   A1Vol: 0.8,
 *   isA2: true,
 *   A2Speed: 2.0,
 *   A2Vol: 0.3
 * };
 * const filterString = buildFilterComplex(clip, true);
 * // Returns: "[0:v]setpts=0.5*PTS[v];[1:a]atempo=1.5,volume=0.8[a1];[2:a]atempo=2,volume=0.3[a2];[a1][a2]amix=inputs=2:duration=longest[a]"
 */
function buildFilterComplex(clip, hasA2 = false) {
  const filters = [];

  // -------------------------------------------------------------------------
  // VIDEO FILTER: Adjust playback speed using setpts
  // -------------------------------------------------------------------------
  // setpts adjusts timestamps. To speed up video by 2x, we multiply PTS by 0.5
  // Formula: setpts = (1 / speed) * PTS
  if (clip.V1Speed && clip.V1Speed !== 1) {
    const ptsMultiplier = 1 / clip.V1Speed;
    filters.push(`[0:v]setpts=${ptsMultiplier}*PTS[v]`);
  } else {
    // No speed adjustment needed, pass through video with null filter
    filters.push(`[0:v]null[v]`);
  }

  // -------------------------------------------------------------------------
  // PRIMARY AUDIO (A1) FILTER: Speed and volume adjustments
  // -------------------------------------------------------------------------
  let primaryAudioFilter = '[1:a]';
  const a1FiltersList = [];

  // Apply tempo adjustment if speed is not 1x
  if (clip.A1Speed && clip.A1Speed !== 1) {
    const tempoFilters = buildTempoFilters(clip.A1Speed);
    a1FiltersList.push(...tempoFilters);
  }

  // Apply volume adjustment if volume is not 1.0 (100%)
  if (clip.A1Vol !== undefined && clip.A1Vol !== 1) {
    a1FiltersList.push(`volume=${clip.A1Vol}`);
  }

  // If no filters needed, use anull to pass through
  if (a1FiltersList.length === 0) {
    a1FiltersList.push('anull');
  }

  primaryAudioFilter += a1FiltersList.join(',');
  primaryAudioFilter += '[a1]';
  filters.push(primaryAudioFilter);

  // -------------------------------------------------------------------------
  // SECONDARY AUDIO (A2) FILTER: Speed and volume adjustments
  // -------------------------------------------------------------------------
  if (hasA2 && clip.A2) {
    let secondaryAudioFilter = '[2:a]';
    const a2FiltersList = [];

    // Apply tempo adjustment if speed is not 1x
    if (clip.A2Speed && clip.A2Speed !== 1) {
      const tempoFilters = buildTempoFilters(clip.A2Speed);
      a2FiltersList.push(...tempoFilters);
    }

    // Apply volume adjustment if volume is not 1.0 (100%)
    if (clip.A2Vol !== undefined && clip.A2Vol !== 1) {
      a2FiltersList.push(`volume=${clip.A2Vol}`);
    }

    // If no filters needed, use anull to pass through
    if (a2FiltersList.length === 0) {
      a2FiltersList.push('anull');
    }

    secondaryAudioFilter += a2FiltersList.join(',');
    secondaryAudioFilter += '[a2]';
    filters.push(secondaryAudioFilter);

    // Mix primary and secondary audio tracks
    filters.push('[a1][a2]amix=inputs=2:duration=longest[a]');
  } else {
    // No secondary audio, pass through primary audio with anull filter
    filters.push('[a1]anull[a]');
  }

  return filters.join(';');
}

/**
 * Build array of atempo filters for a given playback speed
 *
 * FFmpeg's atempo filter only supports speed values between 0.5x and 2.0x.
 * For speeds outside this range, we must chain multiple atempo filters.
 *
 * Examples:
 * - 1.0x speed → ['atempo=1']
 * - 2.0x speed → ['atempo=2']
 * - 4.0x speed → ['atempo=2.0', 'atempo=2']  (2.0 * 2.0 = 4.0)
 * - 8.0x speed → ['atempo=2.0', 'atempo=2.0', 'atempo=2'] (2.0 * 2.0 * 2.0 = 8.0)
 * - 0.5x speed → ['atempo=0.5']
 * - 0.25x speed → ['atempo=0.5', 'atempo=0.5'] (0.5 * 0.5 = 0.25)
 * - 3.0x speed → ['atempo=2.0', 'atempo=1.5'] (2.0 * 1.5 = 3.0)
 *
 * @param {number} speed - Desired playback speed multiplier
 * @returns {string[]} Array of atempo filter strings to chain together
 *
 * @example
 * buildTempoFilters(4.0);
 * // Returns: ['atempo=2.0', 'atempo=2']
 *
 * buildTempoFilters(0.25);
 * // Returns: ['atempo=0.5', 'atempo=0.5']
 */
function buildTempoFilters(speed) {
  const tempoFilters = [];
  let remainingSpeed = speed;

  // Handle speeds faster than 2x by stacking 2.0x filters
  while (remainingSpeed > ATEMPO_MAX_SPEED) {
    tempoFilters.push('atempo=2.0');
    remainingSpeed = remainingSpeed / 2;
  }

  // Handle speeds slower than 0.5x by stacking 0.5x filters
  while (remainingSpeed < ATEMPO_MIN_SPEED && remainingSpeed > 0) {
    tempoFilters.push('atempo=0.5');
    remainingSpeed = remainingSpeed / 0.5;
  }

  // Add final tempo filter if remaining speed is within valid range
  if (remainingSpeed >= ATEMPO_MIN_SPEED && remainingSpeed <= ATEMPO_MAX_SPEED) {
    tempoFilters.push(`atempo=${remainingSpeed}`);
  }

  return tempoFilters;
}

// ============================================================================
// CLIP VALIDATION
// ============================================================================

/**
 * Validate a video clip configuration object
 *
 * Checks that all required fields are present and values are valid:
 * - Video source (V1) must be specified
 * - Audio source (A1) must be specified
 * - Start/stop times must be present and valid (stop > start)
 * - Speed values must be positive
 * - If secondary audio is enabled (isA2=true), A2 fields must be present
 *
 * @param {Object} clip - Clip configuration to validate
 * @param {string} clip.V1 - Video source file path
 * @param {number} clip.V1Start - Video start time in seconds
 * @param {number} clip.V1Stop - Video stop time in seconds
 * @param {number} clip.V1Speed - Video playback speed
 * @param {string} clip.A1 - Primary audio source file path
 * @param {number} [clip.A1Start] - Primary audio start time in seconds
 * @param {number} [clip.A1Stop] - Primary audio stop time in seconds
 * @param {number} [clip.A1Speed] - Primary audio playback speed
 * @param {boolean} [clip.isA2] - Whether secondary audio is present
 * @param {string} [clip.A2] - Secondary audio source file path
 * @param {number} [clip.A2Start] - Secondary audio start time in seconds
 * @param {number} [clip.A2Stop] - Secondary audio stop time in seconds
 *
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *   - valid: true if all validations pass, false otherwise
 *   - errors: array of error messages (empty if valid=true)
 *
 * @example
 * const clip = {
 *   V1: '/path/to/video.mp4',
 *   V1Start: 0,
 *   V1Stop: 10,
 *   V1Speed: 1.5,
 *   A1: '/path/to/audio.wav'
 * };
 * const result = validateClip(clip);
 * // Returns: { valid: true, errors: [] }
 *
 * @example
 * const invalidClip = {
 *   V1Start: 10,
 *   V1Stop: 5,  // Invalid: stop before start
 *   V1Speed: -1.5  // Invalid: negative speed
 * };
 * const result = validateClip(invalidClip);
 * // Returns: {
 * //   valid: false,
 * //   errors: [
 * //     'Missing V1 (video source)',
 * //     'Missing A1 (audio source)',
 * //     'V1Stop must be greater than V1Start',
 * //     'V1Speed must be greater than 0'
 * //   ]
 * // }
 */
function validateClip(clip) {
  const errors = [];

  // -------------------------------------------------------------------------
  // Validate required fields
  // -------------------------------------------------------------------------
  if (!clip.V1) {
    errors.push('Missing V1 (video source)');
  }

  if (!clip.A1) {
    errors.push('Missing A1 (audio source)');
  }

  if (clip.V1Start === undefined) {
    errors.push('Missing V1Start');
  }

  if (clip.V1Stop === undefined) {
    errors.push('Missing V1Stop');
  }

  if (clip.V1Speed === undefined) {
    errors.push('Missing V1Speed');
  }

  // -------------------------------------------------------------------------
  // Validate time ranges (stop must be after start)
  // -------------------------------------------------------------------------
  if (clip.V1Start !== undefined && clip.V1Stop !== undefined) {
    if (clip.V1Stop <= clip.V1Start) {
      errors.push('V1Stop must be greater than V1Start');
    }
  }

  if (clip.A1Start !== undefined && clip.A1Stop !== undefined) {
    if (clip.A1Stop <= clip.A1Start) {
      errors.push('A1Stop must be greater than A1Start');
    }
  }

  // -------------------------------------------------------------------------
  // Validate speed values (must be positive)
  // -------------------------------------------------------------------------
  if (clip.V1Speed !== undefined && clip.V1Speed <= 0) {
    errors.push('V1Speed must be greater than 0');
  }

  if (clip.A1Speed !== undefined && clip.A1Speed <= 0) {
    errors.push('A1Speed must be greater than 0');
  }

  // -------------------------------------------------------------------------
  // Validate secondary audio (A2) if enabled
  // -------------------------------------------------------------------------
  if (clip.isA2) {
    if (!clip.A2) {
      errors.push('isA2 is true but A2 is missing');
    }

    if (clip.A2Start === undefined) {
      errors.push('isA2 is true but A2Start is missing');
    }

    if (clip.A2Stop === undefined) {
      errors.push('isA2 is true but A2Stop is missing');
    }

    if (clip.A2Start !== undefined && clip.A2Stop !== undefined) {
      if (clip.A2Stop <= clip.A2Start) {
        errors.push('A2Stop must be greater than A2Start');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// DURATION CALCULATIONS
// ============================================================================

/**
 * Calculate total expected output duration for an array of clips
 *
 * When video is sped up or slowed down, the output duration changes:
 * - 2x speed: 10 second clip becomes 5 seconds
 * - 0.5x speed: 10 second clip becomes 20 seconds
 *
 * Formula: output_duration = (stop - start) / speed
 *
 * @param {Object[]} clips - Array of clip configuration objects
 * @param {number} clips[].V1Start - Video start time in seconds
 * @param {number} clips[].V1Stop - Video stop time in seconds
 * @param {number} clips[].V1Speed - Video playback speed multiplier
 *
 * @returns {number} Total duration in seconds for all clips combined
 *
 * @example
 * const clips = [
 *   { V1Start: 0, V1Stop: 10, V1Speed: 1.0 },   // 10 seconds at 1x = 10 sec output
 *   { V1Start: 10, V1Stop: 20, V1Speed: 2.0 },  // 10 seconds at 2x = 5 sec output
 *   { V1Start: 20, V1Stop: 30, V1Speed: 0.5 }   // 10 seconds at 0.5x = 20 sec output
 * ];
 * const totalDuration = calculateTotalDuration(clips);
 * // Returns: 35 (10 + 5 + 20)
 */
function calculateTotalDuration(clips) {
  return clips.reduce((totalDuration, clip) => {
    const sourceVideoDuration = clip.V1Stop - clip.V1Start;
    const outputVideoDuration = sourceVideoDuration / clip.V1Speed;
    return totalDuration + outputVideoDuration;
  }, 0);
}

// ============================================================================
// FILE PATH UTILITIES
// ============================================================================

/**
 * Generate a unique temporary directory path for video export
 *
 * Creates a timestamped directory name to avoid collisions when
 * multiple exports run concurrently.
 *
 * @param {string} tempPath - Base temporary directory path
 * @returns {string} Full path to unique temporary export directory
 *
 * @example
 * getTempExportDir('/tmp');
 * // Returns: '/tmp/prestige-export-1699564231847'
 *
 * getTempExportDir('/var/tmp');
 * // Returns: '/var/tmp/prestige-export-1699564231847'
 */
function getTempExportDir(tempPath) {
  const timestamp = Date.now();
  const uniqueDirName = `prestige-export-${timestamp}`;
  return path.join(tempPath, uniqueDirName);
}

/**
 * Generate FFmpeg concat file content from array of clip file paths
 *
 * FFmpeg's concat demuxer requires a text file listing all video files
 * to concatenate, with each file path wrapped in single quotes.
 *
 * Format:
 * ```
 * file '/path/to/clip1.mp4'
 * file '/path/to/clip2.mp4'
 * file '/path/to/clip3.mp4'
 * ```
 *
 * @param {string[]} clipFiles - Array of clip file paths to concatenate
 * @returns {string} Concat file content with newline-separated file entries
 *
 * @example
 * const clipFiles = [
 *   '/tmp/export/clip_0.mp4',
 *   '/tmp/export/clip_1.mp4',
 *   '/tmp/export/clip_2.mp4'
 * ];
 * const content = generateConcatFileContent(clipFiles);
 * // Returns:
 * // "file '/tmp/export/clip_0.mp4'\nfile '/tmp/export/clip_1.mp4'\nfile '/tmp/export/clip_2.mp4'"
 */
function generateConcatFileContent(clipFiles) {
  return clipFiles
    .map(filePath => `file '${filePath}'`)
    .join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  buildFilterComplex,
  buildTempoFilters,
  validateClip,
  calculateTotalDuration,
  getTempExportDir,
  generateConcatFileContent
};
