/**
 * Video Export Module - Multilingual Audio Export
 *
 * This module handles exporting video with synchronized multilingual audio tracks.
 * It implements a "kings and princes" volume-based audio mixing strategy where:
 * - Kings: Primary audio sources (volume >= 0.84, matching DeeJay playback threshold)
 * - Princes: Background/voiceover audio (0 < volume < 0.84)
 * - Silent: Muted audio (volume == 0)
 *
 * The export process:
 * 1. Analyzes volume settings to categorize audio tracks
 * 2. For each milestone, calculates video/audio speeds based on primary (king) track
 * 3. Adjusts secondary (prince) tracks to match king duration
 * 4. Builds video clip configurations with FFmpeg parameters
 * 5. Sends clip array to Electron IPC for FFmpeg processing
 *
 * @module ExportVid
 */

import {
  Timeline,
  Milestone,
  VideoClip,
  MilestoneData,
} from "../../store/annot/types";
import { electronAPI } from "../../utils/electronAPI";
import toast from "react-hot-toast";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Volume threshold for "king" (primary) audio classification
 * Audio tracks with volume >= 0.5^0.25 (≈0.84) are considered primary/dominant
 * This matches the threshold used in DeeJay.tsx for "highs" vs "lows"
 */
const KING_VOLUME_THRESHOLD = 0.5 ** 0.25;

/**
 * Volume threshold for silent audio
 * Audio tracks with volume == 0 are muted/silent
 */
const SILENT_VOLUME = 0;

/**
 * Audio channel names used in milestone data
 */
const AUDIO_CHANNELS = {
  CAREFUL_MERGED: "CarefulMerged",
  TRANSLATION_MERGED: "TranslationMerged",
} as const;

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Export video with multilingual audio tracks
 *
 * This function implements a sophisticated audio mixing strategy where audio
 * sources are categorized by volume into "kings" (primary) and "princes" (background).
 * The primary audio determines the duration of each clip, and secondary audio
 * is adjusted to match.
 *
 * Volume Categories:
 * - Kings (volume >= 0.84): Primary audio that determines clip duration
 * - Princes (0 < volume < 0.84): Background audio adjusted to match king duration
 * - Silent (volume == 0): Muted audio tracks
 *
 * Audio Track Indices:
 * - Index 0: Video's original audio track
 * - Index 1: CarefulMerged annotation audio (typically French)
 * - Index 2: TranslationMerged annotation audio (typically English)
 *
 * @param timeline - Timeline object containing milestones with audio data
 * @param multiplier - Global speed multiplier for export (e.g., 1.5 for 1.5x speed)
 * @param vols - Array of volume levels for each audio track [videoAudio, careful, translation]
 * @returns Promise<boolean> - true if export succeeded, false otherwise
 *
 * @example
 * // Export with video audio as primary (king), careful as background (prince)
 * await exportVideo(timeline, 1.5, [0.9, 0.3, 0]);
 * // Result: Video audio plays at 90% volume (king), careful voiceover at 30% (prince), translation muted
 */
export async function exportVideo(
  timeline: Timeline,
  multiplier: number,
  vols: number[],
): Promise<boolean> {
  try {
    // -------------------------------------------------------------------------
    // Step 1: Categorize audio tracks by volume (Kings vs Princes)
    // -------------------------------------------------------------------------
    const { kings, princes } = categorizeAudioByVolume(vols);

    // -------------------------------------------------------------------------
    // Step 2: Extract source media paths from timeline
    // -------------------------------------------------------------------------
    const vidSource = timeline.syncMedia[0]; // Video file path
    const audSource = timeline.syncMedia[1]; // Audio file path

    const clips: VideoClip[] = [];

    toast.loading("Building export plan...", { id: "export-video" });

    // -------------------------------------------------------------------------
    // Step 3: Build clip configuration for each milestone
    // -------------------------------------------------------------------------
    timeline.milestones.forEach((ms: Milestone, msIndex: number) => {
      const milestoneClips = buildMilestoneClips({
        milestone: ms,
        milestoneIndex: msIndex,
        vidSource,
        audSource,
        multiplier,
        kings,
        princes,
        vols,
      });

      clips.push(...milestoneClips);
    });

    console.log(`Built ${clips.length} clips for export`);
    console.log(clips);

    // -------------------------------------------------------------------------
    // Step 4: Determine output path
    // -------------------------------------------------------------------------
    const cwd = await electronAPI.getCwd();
    const timestamp = Date.now();
    const outputPath = `${cwd}/export-${timestamp}.mp4`;

    toast.loading(`Exporting ${clips.length} clips...`, { id: "export-video" });

    // -------------------------------------------------------------------------
    // Step 5: Execute FFmpeg export via Electron IPC
    // -------------------------------------------------------------------------
    const result = await electronAPI.exportVideo(clips, outputPath);

    toast.success(`Video exported successfully to ${result.output}`, {
      id: "export-video",
    });

    return true;
  } catch (error) {
    console.error("Export video error:", error);
    toast.error(`Export failed: ${(error as Error).message}`, {
      id: "export-video",
    });
    return false;
  }
}

