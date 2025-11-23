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
  AudioClip,
} from "../../store/annot/types";
import { electronAPI } from "../../utils/electronAPI";
import toast from "react-hot-toast";
import store from "../../store";
import { Media } from "../../store/tree/types";

// ============================================================================
// URL UTILITIES
// ============================================================================

/**
 * Convert a file:// URL to a file system path
 *
 * @param fileUrl - File URL (e.g., "file:///D:/path/to/file.mp4")
 * @returns File system path (e.g., "D:/path/to/file.mp4" on Windows)
 *
 * @example
 * fileURLToPath("file:///D:/path/to/file.mp4")
 * // Returns: "D:/path/to/file.mp4"
 */
function fileURLToPath(fileUrl: string): string {
  if (!fileUrl.startsWith("file://")) {
    return fileUrl; // Already a path, not a URL
  }

  // Remove 'file://' prefix
  let path = fileUrl.substring(7);

  // On Windows, file URLs look like: file:///D:/path
  // We need to handle the extra slash before the drive letter
  if (path.startsWith("/") && path.charAt(2) === ":") {
    path = path.substring(1); // Remove leading slash before drive letter
  }

  // Decode URL encoding (e.g., %20 -> space, %C3%A8 -> è)
  path = decodeURIComponent(path);

  return path;
}

/**
 * Resolve a blob URL to its filesystem path
 *
 * Searches the Redux store (sourceMedia and annotMedia) to find the media
 * file with the matching blob URL, then returns its filesystem path.
 *
 * @param blobUrl - Blob URL (e.g., "blob:http://localhost/abc123")
 * @returns File system path, or the original blob URL if not found
 *
 * @example
 * resolveBlobToPath("blob:http://localhost/abc123")
 * // Returns: "D:/project/audio/Careful_Merged.mp3"
 */
function resolveBlobToPath(blobUrl: string): string {
  // If it's not a blob URL, try converting file:// URLs
  if (!blobUrl.startsWith("blob:")) {
    return fileURLToPath(blobUrl);
  }

  // Get Redux state
  const state = store.getState();
  const allMedia: Media[] = [
    ...(state.tree.sourceMedia || []),
    ...(state.tree.annotMedia || []),
  ];

  // Search for matching blob URL
  const mediaFile = allMedia.find((media: Media) => media.blobURL === blobUrl);

  if (mediaFile) {
    return mediaFile.path;
  }

  // If not found, log warning and return original URL
  console.warn(`Could not resolve blob URL to path: ${blobUrl}`);
  return blobUrl;
}

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

/**
 * Video file extensions supported by export
 */
const VIDEO_EXTENSIONS = [".mp4", ".m4v", ".mov", ".mkv", ".webm"];

/**
 * Normalize media path for extension inspection
 */
function normalizeMediaPath(input?: string): string {
  if (!input) return "";
  const noFragment = input.split("#")[0];
  return noFragment.split("?")[0].toLowerCase();
}

/**
 * Determine if a timeline contains a synced video reference
 */
export function hasSyncedVideo(timeline?: Timeline | null): boolean {
  if (!timeline || !Array.isArray(timeline.syncMedia)) {
    return false;
  }

  return timeline.syncMedia.some((entry: string) => {
    const normalized = normalizeMediaPath(entry);
    return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
  });
}

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
    if (!timeline || !timeline.milestones || timeline.milestones.length === 0) {
      toast.error("No timeline data available to export.");
      return false;
    }

    if (!hasSyncedVideo(timeline)) {
      return exportAudio(timeline, multiplier, vols);
    }

    // -------------------------------------------------------------------------
    // Step 1: Categorize audio tracks by volume (Kings vs Princes)
    // -------------------------------------------------------------------------
    const { kings, princes } = categorizeAudioByVolume(vols);

    if (kings.length === 0) {
      // Warn user but allow them to continue with silent export
      const confirmed = confirm(
        "All audio tracks are silent. Export will create a video with no audio. Continue?",
      );
      if (!confirmed) {
        toast.error("Export cancelled.");
        return false;
      }
      toast.loading("Exporting silent video...", { id: "export-video" });
    }

    console.log("=== EXPORT VIDEO DEBUG ===");
    console.log("Volume levels:", vols);
    console.log("Kings (primary audio):", kings);
    console.log("Princes (background audio):", princes);
    console.log("Timeline milestones:", timeline.milestones.length);

    // -------------------------------------------------------------------------
    // Step 2: Extract source media paths from timeline
    // -------------------------------------------------------------------------
    // Convert file:// URLs to file system paths for FFmpeg
    const vidSource = fileURLToPath(timeline.syncMedia[0]); // Video file path
    const audSource = fileURLToPath(timeline.syncMedia[1]); // Audio file path

    console.log("Video source:", vidSource);
    console.log("Audio source:", audSource);

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

