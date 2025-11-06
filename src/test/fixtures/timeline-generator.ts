import { Timeline, Milestone, MilestoneData } from '../../store/annot/types';

export interface TimelineGeneratorOptions {
  numMilestones: number;
  videoPath: string;
  audioPath: string;
  hasCareful?: boolean;
  hasTranslation?: boolean;
  avgDuration?: number; // seconds per milestone
  withClipTimes?: boolean; // Include clipStart/clipStop
  speedVariation?: boolean; // Vary playback speeds
}

/**
 * Generate a test timeline with realistic milestone data
 *
 * @example
 * const timeline = generateTestTimeline({
 *   numMilestones: 5,
 *   videoPath: '/test/video.mp4',
 *   audioPath: '/test/audio.wav',
 *   hasCareful: true,
 *   hasTranslation: true
 * });
 */
export function generateTestTimeline(options: TimelineGeneratorOptions): Timeline {
  const {
    numMilestones,
    videoPath,
    audioPath,
    hasCareful = true,
    hasTranslation = true,
    avgDuration = 5,
    withClipTimes = true,
    speedVariation = false
  } = options;

  const milestones: Milestone[] = [];
  let currentTime = 0;

  for (let i = 0; i < numMilestones; i++) {
    const duration = avgDuration + (Math.random() * 2 - 1); // ±1 second variance
    const milestone: Milestone = {
      annotationID: `a${i + 1}`,
      startTime: currentTime,
      stopTime: currentTime + duration,
      data: []
    };

    // Add CarefulMerged if enabled (this is the "careful" annotation track)
    if (hasCareful) {
      const carefulData: MilestoneData = {
        channel: 'CarefulMerged',
        data: `${audioPath}_Annotations/Careful_Merged.mp3`,
        linguisticType: 'default-lt',
        locale: 'fr',
        mimeType: 'audio/mpeg'
      };

      if (withClipTimes) {
        carefulData.clipStart = i * 2; // Sequential 2-second clips
        carefulData.clipStop = i * 2 + 1.8;
        carefulData.duration = 1.8;
      }

      milestone.data.push(carefulData);
    }

    // Add TranslationMerged if enabled (this is the "translation" track)
    if (hasTranslation) {
      const translationData: MilestoneData = {
        channel: 'TranslationMerged',
        data: `${audioPath}_Annotations/Translation_Merged.mp3`,
        linguisticType: 'default-lt',
        locale: 'en',
        mimeType: 'audio/mpeg'
      };

      if (withClipTimes) {
        translationData.clipStart = i * 2.5;
        translationData.clipStop = i * 2.5 + 2.2;
        translationData.duration = 2.2;
      }

      milestone.data.push(translationData);
    }

    currentTime += duration;
    milestones.push(milestone);
  }

  return {
    milestones,
    syncMedia: [videoPath, audioPath],
    name: `Test Timeline (${numMilestones} milestones)`,
    id: 'test-timeline-' + Date.now()
  };
}

/**
 * Pre-configured test scenarios for common use cases
 */
export const testScenarios = {
  /**
   * Simple: 3 milestones, video + audio only (no voiceovers)
   */
  simple: (): Timeline => generateTestTimeline({
    numMilestones: 3,
    videoPath: '/test/fixtures/media/test-video-5s.mp4',
    audioPath: '/test/fixtures/media/test-audio-5s.wav',
    hasCareful: false,
    hasTranslation: false,
    avgDuration: 1.5
  }),

  /**
   * Complex: 10 milestones with multilingual audio tracks
   */
  complex: (): Timeline => generateTestTimeline({
    numMilestones: 10,
    videoPath: '/test/fixtures/media/test-video-30s.mp4',
    audioPath: '/test/fixtures/media/test-audio-30s.wav',
    hasCareful: true,
    hasTranslation: true,
    avgDuration: 3
  }),

  /**
   * Edge case: Single very long milestone
   */
  singleLong: (): Timeline => generateTestTimeline({
    numMilestones: 1,
    videoPath: '/test/fixtures/media/test-video-30s.mp4',
    audioPath: '/test/fixtures/media/test-audio-30s.wav',
    hasCareful: true,
    hasTranslation: true,
    avgDuration: 30
  }),

  /**
   * Stress test: Many short milestones
   */
  manyShort: (): Timeline => generateTestTimeline({
    numMilestones: 50,
    videoPath: '/test/fixtures/media/test-video-30s.mp4',
    audioPath: '/test/fixtures/media/test-audio-30s.wav',
    hasCareful: true,
    hasTranslation: false,
    avgDuration: 0.6
  }),

  /**
   * Kings and Princes: Timeline for testing volume logic
   * Returns timeline + volume configuration
   */
  kingsAndPrinces: (): { timeline: Timeline; volumes: number[] } => ({
    timeline: generateTestTimeline({
      numMilestones: 5,
      videoPath: '/test/fixtures/media/test-video-30s.mp4',
      audioPath: '/test/fixtures/media/test-audio-30s.wav',
      hasCareful: true,
      hasTranslation: true,
      avgDuration: 5
    }),
    volumes: [0.8, 0.3, 0] // King=video audio (0.8), Prince=careful voiceover (0.3), Silent=translation (0)
  }),

  /**
   * No clips: Timeline with missing clip times (edge case)
   */
  noClipTimes: (): Timeline => generateTestTimeline({
    numMilestones: 3,
    videoPath: '/test/fixtures/media/test-video-5s.mp4',
    audioPath: '/test/fixtures/media/test-audio-5s.wav',
    hasCareful: true,
    hasTranslation: false,
    withClipTimes: false
  })
};

/**
 * Generate mock annotation table data (for AnnotTable component tests)
 */
export function generateAnnotationTable(numRows: number = 5) {
  const rows = [];
  let time = 0;

  for (let i = 0; i < numRows; i++) {
    rows.push({
      id: i,
      startTime: time,
      stopTime: time + 3,
      txtTransc: `Annotation ${i + 1}`,
      txtTransl: `Translation ${i + 1}`,
      audCareful: i % 2 === 0 ? 'careful-audio.mp3' : undefined,
      audTransl: i % 3 === 0 ? 'transl-audio.mp3' : undefined
    });
    time += 3.5;
  }

  return rows;
}
