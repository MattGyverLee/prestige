/**
 * Timeline Test Data Generator
 *
 * This module provides utilities for generating realistic timeline and annotation
 * data for testing purposes. It creates mock Timeline objects that match the
 * structure used by the Prestige application.
 *
 * Key Features:
 * - Generate timelines with configurable number of milestones
 * - Support for multilingual voiceover tracks (Careful and Translation)
 * - Configurable clip times and durations
 * - Pre-configured test scenarios for common use cases
 * - Mock annotation table generation
 *
 * @module timeline-generator
 */

import { Timeline, Milestone, MilestoneData } from "../../store/annot/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for generating a test timeline
 */
export interface TimelineGeneratorOptions {
  /** Number of milestones to generate */
  numMilestones: number;

  /** Path to the video file for syncMedia */
  videoPath: string;

  /** Path to the audio file for syncMedia */
  audioPath: string;

  /** Whether to include CarefulMerged annotation track (default: true) */
  hasCareful?: boolean;

  /** Whether to include TranslationMerged annotation track (default: true) */
  hasTranslation?: boolean;

  /** Average duration in seconds for each milestone (default: 5) */
  avgDuration?: number;

  /** Whether to include clipStart/clipStop times in milestone data (default: true) */
  withClipTimes?: boolean;

  /** Whether to vary playback speeds across milestones (default: false) */
  speedVariation?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default average duration for milestones (in seconds)
 */
const DEFAULT_AVG_DURATION = 5;

/**
 * Default clip duration for CarefulMerged track (in seconds)
 */
const CAREFUL_CLIP_DURATION = 1.8;

/**
 * Default clip duration for TranslationMerged track (in seconds)
 */
const TRANSLATION_CLIP_DURATION = 2.2;

/**
 * Spacing between CarefulMerged clips (in seconds)
 */
const CAREFUL_CLIP_SPACING = 2;

/**
 * Spacing between TranslationMerged clips (in seconds)
 */
const TRANSLATION_CLIP_SPACING = 2.5;

// ============================================================================
// TIMELINE GENERATION
// ============================================================================

/**
 * Generate a test timeline with realistic milestone data
 *
 * Creates a Timeline object with the specified number of milestones,
 * each containing optional voiceover tracks (CarefulMerged and TranslationMerged).
 *
 * Milestones are generated sequentially with configurable average duration
 * and slight random variance to simulate realistic data.
 *
 * @param options - Configuration options for timeline generation
 * @returns Generated Timeline object with milestones and sync media
 *
 * @example
 * // Generate simple timeline with 5 milestones
 * const timeline = generateTestTimeline({
 *   numMilestones: 5,
 *   videoPath: '/test/video.mp4',
 *   audioPath: '/test/audio.wav'
 * });
 *
 * @example
 * // Generate complex timeline with voiceovers and clip times
 * const timeline = generateTestTimeline({
 *   numMilestones: 10,
 *   videoPath: '/test/video.mp4',
 *   audioPath: '/test/audio.wav',
 *   hasCareful: true,
 *   hasTranslation: true,
 *   withClipTimes: true,
 *   avgDuration: 3
 * });
 */
export function generateTestTimeline(
  options: TimelineGeneratorOptions,
): Timeline {
  const {
    numMilestones,
    videoPath,
    audioPath,
    hasCareful = true,
    hasTranslation = true,
    avgDuration = DEFAULT_AVG_DURATION,
    withClipTimes = true,
  } = options;

  const milestones: Milestone[] = [];
  let currentTime = 0;

  // Generate each milestone sequentially
  for (let i = 0; i < numMilestones; i++) {
    const milestone = generateMilestone({
      index: i,
      startTime: currentTime,
      avgDuration,
      audioPath,
      hasCareful,
      hasTranslation,
      withClipTimes,
    });

    currentTime = milestone.stopTime;
    milestones.push(milestone);
  }

  return {
    milestones,
    syncMedia: [videoPath, audioPath],
    name: `Test Timeline (${numMilestones} milestones)`,
    id: `test-timeline-${Date.now()}`,
  };
}

/**
 * Generate a single milestone with optional voiceover data
 *
 * @param config - Milestone configuration
 * @returns Generated Milestone object
 */
function generateMilestone(config: {
  index: number;
  startTime: number;
  avgDuration: number;
  audioPath: string;
  hasCareful: boolean;
  hasTranslation: boolean;
  withClipTimes: boolean;
}): Milestone {
  const {
    index,
    startTime,
    avgDuration,
    audioPath,
    hasCareful,
    hasTranslation,
    withClipTimes,
  } = config;

  // Apply random variance to duration (±1 second)
  const randomVariance = Math.random() * 2 - 1; // Range: -1 to +1
  const duration = avgDuration + randomVariance;

  const milestone: Milestone = {
    annotationID: `a${index + 1}`,
    startTime,
    stopTime: startTime + duration,
    data: [],
  };

  // Add voiceover tracks if requested
  if (hasCareful) {
    const carefulData = generateCarefulMergedData(
      audioPath,
      index,
      withClipTimes,
    );
    milestone.data.push(carefulData);
  }

  if (hasTranslation) {
    const translationData = generateTranslationMergedData(
      audioPath,
      index,
      withClipTimes,
    );
    milestone.data.push(translationData);
  }

  return milestone;
}

/**
 * Generate CarefulMerged voiceover data for a milestone
 *
 * The CarefulMerged track represents the "careful" annotation audio,
 * typically in French (locale: "fr").
 *
 * @param audioPath - Base audio path
 * @param index - Milestone index (used for clip time calculation)
 * @param withClipTimes - Whether to include clip times
 * @returns MilestoneData object for CarefulMerged track
 */
function generateCarefulMergedData(
  audioPath: string,
  index: number,
  withClipTimes: boolean,
): MilestoneData {
  const data: MilestoneData = {
    channel: "CarefulMerged",
    data: `${audioPath}_Annotations/Careful_Merged.mp3`,
    linguisticType: "default-lt",
    locale: "fr",
    mimeType: "audio/mpeg",
  };

  if (withClipTimes) {
    data.clipStart = index * CAREFUL_CLIP_SPACING;
    data.clipStop = index * CAREFUL_CLIP_SPACING + CAREFUL_CLIP_DURATION;
    data.duration = CAREFUL_CLIP_DURATION;
  }

  return data;
}

/**
 * Generate TranslationMerged voiceover data for a milestone
 *
 * The TranslationMerged track represents the translation audio,
 * typically in English (locale: "en").
 *
 * @param audioPath - Base audio path
 * @param index - Milestone index (used for clip time calculation)
 * @param withClipTimes - Whether to include clip times
 * @returns MilestoneData object for TranslationMerged track
 */
function generateTranslationMergedData(
  audioPath: string,
  index: number,
  withClipTimes: boolean,
): MilestoneData {
  const data: MilestoneData = {
    channel: "TranslationMerged",
    data: `${audioPath}_Annotations/Translation_Merged.mp3`,
    linguisticType: "default-lt",
    locale: "en",
    mimeType: "audio/mpeg",
  };

  if (withClipTimes) {
    data.clipStart = index * TRANSLATION_CLIP_SPACING;
    data.clipStop =
      index * TRANSLATION_CLIP_SPACING + TRANSLATION_CLIP_DURATION;
    data.duration = TRANSLATION_CLIP_DURATION;
  }

  return data;
}

// ============================================================================
// PRE-CONFIGURED TEST SCENARIOS
// ============================================================================

/**
 * Pre-configured test scenarios for common testing use cases
 *
 * These scenarios provide ready-to-use Timeline configurations for:
 * - Simple timelines (few milestones, no voiceovers)
 * - Complex timelines (many milestones, multiple voiceovers)
 * - Edge cases (single long milestone, many short milestones)
 * - Special cases (volume testing, missing clip times)
 */
export const testScenarios = {
  /**
   * Simple Timeline: 3 milestones, video + audio only (no voiceovers)
   *
   * Use this for basic playback and navigation testing.
   *
   * @returns Timeline with 3 milestones, no voiceover tracks
   */
  simple: (): Timeline =>
    generateTestTimeline({
      numMilestones: 3,
      videoPath: "/test/fixtures/media/test-video-5s.mp4",
      audioPath: "/test/fixtures/media/test-audio-5s.wav",
      hasCareful: false,
      hasTranslation: false,
      avgDuration: 1.5,
    }),

  /**
   * Complex Timeline: 10 milestones with both CarefulMerged and TranslationMerged tracks
   *
   * Use this for testing multilingual voiceover playback and export.
   *
   * @returns Timeline with 10 milestones, both voiceover tracks
   */
  complex: (): Timeline =>
    generateTestTimeline({
      numMilestones: 10,
      videoPath: "/test/fixtures/media/test-video-30s.mp4",
      audioPath: "/test/fixtures/media/test-audio-30s.wav",
      hasCareful: true,
      hasTranslation: true,
      avgDuration: 3,
    }),

  /**
   * Single Long Milestone: Edge case with one ~30 second milestone
   *
   * Use this for testing long-duration milestone handling.
   *
   * @returns Timeline with 1 long milestone (~30 seconds)
   */
  singleLong: (): Timeline =>
    generateTestTimeline({
      numMilestones: 1,
      videoPath: "/test/fixtures/media/test-video-30s.mp4",
      audioPath: "/test/fixtures/media/test-audio-30s.wav",
      hasCareful: true,
      hasTranslation: true,
      avgDuration: 30,
    }),

  /**
   * Many Short Milestones: Stress test with 50 short milestones
   *
   * Use this for testing performance with many milestones.
   *
   * @returns Timeline with 50 short milestones (~0.6 seconds each)
   */
  manyShort: (): Timeline =>
    generateTestTimeline({
      numMilestones: 50,
      videoPath: "/test/fixtures/media/test-video-30s.mp4",
      audioPath: "/test/fixtures/media/test-audio-30s.wav",
      hasCareful: true,
      hasTranslation: false,
      avgDuration: 0.6,
    }),

  /**
   * Kings and Princes: Timeline for testing volume logic
   *
   * This scenario returns both a timeline and volume configuration for testing
   * the "kings and princes" volume categorization:
   * - Kings: volume >= 0.84 (primary audio)
   * - Princes: 0 < volume < 0.84 (background audio)
   * - Silent: volume == 0 (muted audio)
   *
   * @returns Object with timeline and volume array
   */
  kingsAndPrinces: (): { timeline: Timeline; volumes: number[] } => ({
    timeline: generateTestTimeline({
      numMilestones: 5,
      videoPath: "/test/fixtures/media/test-video-30s.mp4",
      audioPath: "/test/fixtures/media/test-audio-30s.wav",
      hasCareful: true,
      hasTranslation: true,
      avgDuration: 5,
    }),
    volumes: [
      0.9, // King: video audio (high volume >= 0.84)
      0.3, // Prince: careful voiceover (low volume < 0.84)
      0, // Silent: translation muted
    ],
  }),

  /**
   * No Clip Times: Timeline with milestones but no clip time data
   *
   * Use this for testing edge case where clip times are missing or undefined.
   *
   * @returns Timeline with 3 milestones, voiceovers, but no clip times
   */
  noClipTimes: (): Timeline =>
    generateTestTimeline({
      numMilestones: 3,
      videoPath: "/test/fixtures/media/test-video-5s.mp4",
      audioPath: "/test/fixtures/media/test-audio-5s.wav",
      hasCareful: true,
      hasTranslation: false,
      withClipTimes: false,
    }),
};

// ============================================================================
// ANNOTATION TABLE GENERATION
// ============================================================================

/**
 * Row in an annotation table
 */
interface AnnotationTableRow {
  /** Row ID (sequential index) */
  id: number;