/**
 * Export timeline as audio-only mix when no synced video exists
 */
async function exportAudio(
  timeline: Timeline,
  multiplier: number,
  vols: number[],
): Promise<boolean> {
  try {
    const { kings, princes } = categorizeAudioByVolume(vols);

    if (kings.length === 0) {
      toast.error("Enable at least one audio track before exporting.");
      return false;
    }

    const segments = buildAudioSegments({
      timeline,
      multiplier,
      kings,
      princes,
      vols,
    });

    if (segments.length === 0) {
      toast.error("No exportable audio segments were found.");
      return false;
    }

    toast.loading("Exporting audio...", { id: "export-video" });

    const cwd = await electronAPI.getCwd();
    const timestamp = Date.now();
    const basePath = `${cwd}/export-${timestamp}`;
    const audioOutput = `${basePath}.mp3`;
    const srtOutput = `${basePath}.srt`;

    const result = await electronAPI.exportAudio(segments, audioOutput);

    const srtContent = buildSrtContent(timeline, kings);
    const finalSrtContent =
      srtContent.trim().length > 0
        ? srtContent
        : "1\n00:00:00,000 --> 00:00:00,500\n(No subtitle data available)\n";

    await electronAPI.writeFile(srtOutput, finalSrtContent);

    toast.success(
      `Audio exported successfully to ${result.output}\nSubtitles saved to ${srtOutput}`,
      { id: "export-video" },
    );

    return true;
  } catch (error) {
    console.error("Export audio error:", error);
    toast.error(`Audio export failed: ${(error as Error).message}`, {
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

interface BuildAudioSegmentsParams {
  timeline: Timeline;
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
    console.log(`Processing milestone ${msIndex}, king ${king}`);

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
    console.log(
      `  King ${king} audio: ${A1}, ${A1Start}-${A1Stop}, speed=${A1Speed}`,
    );

    // -------------------------------------------------------------------------
    // Extract subtitle text for this king
    // -------------------------------------------------------------------------
    const subtitle = getSubtitleForKing(ms, king);

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
        subtitle,
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
        subtitle,
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
    // Validate clip times exist
    if (ms.startTime === undefined || ms.stopTime === undefined) {
      console.warn(`Skipping milestone - missing startTime/stopTime`);
      return null;
    }

    A1 = vidSource;
    A1Speed = multiplier;
    A1Start = ms.startTime;
    A1Stop = ms.stopTime;
    // Calculate king's output duration: input_duration / speed
    // e.g., 10 seconds at 1.5x speed = 10 / 1.5 = 6.67 seconds output
    kingLen = (ms.stopTime - ms.startTime) / A1Speed;
    V1Speed = multiplier;
  }
  // -------------------------------------------------------------------------
  // King Index 1: Use CarefulMerged annotation audio
  // -------------------------------------------------------------------------
  else if (king === 1) {
    const carefulAudio = getAudio(AUDIO_CHANNELS.CAREFUL_MERGED, ms);
    if (carefulAudio.file !== "") {
      // Validate audio clip times exist
      if (carefulAudio.start === undefined || carefulAudio.stop === undefined) {
        console.warn(
          `Skipping milestone - missing audio clip times for CarefulMerged`,
        );
        return null;
      }
      // Validate video clip times exist
      if (ms.startTime === undefined || ms.stopTime === undefined) {
        console.warn(`Skipping milestone - missing video startTime/stopTime`);
        return null;
      }

      A1 = carefulAudio.file;
      A1Start = carefulAudio.start;
      A1Stop = carefulAudio.stop;
      A1Speed = multiplier;
      // Calculate king's output duration: input_duration / speed
      // e.g., 10 seconds at 1.5x speed = 10 / 1.5 = 6.67 seconds output
      kingLen = (A1Stop - A1Start) / A1Speed;
      // Calculate video speed to match audio duration
      // If audio is longer than video, slow down video (V1Speed < 1)
      // If audio is shorter than video, speed up video (V1Speed > 1)
      V1Speed = (ms.stopTime - ms.startTime) / kingLen;
    }
  }
  // -------------------------------------------------------------------------
  // King Index 2: Use TranslationMerged annotation audio
  // -------------------------------------------------------------------------
  else if (king === 2) {
    const translationAudio = getAudio(AUDIO_CHANNELS.TRANSLATION_MERGED, ms);
    if (translationAudio.file !== "") {
      // Validate audio clip times exist
      if (
        translationAudio.start === undefined ||
        translationAudio.stop === undefined
      ) {
        console.warn(
          `Skipping milestone - missing audio clip times for TranslationMerged`,
        );
        return null;
      }
      // Validate video clip times exist
      if (ms.startTime === undefined || ms.stopTime === undefined) {
        console.warn(`Skipping milestone - missing video startTime/stopTime`);
        return null;
      }

      A1 = translationAudio.file;
      A1Start = translationAudio.start;
      A1Stop = translationAudio.stop;
      A1Speed = multiplier;
      // Calculate king's output duration: input_duration / speed
      // e.g., 10 seconds at 1.5x speed = 10 / 1.5 = 6.67 seconds output
      kingLen = (A1Stop - A1Start) / A1Speed;
      // Calculate video speed to match audio duration
      // If audio is longer than video, slow down video (V1Speed < 1)
      // If audio is shorter than video, speed up video (V1Speed > 1)
      V1Speed = (ms.stopTime - ms.startTime) / kingLen;
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
  subtitle: string;
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
    subtitle,
  } = params;

  const clips: VideoClip[] = [];
  let clipCreated = false;

  // -------------------------------------------------------------------------
  // Process each prince (background audio track)
  // -------------------------------------------------------------------------
  princes.forEach((prince: number) => {
    console.log(`  Processing prince ${prince}`);

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
        subtitle,
        Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
      });
      clipCreated = true;
    }
    // -----------------------------------------------------------------------
    // Prince Index 1: Use CarefulMerged as background voiceover
    // -----------------------------------------------------------------------
    else if (prince === 1) {
      const carefulAudio = getAudio(AUDIO_CHANNELS.CAREFUL_MERGED, ms);
      console.log(
        `    Careful audio: file="${carefulAudio.file}", start=${carefulAudio.start}, stop=${carefulAudio.stop}`,
      );

      if (carefulAudio.file !== "") {
        const A2 = carefulAudio.file;
        const A2Start = carefulAudio.start;
        const A2Stop = carefulAudio.stop;
        // Calculate prince speed to match king's output duration
        // If prince is longer than king, speed up (A2Speed > 1)
        // If prince is shorter than king, slow down (A2Speed < 1)
        const A2Speed = (A2Stop - A2Start) / kingLen;
        console.log(`    A2 speed calculated: ${A2Speed}`);

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
          subtitle,
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
          subtitle,
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
        // Calculate prince speed to match king's output duration
        // If prince is longer than king, speed up (A2Speed > 1)
        // If prince is shorter than king, slow down (A2Speed < 1)
        const A2Speed = (A2Stop - A2Start) / kingLen;

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
          subtitle,
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
          subtitle,
          Comment: `Milestone ${msIndex}: King ${king} (no voiceover ${prince})`,
        });
        clipCreated = true;
      }
    }
  });

  return clips;
}