// ============================================================================
// AUDIO CATEGORIZATION
// ============================================================================

/**
 * Categorize audio tracks into "kings" and "princes" based on volume levels
 *
 * Kings are primary audio tracks (volume >= 0.84) that control clip duration.
 * Princes are background tracks (0 < volume < 0.84) that are adjusted to match king duration.
 * Silent tracks (volume == 0) are excluded from both categories.
 *
 * @param vols - Array of volume levels for each audio track
 * @returns Object with kings and princes arrays (indices of audio tracks)
 *
 * @example
 * categorizeAudioByVolume([0.9, 0.3, 0]);
 * // Returns: { kings: [0], princes: [1] }
 * // Track 0 (video audio) is king at 0.9 volume
 * // Track 1 (careful) is prince at 0.3 volume
 * // Track 2 (translation) is silent and excluded
 */
function categorizeAudioByVolume(vols: number[]): {
  kings: number[];
  princes: number[];
} {
  const kings: number[] = [];
  const princes: number[] = [];

  vols.forEach((vol: number, index: number) => {
    if (vol >= KING_VOLUME_THRESHOLD) {
      kings.push(index);
    } else if (vol > SILENT_VOLUME) {
      princes.push(index);
    }
    // Silent tracks (vol === 0) are intentionally not added to either category
  });

  return { kings, princes };
}

// ============================================================================
// MILESTONE CLIP BUILDING
// ============================================================================

interface BuildMilestoneClipsParams {
  milestone: Milestone;
  milestoneIndex: number;
  vidSource: string;
  audSource: string;
  multiplier: number;
  kings: number[];
  princes: number[];
  vols: number[];
}

/**
 * Build video clip configurations for a single milestone
 *
 * For each "king" (primary audio track) in the milestone, this function:
 * 1. Calculates the king's duration after speed adjustment
 * 2. Determines video speed to match king duration
 * 3. Adds "prince" (background) audio tracks, adjusting their speed to match
 * 4. Creates VideoClip objects with all necessary FFmpeg parameters
 *
 * @param params - Configuration parameters for milestone clip building
 * @returns Array of VideoClip objects (one per king, potentially with prince voiceovers)
 */
function buildMilestoneClips(params: BuildMilestoneClipsParams): VideoClip[] {
  const {
    milestone: ms,
    milestoneIndex: msIndex,
    vidSource,
    audSource,
    multiplier,
    kings,
    princes,
    vols,
  } = params;

  const clips: VideoClip[] = [];

  // Video timing is same for all clips in this milestone
  const V1 = vidSource;
  const V1Start = ms.startTime;
  const V1Stop = ms.stopTime;

  // -------------------------------------------------------------------------
  // Process each "king" (primary audio track)
  // -------------------------------------------------------------------------
  kings.forEach((king: number) => {
    // Calculate primary audio configuration and king duration
    const kingConfig = calculateKingAudio({
      kingIndex: king,
      milestone: ms,
      vidSource,
      multiplier,
    });

    if (!kingConfig) {
      console.warn(
        `Skipping milestone ${msIndex}, king ${king}: no audio found`,
      );
      return;
    }

    const { A1, A1Start, A1Stop, A1Speed, V1Speed, kingLen } = kingConfig;

    // -------------------------------------------------------------------------
    // Add clips with prince (background) voiceovers
    // -------------------------------------------------------------------------
    if (princes.length > 0) {
      const princeClips = buildPrinceClips({
        princes,
        milestone: ms,
        milestoneIndex: msIndex,
        V1,
        V1Start,
        V1Stop,
        V1Speed,
        A1,
        A1Start,
        A1Stop,
        A1Speed,
        kingLen,
        king,
        audSource,
        vols,
      });

      clips.push(...princeClips);
    } else {
      // -------------------------------------------------------------------------
      // No princes: Create clip with only primary audio
      // -------------------------------------------------------------------------
      clips.push({
        V1,
        V1Start,
        V1Stop,
        V1Speed,
        A1,
        A1Start,
        A1Stop,
        A1Speed,
        A1Vol: vols[king],
        isA2: false,
        Comment: `Milestone ${msIndex}: King ${king}`,
      });
    }
  });

  return clips;
}