  /** Start time of annotation in seconds */
  startTime: number;

  /** End time of annotation in seconds */
  stopTime: number;

  /** Transcription text */
  txtTransc: string;

  /** Translation text */
  txtTransl: string;

  /** Path to careful audio file (optional, present for even indices) */
  audCareful?: string;

  /** Path to translation audio file (optional, present for indices divisible by 3) */
  audTransl?: string;
}

/**
 * Generate mock annotation table data for AnnotTable component tests
 *
 * Creates an array of annotation rows with:
 * - Sequential IDs
 * - Sequential start/stop times (3 second duration, 3.5 second spacing)
 * - Placeholder transcription and translation text
 * - Audio files based on index pattern:
 *   - Careful audio: present for even indices (0, 2, 4, ...)
 *   - Translation audio: present for indices divisible by 3 (0, 3, 6, ...)
 *
 * @param numRows - Number of annotation rows to generate (default: 5)
 * @returns Array of annotation table rows
 *
 * @example
 * const table = generateAnnotationTable(5);
 * // Returns:
 * // [
 * //   { id: 0, startTime: 0, stopTime: 3, txtTransc: "Annotation 1", ... },
 * //   { id: 1, startTime: 3.5, stopTime: 6.5, txtTransc: "Annotation 2", ... },
 * //   ...
 * // ]
 */
export function generateAnnotationTable(
  numRows: number = 5,
): AnnotationTableRow[] {
  const rows: AnnotationTableRow[] = [];
  let currentTime = 0;

  const ROW_DURATION = 3; // Duration of each annotation in seconds
  const ROW_SPACING = 3.5; // Time between start of consecutive annotations

  for (let i = 0; i < numRows; i++) {
    const row: AnnotationTableRow = {
      id: i,
      startTime: currentTime,
      stopTime: currentTime + ROW_DURATION,
      txtTransc: `Annotation ${i + 1}`,
      txtTransl: `Translation ${i + 1}`,
    };

    // Add careful audio for even indices
    if (i % 2 === 0) {
      row.audCareful = "careful-audio.mp3";
    }

    // Add translation audio for indices divisible by 3
    if (i % 3 === 0) {
      row.audTransl = "transl-audio.mp3";
    }

    rows.push(row);
    currentTime += ROW_SPACING;
  }

  return rows;
}
