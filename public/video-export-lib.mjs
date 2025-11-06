/**
 * Video Export Library - Testable Functions
 *
 * This module contains pure/testable functions for video export logic.
 * Separated from IPC handlers for unit testing.
 */

import path from 'path';

/**
 * Build FFmpeg filter complex string for a video clip
 * @param {object} clip - Clip configuration
 * @param {boolean} hasA2 - Whether clip has secondary audio
 * @returns {string} Filter complex string
 */
function buildFilterComplex(clip, hasA2 = false) {
  const filters = [];

  // Video speed filter (setpts)
  if (clip.V1Speed && clip.V1Speed !== 1) {
    filters.push(`[0:v]setpts=${1/clip.V1Speed}*PTS[v]`);
  } else {
    filters.push(`[0:v]copy[v]`);
  }

  // A1 audio tempo filter (handle speeds > 2 by stacking atempo filters)
  let a1Filter = '[1:a]';
  if (clip.A1Speed && clip.A1Speed !== 1) {
    const tempoFilters = buildTempoFilters(clip.A1Speed);
    a1Filter += tempoFilters.join(',');
  }

  // Apply volume to A1
  if (clip.A1Vol !== undefined && clip.A1Vol !== 1) {
    a1Filter += `,volume=${clip.A1Vol}`;
  }
  a1Filter += '[a1]';
  filters.push(a1Filter);

  // Handle A2 (secondary audio) if present
  if (hasA2 && clip.A2) {
    // A2 audio tempo filter
    let a2Filter = '[2:a]';
    if (clip.A2Speed && clip.A2Speed !== 1) {
      const tempoFilters = buildTempoFilters(clip.A2Speed);
      a2Filter += tempoFilters.join(',');
    }

    // Apply volume to A2
    if (clip.A2Vol !== undefined && clip.A2Vol !== 1) {
      a2Filter += `,volume=${clip.A2Vol}`;
    }
    a2Filter += '[a2]';
    filters.push(a2Filter);

    // Mix A1 and A2
    filters.push('[a1][a2]amix=inputs=2:duration=longest[a]');
  } else {
    // No A2, just use A1
    filters.push('[a1]copy[a]');
  }

  return filters.join(';');
}

/**
 * Build tempo filters array for a given speed
 * FFmpeg's atempo filter only supports speeds between 0.5 and 2.0,
 * so we stack multiple filters for higher/lower speeds
 * @param {number} speed - Playback speed
 * @returns {string[]} Array of atempo filter strings
 */
function buildTempoFilters(speed) {
  const tempoFilters = [];
  let remainingSpeed = speed;

  // Handle speeds > 2 by stacking 2.0x filters
  while (remainingSpeed > 2) {
    tempoFilters.push('atempo=2.0');
    remainingSpeed = remainingSpeed / 2;
  }

  // Handle speeds < 0.5 by stacking 0.5x filters
  while (remainingSpeed < 0.5 && remainingSpeed > 0) {
    tempoFilters.push('atempo=0.5');
    remainingSpeed = remainingSpeed / 0.5;
  }

  // Add final tempo filter if remaining speed is in valid range (0.5-2.0)
  if (remainingSpeed >= 0.5 && remainingSpeed <= 2.0) {
    tempoFilters.push(`atempo=${remainingSpeed}`);
  }

  return tempoFilters;
}

/**
 * Validate a clip object
 * @param {object} clip - Clip to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateClip(clip) {
  const errors = [];

  // Required fields
  if (!clip.V1) errors.push('Missing V1 (video source)');
  if (!clip.A1) errors.push('Missing A1 (audio source)');
  if (clip.V1Start === undefined) errors.push('Missing V1Start');
  if (clip.V1Stop === undefined) errors.push('Missing V1Stop');
  if (clip.V1Speed === undefined) errors.push('Missing V1Speed');

  // Validate ranges
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

  // Validate speed (must be positive)
  if (clip.V1Speed !== undefined && clip.V1Speed <= 0) {
    errors.push('V1Speed must be greater than 0');
  }

  if (clip.A1Speed !== undefined && clip.A1Speed <= 0) {
    errors.push('A1Speed must be greater than 0');
  }

  // Validate A2 if present
  if (clip.isA2) {
    if (!clip.A2) errors.push('isA2 is true but A2 is missing');
    if (clip.A2Start === undefined) errors.push('isA2 is true but A2Start is missing');
    if (clip.A2Stop === undefined) errors.push('isA2 is true but A2Stop is missing');

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

/**
 * Calculate total expected duration for all clips
 * @param {object[]} clips - Array of clip objects
 * @returns {number} Total duration in seconds
 */
function calculateTotalDuration(clips) {
  return clips.reduce((total, clip) => {
    const videoDuration = (clip.V1Stop - clip.V1Start) / clip.V1Speed;
    return total + videoDuration;
  }, 0);
}

/**
 * Generate temporary directory path for export
 * @param {string} tempPath - Base temp directory
 * @returns {string} Unique temp directory path
 */
function getTempExportDir(tempPath) {
  return path.join(tempPath, 'prestige-export-' + Date.now());
}

/**
 * Generate concat file content for FFmpeg
 * @param {string[]} clipFiles - Array of clip file paths
 * @returns {string} Concat file content
 */
function generateConcatFileContent(clipFiles) {
  return clipFiles.map(f => `file '${f}'`).join('\n');
}

export {
  buildFilterComplex,
  buildTempoFilters,
  validateClip,
  calculateTotalDuration,
  getTempExportDir,
  generateConcatFileContent
};
