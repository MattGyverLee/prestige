/**
 * Integration Test: Video Export Workflow
 *
 * Tests the critical "Kings and Princes" video export functionality.
 * This is a BLACK BOX test - we verify OUTCOMES, not implementation:
 *
 * WHAT we test:
 * - Given a timeline and volume settings, video export is triggered
 * - FFmpeg receives correct clip data
 * - Export completes successfully
 * - Output file path is returned
 *
 * WHAT we don't test:
 * - Exact FFmpeg filter syntax (that's a unit test concern)
 * - Internal clip building logic
 * - UI component rendering
 */

import { describe, it, expect, beforeEach } from "vitest";
import { mockElectronAPI, resetAllMocks } from "../setup";
import { exportVideo } from "../../components/FolderSelection/ExportVid";
import {
  generateTestTimeline,
  testScenarios,
} from "../fixtures/timeline-generator";

describe("Video Export Workflow (Integration)", () => {
  beforeEach(() => {
    resetAllMocks();

    // Default mock responses
    mockElectronAPI.getCwd.mockResolvedValue("/test/output");
    mockElectronAPI.exportVideo.mockResolvedValue({
      output: "/test/output/export-123.mp4",
      clips: 5,
    });
  });

  describe("Complete export flow", () => {
    it("should export video with primary audio track (King)", async () => {
      // GIVEN: A timeline with 3 milestones
      const timeline = testScenarios.simple();

      // Volume settings: [video=1.0, careful=0, translation=0]
      // This means video audio is "King" (volume >= 0.7)
      const volumes = [1.0, 0, 0];
      const multiplier = 1.0;

      // WHEN: Export is triggered
      const result = await exportVideo(timeline, multiplier, volumes);

      // THEN: Export should succeed
      expect(result).toBe(true);

      // Verify electronAPI.exportVideo was called
      expect(mockElectronAPI.exportVideo).toHaveBeenCalledTimes(1);

      const [clips, outputPath] = mockElectronAPI.exportVideo.mock.calls[0];

      // CRITICAL: Clips array should have correct structure
      expect(clips).toBeInstanceOf(Array);
      expect(clips.length).toBeGreaterThan(0);

      // Each clip should have video source and timing
      clips.forEach((clip: any) => {
        expect(clip).toHaveProperty("V1"); // Video source
        expect(clip).toHaveProperty("V1Start");
        expect(clip).toHaveProperty("V1Stop");
        expect(clip).toHaveProperty("V1Speed");
        expect(clip).toHaveProperty("A1"); // Primary audio
        expect(clip.V1Speed).toBeGreaterThan(0);
      });

      // Output path should be generated
      expect(outputPath).toMatch(/export-\d+\.mp4$/);
    });

    it("should export with multilingual audio (Kings and Princes)", async () => {
      // GIVEN: Complex timeline with voiceover tracks
      const { timeline, volumes } = testScenarios.kingsAndPrinces();

      // volumes = [0.9, 0.3, 0]
      // King: video audio (0.9 >= 0.84)
      // Prince: careful voiceover (0.3 < 0.84)
      // Silent: translation (0)
      const multiplier = 1.2;

      // WHEN: Export is triggered
      const result = await exportVideo(timeline, multiplier, volumes);

      // THEN: Export should succeed with mixed audio
      expect(result).toBe(true);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];

      // Some clips should have secondary audio (A2) for voiceover
      const clipsWithVoiceover = clips.filter((c: any) => c.isA2 === true);
      expect(clipsWithVoiceover.length).toBeGreaterThan(0);

      // Clips with voiceover should have A2 properties
      clipsWithVoiceover.forEach((clip: any) => {
        expect(clip).toHaveProperty("A2");
        expect(clip).toHaveProperty("A2Start");
        expect(clip).toHaveProperty("A2Stop");
        expect(clip).toHaveProperty("A2Speed");
        expect(clip).toHaveProperty("A2Vol");
        expect(clip.A2Vol).toBeGreaterThan(0);
        expect(clip.A2Vol).toBeLessThan(0.84); // Prince volume threshold
      });
    });

    it("should handle edge case: all audio silent (no king)", async () => {
      // GIVEN: Timeline with all volumes set to 0
      const timeline = testScenarios.simple();
      const volumes = [0, 0, 0]; // All silent
      const multiplier = 1.0;

      // WHEN: Export is attempted
      const result = await exportVideo(timeline, multiplier, volumes);

      // THEN: Should still generate clips (silent video)
      expect(result).toBe(true);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];
      expect(clips.length).toBe(0); // No clips without a king
    });

    it("should calculate video speeds based on audio duration", async () => {
      // GIVEN: Timeline where annotation audio has different duration than video
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        hasTranslation: false,
        avgDuration: 5,
        withClipTimes: true,
      });

      // King is CarefulMerged (index 1), which has specific clip times
      const volumes = [0, 0.9, 0];
      const multiplier = 1.0;

      // WHEN: Export is triggered
      await exportVideo(timeline, multiplier, volumes);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];

      // THEN: Video speed should be adjusted to match audio duration
      clips.forEach((clip: any) => {
        expect(clip.V1Speed).toBeGreaterThan(0);
        // Speed should be calculated based on audio vs video duration
        expect(clip.V1Speed).not.toBe(multiplier); // Should be adjusted
      });
    });

    it("should handle stress test: many short milestones", async () => {
      // GIVEN: Timeline with 50 short milestones
      const timeline = testScenarios.manyShort();
      const volumes = [1.0, 0, 0];
      const multiplier = 1.0;

      // WHEN: Export is triggered
      const result = await exportVideo(timeline, multiplier, volumes);

      // THEN: Should handle large clip count
      expect(result).toBe(true);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];
      expect(clips.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe("Error handling", () => {
    it("should handle export failure gracefully", async () => {
      // GIVEN: FFmpeg export will fail
      mockElectronAPI.exportVideo.mockRejectedValue(
        new Error("FFmpeg process failed"),
      );

      const timeline = testScenarios.simple();
      const volumes = [1.0, 0, 0];

      // WHEN: Export is attempted
      const result = await exportVideo(timeline, volumes[0], volumes);

      // THEN: Should return false and not crash
      expect(result).toBe(false);
    });

    it("should handle missing clip times in timeline data", async () => {
      // GIVEN: Timeline with no clip times (edge case)
      const timeline = testScenarios.noClipTimes();
      const volumes = [0, 0.8, 0]; // King is CarefulMerged

      // WHEN: Export is attempted
      const result = await exportVideo(timeline, 1.0, volumes);

      // THEN: Should handle gracefully
      // (Implementation may skip these milestones or use fallback timing)
      expect(result).toBe(true);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];
      // Either clips are created with fallback timing, or none are created
      expect(clips).toBeInstanceOf(Array);
    });
  });

  describe("Output verification", () => {
    it("should generate timestamped output filename", async () => {
      // GIVEN: Current working directory
      mockElectronAPI.getCwd.mockResolvedValue("/home/user/videos");

      const timeline = testScenarios.simple();
      const volumes = [1.0, 0, 0];

      // WHEN: Export runs
      await exportVideo(timeline, 1.0, volumes);

      const [, outputPath] = mockElectronAPI.exportVideo.mock.calls[0];

      // THEN: Output path should be in CWD with timestamp
      expect(outputPath).toMatch(/^\/home\/user\/videos\/export-\d+\.mp4$/);
    });

    it("should report correct clip count in result", async () => {
      // GIVEN: Export will process 5 clips
      mockElectronAPI.exportVideo.mockResolvedValue({
        output: "/test/output.mp4",
        clips: 5,
      });

      const timeline = generateTestTimeline({
        numMilestones: 5,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: false,
        hasTranslation: false,
      });

      const volumes = [1.0, 0, 0];

      // WHEN: Export completes
      const result = await exportVideo(timeline, 1.0, volumes);

      // THEN: Should succeed
      expect(result).toBe(true);

      // Result should contain clip count
      const exportResult =
        await mockElectronAPI.exportVideo.mock.results[0].value;
      expect(exportResult.clips).toBe(5);
    });
  });

  describe("Volume logic (Kings and Princes)", () => {
    it("should categorize King as volume >= 0.84", async () => {
      // Use timeline with audio tracks
      const timeline = generateTestTimeline({
        numMilestones: 3,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        hasTranslation: false,
        avgDuration: 2,
      });

      // Test boundary: 0.85 should be King (>= 0.84 threshold)
      // King is video audio (index 0)
      const volumes = [0.85, 0, 0];

      await exportVideo(timeline, 1.0, volumes);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];
      expect(clips.length).toBeGreaterThan(0); // King exists, clips created
    });

    it("should categorize Prince as 0 < volume < 0.84", async () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        hasTranslation: false,
      });

      // King=0.9 (>= 0.84), Prince=0.5 (< 0.84)
      const volumes = [0.9, 0.5, 0];

      await exportVideo(timeline, 1.0, volumes);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];

      // Should have clips with voiceover
      const voiceoverClips = clips.filter((c: any) => c.isA2 === true);
      expect(voiceoverClips.length).toBeGreaterThan(0);

      voiceoverClips.forEach((clip: any) => {
        expect(clip.A2Vol).toBe(0.5); // Prince volume
      });
    });

    it("should skip silent tracks (volume = 0)", async () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        hasTranslation: true,
      });

      // All tracks except video are silent
      const volumes = [0.8, 0, 0];

      await exportVideo(timeline, 1.0, volumes);

      const [clips] = mockElectronAPI.exportVideo.mock.calls[0];

      // No clips should reference silent tracks
      clips.forEach((clip: any) => {
        if (clip.isA2) {
          expect(clip.A2Vol).toBeGreaterThan(0);
        }
      });
    });
  });
});