// ============================================================================
// KING (PRIMARY) AUDIO CALCULATION
// ============================================================================

interface KingAudioConfig {
  A1: string;
  A1Start: number;
  A1Stop: number;
  A1Speed: number;
  V1Speed: number;
  kingLen: number;
}

/**
 * Calculate primary audio configuration based on king track
 *
 * The "king" audio track determines the duration of the output clip.
 * This function calculates:
 * - Which audio file to use as primary (A1)
 * - Audio clip times (start/stop)
 * - Audio playback speed
 * - Video playback speed (adjusted to match king duration)
 * - Final king duration after speed adjustment
 *
 * @param params - Configuration parameters
 * @returns KingAudioConfig object with calculated values, or null if king audio not found
 */
function calculateKingAudio(params: {
  kingIndex: number;
  milestone: Milestone;
  vidSource: string;
  multiplier: number;
}): KingAudioConfig | null {
  const { kingIndex: king, milestone: ms, vidSource, multiplier } = params;

  let A1 = "";
  let A1Start = -1;
  let A1Stop = -1;
  let A1Speed = -1;
  let V1Speed = -1;
  let kingLen = -1;

  // -------------------------------------------------------------------------
  // King Index 0: Use video's original audio track
  // -------------------------------------------------------------------------
  if (king === 0) {
    A1 = vidSource;
    A1Speed = multiplier;
    A1Start = ms.startTime;
    A1Stop = ms.stopTime;
    kingLen = (ms.stopTime - ms.startTime) * multiplier;
    V1Speed = multiplier;
  }
  // -------------------------------------------------------------------------
  // King Index 1: Use CarefulMerged annotation audio
  // -------------------------------------------------------------------------
  else if (king === 1) {
    const carefulAudio = getAudio(AUDIO_CHANNELS.CAREFUL_MERGED, ms);
    if (carefulAudio.file !== "") {
      A1 = carefulAudio.file;
      A1Start = carefulAudio.start;
      A1Stop = carefulAudio.stop;
      A1Speed = multiplier;
      kingLen = (A1Stop - A1Start) * multiplier;
      V1Speed = kingLen / (ms.stopTime - ms.startTime);
    }
  }
  // -------------------------------------------------------------------------
  // King Index 2: Use TranslationMerged annotation audio
  // -------------------------------------------------------------------------
  else if (king === 2) {
    const translationAudio = getAudio(AUDIO_CHANNELS.TRANSLATION_MERGED, ms);
    if (translationAudio.file !== "") {
      A1 = translationAudio.file;
      A1Start = translationAudio.start;
      A1Stop = translationAudio.stop;
      A1Speed = multiplier;
      kingLen = (A1Stop - A1Start) * multiplier;
      V1Speed = kingLen / (ms.stopTime - ms.startTime);
    }
  }

  // Return null if king audio was not found
  if (A1 === "" || kingLen === -1) {
    return null;
  }

  return { A1, A1Start, A1Stop, A1Speed, V1Speed, kingLen };
}

// ============================================================================
// PRINCE (BACKGROUND) AUDIO BUILDING
// ============================================================================

interface BuildPrinceClipsParams {
  princes: number[];
  milestone: Milestone;
  milestoneIndex: number;
  V1: string;
  V1Start: number;
  V1Stop: number;
  V1Speed: number;
  A1: string;
  A1Start: number;
  A1Stop: number;
  A1Speed: number;
  kingLen: number;
  king: number;
  audSource: string;
  vols: number[];
}

/**
 * Build clips with prince (background) audio tracks
 *
 * Prince tracks are background/voiceover audio that play alongside the primary (king) audio.
 * They are speed-adjusted to match the king's duration.
 *
 * @param params - Configuration parameters
 * @returns Array of VideoClip objects with prince audio mixed in
 */