/**
 * Build audio-only segments when no synced video exists
 */
function buildAudioSegments(params: BuildAudioSegmentsParams): AudioClip[] {
  const { timeline, multiplier, kings, princes, vols } = params;

  const vidSource =
    timeline.syncMedia && timeline.syncMedia[0]
      ? fileURLToPath(timeline.syncMedia[0])
      : "";
  const audSource =
    timeline.syncMedia && timeline.syncMedia[1]
      ? fileURLToPath(timeline.syncMedia[1])
      : "";

  const segments: AudioClip[] = [];

  timeline.milestones.forEach((ms: Milestone, msIndex: number) => {
    kings.forEach((king: number) => {
      const kingConfig = calculateKingAudio({
        kingIndex: king,
        milestone: ms,
        vidSource,
        multiplier,
      });

      if (!kingConfig) {
        return;
      }

      const { A1, A1Start, A1Stop, A1Speed, kingLen } = kingConfig;
      const subtitle = getSubtitleForKing(ms, king);
      const baseSegment: AudioClip = {
        A1,
        A1Start,
        A1Stop,
        A1Speed,
        A1Vol: vols[king],
        isA2: false,
        subtitle,
        Comment: `Milestone ${msIndex}: King ${king}`,
        timelineStart: ms.startTime,
        timelineStop: ms.stopTime,
      };

      if (princes.length === 0) {
        segments.push(baseSegment);
        return;
      }

      let created = false;
      princes.forEach((prince: number) => {
        const princeAudio = resolvePrinceAudio(prince, ms, audSource);
        if (!princeAudio || princeAudio.file === "") {
          return;
        }

        const { file, start, stop } = princeAudio;

        if (start === -1 || stop === -1 || kingLen <= 0) {
          return;
        }

        const A2Speed = (stop - start) / kingLen;
        segments.push({
          ...baseSegment,
          isA2: true,
          A2: file,
          A2Start: start,
          A2Stop: stop,
          A2Speed,
          A2Vol: vols[prince],
          Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
        });
        created = true;
      });

      if (!created) {
        segments.push(baseSegment);
      }
    });
  });

  return segments;
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
 * This function resolves blob URLs to filesystem paths for FFmpeg compatibility.
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
      const originalUrl = d.data;
      // Resolve blob URL to filesystem path for FFmpeg
      audioFile = resolveBlobToPath(d.data);
      audioStart = d.clipStart ?? -1;
      audioStop = d.clipStop ?? -1;

      console.log(`      getAudio(${chan}): ${originalUrl} -> ${audioFile}`);
    }
  });

  return { file: audioFile, start: audioStart, stop: audioStop };
}