function buildPrinceClips(params: BuildPrinceClipsParams): VideoClip[] {
  const {
    princes,
    milestone: ms,
    milestoneIndex: msIndex,
    V1,
    V1Start,
    V1Stop,
    V1Speed,
    A1,
    A1Start,
    A1Stop,
    A1Speed,
    kingLen,
    king,
    audSource,
    vols,
  } = params;

  const clips: VideoClip[] = [];
  let clipCreated = false;

  // -------------------------------------------------------------------------
  // Process each prince (background audio track)
  // -------------------------------------------------------------------------
  princes.forEach((prince: number) => {
    // -----------------------------------------------------------------------
    // Prince Index 0: Use video/audio source as background
    // -----------------------------------------------------------------------
    if (prince === 0) {
      clips.push({
        V1,
        V1Start,
        V1Stop,
        V1Speed,
        A1,
        A1Start,
        A1Stop,
        A1Speed,
        A1Vol: vols[king],
        isA2: true,
        A2: audSource,
        A2Start: V1Start,
        A2Stop: V1Stop,
        A2Speed: V1Speed,
        A2Vol: vols[prince],
        Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
      });
      clipCreated = true;
    }
    // -----------------------------------------------------------------------
    // Prince Index 1: Use CarefulMerged as background voiceover
    // -----------------------------------------------------------------------
    else if (prince === 1) {
      const carefulAudio = getAudio(AUDIO_CHANNELS.CAREFUL_MERGED, ms);

      if (carefulAudio.file !== "") {
        const A2 = carefulAudio.file;
        const A2Start = carefulAudio.start;
        const A2Stop = carefulAudio.stop;
        const A2Speed = kingLen / (A2Stop - A2Start);

        clips.push({
          V1,
          V1Start,
          V1Stop,
          V1Speed,
          A1,
          A1Start,
          A1Stop,
          A1Speed,
          A1Vol: vols[king],
          isA2: true,
          A2,
          A2Start,
          A2Stop,
          A2Speed,
          A2Vol: vols[prince],
          Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
        });
        clipCreated = true;
      } else if (!clipCreated) {
        // Fallback: Prince audio not available, create clip with only king audio
        clips.push({
          V1,
          V1Start,
          V1Stop,
          V1Speed,
          A1,
          A1Start,
          A1Stop,
          A1Speed,
          A1Vol: vols[king],
          isA2: false,
          Comment: `Milestone ${msIndex}: King ${king} (no voiceover ${prince})`,
        });
        clipCreated = true;
      }
    }
    // -----------------------------------------------------------------------
    // Prince Index 2: Use TranslationMerged as background voiceover
    // -----------------------------------------------------------------------
    else if (prince === 2) {
      const translationAudio = getAudio(AUDIO_CHANNELS.TRANSLATION_MERGED, ms);

      if (translationAudio.file !== "") {
        const A2 = translationAudio.file;
        const A2Start = translationAudio.start;
        const A2Stop = translationAudio.stop;
        const A2Speed = kingLen / (A2Stop - A2Start);

        clips.push({
          V1,
          V1Start,
          V1Stop,
          V1Speed,
          A1,
          A1Start,
          A1Stop,
          A1Speed,
          A1Vol: vols[king],
          isA2: true,
          A2,
          A2Start,
          A2Stop,
          A2Speed,
          A2Vol: vols[prince],
          Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
        });
        clipCreated = true;
      } else if (!clipCreated) {
        // Fallback: Prince audio not available, create clip with only king audio
        clips.push({
          V1,
          V1Start,
          V1Stop,
          V1Speed,
          A1,
          A1Start,
          A1Stop,
          A1Speed,
          A1Vol: vols[king],
          isA2: false,
          Comment: `Milestone ${msIndex}: King ${king} (no voiceover ${prince})`,
        });
        clipCreated = true;
      }
    }
  });

  return clips;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find audio clip data for a given channel in a milestone
 *
 * Searches the milestone's data array for a specific audio channel
 * (e.g., "CarefulMerged" or "TranslationMerged") and extracts the
 * audio file path and clip times.
 *
 * @param chan - Channel name to search for (e.g., "CarefulMerged")
 * @param ms - Milestone object containing audio data
 * @returns Object with audio file path and clip times
 *   - file: Audio file path (empty string if not found)
 *   - start: Clip start time in seconds (-1 if not found or undefined)
 *   - stop: Clip stop time in seconds (-1 if not found or undefined)
 *
 * @example
 * const carefulAudio = getAudio("CarefulMerged", milestone);
 * if (carefulAudio.file !== "") {
 *   console.log(`Found careful audio: ${carefulAudio.file}`);
 *   console.log(`Clip times: ${carefulAudio.start} - ${carefulAudio.stop}`);
 * }
 */
export function getAudio(chan: string, ms: Milestone) {
  let audioFile = "";
  let audioStart = -1;
  let audioStop = -1;

  // Search milestone data for matching channel
  ms.data.forEach((d: MilestoneData) => {
    if (d.channel === chan) {
      audioFile = d.data;
      audioStart = d.clipStart ?? -1;
      audioStop = d.clipStop ?? -1;
    }
  });

  return { file: audioFile, start: audioStart, stop: audioStop };
}