/**
 * Extract subtitle text from milestone based on king index
 *
 * Returns transcription text for kings 0-1 (video/careful),
 * or translation text for king 2 (translation).
 *
 * @param ms - Milestone object containing subtitle data
 * @param kingIndex - Index of the king track (0=video, 1=careful, 2=translation)
 * @returns Subtitle text, or empty string if not found
 *
 * @example
 * // Get transcription for video king
 * const subtitle = getSubtitleForKing(milestone, 0);
 * // Returns: "Bonjour, comment allez-vous?"
 *
 * @example
 * // Get translation for translation king
 * const subtitle = getSubtitleForKing(milestone, 2);
 * // Returns: "Hello, how are you?"
 */
function getSubtitleForKing(ms: Milestone, kingIndex: number): string {
  let subtitle = "";

  if (kingIndex <= 1) {
    // Kings 0-1: Show transcription
    const transcData = ms.data.find((d) => d.channel === "Transcription");
    if (transcData && transcData.data) {
      subtitle = transcData.data;
    }
  } else if (kingIndex === 2) {
    // King 2: Show translation
    const translData = ms.data.find((d) => d.channel === "Translation");
    if (translData && translData.data) {
      subtitle = translData.data;
    }
  }

  // Filter out null, undefined, or "%ignore%" markers
  if (subtitle === undefined || subtitle === null || subtitle === "%ignore%") {
    subtitle = "";
  }

  return subtitle;
}

/**
 * Resolve prince audio inputs for audio-only export
 */
function resolvePrinceAudio(
  princeIndex: number,
  ms: Milestone,
  audSource: string,
) {
  if (princeIndex === 0 && audSource) {
    return { file: audSource, start: ms.startTime, stop: ms.stopTime };
  }

  if (princeIndex === 1) {
    return getAudio(AUDIO_CHANNELS.CAREFUL_MERGED, ms);
  }

  if (princeIndex === 2) {
    return getAudio(AUDIO_CHANNELS.TRANSLATION_MERGED, ms);
  }

  return { file: "", start: -1, stop: -1 };
}

/**
 * Format seconds into SRT timestamp
 */
export function formatSrtTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds)) seconds = 0;
  if (seconds < 0) seconds = 0;
  const totalMillis = Math.round(seconds * 1000);
  const hours = Math.floor(totalMillis / 3600000);
  const minutes = Math.floor((totalMillis % 3600000) / 60000);
  const secs = Math.floor((totalMillis % 60000) / 1000);
  const millis = totalMillis % 1000;

  const pad = (value: number, places = 2) =>
    value.toString().padStart(places, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${millis
    .toString()
    .padStart(3, "0")}`;
}

/**
 * Build SRT content based on timeline milestones and prioritized king track
 */
export function buildSrtContent(timeline: Timeline, kings: number[]): string {
  const defaultTrack = 0;
  const primaryKing =
    kings.length > 0 ? Math.max(0, Math.min(2, kings[0])) : defaultTrack;

  let counter = 1;
  const entries: string[] = [];

  timeline.milestones.forEach((ms: Milestone) => {
    const text = getSubtitleForKing(ms, primaryKing).trim();
    if (!text) {
      return;
    }

    entries.push(
      `${counter++}\n${formatSrtTimestamp(ms.startTime)} --> ${formatSrtTimestamp(
        ms.stopTime,
      )}\n${text}\n`,
    );
  });

  return entries.join("\n");
}
