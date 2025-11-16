import { describe, it, expect } from "vitest";
import {
  generateTestTimeline,
  testScenarios,
  generateAnnotationTable,
} from "../timeline-generator";

describe("Timeline Generator", () => {
  describe("generateTestTimeline", () => {
    it("should generate timeline with specified number of milestones", () => {
      const timeline = generateTestTimeline({
        numMilestones: 5,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
      });

      expect(timeline.milestones).toHaveLength(5);
    });

    it("should set correct syncMedia paths", () => {
      const timeline = generateTestTimeline({
        numMilestones: 3,
        videoPath: "/custom/video.mp4",
        audioPath: "/custom/audio.wav",
      });

      expect(timeline.syncMedia).toEqual([
        "/custom/video.mp4",
        "/custom/audio.wav",
      ]);
    });

    it("should generate milestones with sequential times", () => {
      const timeline = generateTestTimeline({
        numMilestones: 3,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        avgDuration: 5,
      });

      // First milestone should start at 0
      expect(timeline.milestones[0].startTime).toBe(0);

      // Each milestone should have startTime < stopTime
      timeline.milestones.forEach((ms) => {
        expect(ms.stopTime).toBeGreaterThan(ms.startTime);
      });

      // Second milestone should start after first ends
      expect(timeline.milestones[1].startTime).toBeCloseTo(
        timeline.milestones[0].stopTime,
        1,
      );
    });

    it("should include CarefulMerged data when hasCareful=true", () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        hasTranslation: false,
      });

      timeline.milestones.forEach((ms) => {
        const carefulData = ms.data.find((d) => d.channel === "CarefulMerged");
        expect(carefulData).toBeDefined();
        expect(carefulData?.data).toContain("Careful_Merged.mp3");
      });
    });

    it("should include TranslationMerged data when hasTranslation=true", () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: false,
        hasTranslation: true,
      });

      timeline.milestones.forEach((ms) => {
        const translData = ms.data.find(
          (d) => d.channel === "TranslationMerged",
        );
        expect(translData).toBeDefined();
        expect(translData?.data).toContain("Translation_Merged.mp3");
      });
    });

    it("should include clip times when withClipTimes=true", () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        withClipTimes: true,
      });

      timeline.milestones.forEach((ms) => {
        ms.data.forEach((d) => {
          expect(d.clipStart).toBeDefined();
          expect(d.clipStop).toBeDefined();
          expect(d.duration).toBeDefined();
          expect(d.clipStop!).toBeGreaterThan(d.clipStart!);
        });
      });
    });

    it("should omit clip times when withClipTimes=false", () => {
      const timeline = generateTestTimeline({
        numMilestones: 2,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
        hasCareful: true,
        withClipTimes: false,
      });

      timeline.milestones.forEach((ms) => {
        ms.data.forEach((d) => {
          expect(d.clipStart).toBeUndefined();
          expect(d.clipStop).toBeUndefined();
          expect(d.duration).toBeUndefined();
        });
      });
    });

    it("should generate unique annotation IDs", () => {
      const timeline = generateTestTimeline({
        numMilestones: 5,
        videoPath: "/test/video.mp4",
        audioPath: "/test/audio.wav",
      });

      const ids = timeline.milestones.map((ms) => ms.annotationID);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("testScenarios", () => {
    it("simple scenario should generate 3 milestones without voiceovers", () => {
      const timeline = testScenarios.simple();

      expect(timeline.milestones).toHaveLength(3);
      timeline.milestones.forEach((ms) => {
        expect(ms.data).toHaveLength(0); // No careful or translation
      });
    });

    it("complex scenario should generate 10 milestones with both voiceovers", () => {
      const timeline = testScenarios.complex();

      expect(timeline.milestones).toHaveLength(10);
      timeline.milestones.forEach((ms) => {
        expect(ms.data).toHaveLength(2); // Both careful and translation
        const channels = ms.data.map((d) => d.channel);
        expect(channels).toContain("CarefulMerged");
        expect(channels).toContain("TranslationMerged");
      });
    });

    it("singleLong scenario should generate 1 milestone with ~30s average", () => {
      const timeline = testScenarios.singleLong();

      expect(timeline.milestones).toHaveLength(1);
      const duration =
        timeline.milestones[0].stopTime - timeline.milestones[0].startTime;
      // Generator adds ±1s variance, so 30s ±1s is expected
      expect(duration).toBeGreaterThanOrEqual(29);
      expect(duration).toBeLessThanOrEqual(31);
    });

    it("manyShort scenario should generate 50 milestones", () => {
      const timeline = testScenarios.manyShort();

      expect(timeline.milestones).toHaveLength(50);
    });

    it("kingsAndPrinces scenario should return timeline with volume config", () => {
      const { timeline, volumes } = testScenarios.kingsAndPrinces();

      expect(timeline.milestones).toHaveLength(5);
      expect(volumes).toHaveLength(3);
      expect(volumes[0]).toBe(0.9); // King (>= 0.84 threshold)
      expect(volumes[1]).toBe(0.3); // Prince (< 0.84)
      expect(volumes[2]).toBe(0); // Silent
    });

    it("noClipTimes scenario should have milestones without clip times", () => {
      const timeline = testScenarios.noClipTimes();

      timeline.milestones.forEach((ms) => {
        ms.data.forEach((d) => {
          expect(d.clipStart).toBeUndefined();
          expect(d.clipStop).toBeUndefined();
        });
      });
    });
  });

  describe("generateAnnotationTable", () => {
    it("should generate specified number of rows", () => {
      const table = generateAnnotationTable(10);

      expect(table).toHaveLength(10);
    });

    it("should generate rows with sequential IDs", () => {
      const table = generateAnnotationTable(5);

      table.forEach((row, index) => {
        expect(row.id).toBe(index);
      });
    });

    it("should generate rows with text fields", () => {
      const table = generateAnnotationTable(3);

      table.forEach((row, index) => {
        expect(row.txtTransc).toBe(`Annotation ${index + 1}`);
        expect(row.txtTransl).toBe(`Translation ${index + 1}`);
      });
    });

    it("should include audio files based on index pattern", () => {
      const table = generateAnnotationTable(6);

      // Index 0: even (has careful), divisible by 3 (has transl)
      expect(table[0].audCareful).toBe("careful-audio.mp3");
      expect(table[0].audTransl).toBe("transl-audio.mp3");

      // Index 1: odd (no careful), not divisible by 3 (no transl)
      expect(table[1].audCareful).toBeUndefined();
      expect(table[1].audTransl).toBeUndefined();

      // Index 2: even (has careful), not divisible by 3 (no transl)
      expect(table[2].audCareful).toBe("careful-audio.mp3");
      expect(table[2].audTransl).toBeUndefined();

      // Index 3: odd (no careful), divisible by 3 (has transl)
      expect(table[3].audCareful).toBeUndefined();
      expect(table[3].audTransl).toBe("transl-audio.mp3");
    });

    it("should generate rows with sequential times", () => {
      const table = generateAnnotationTable(5);

      table.forEach((row, index) => {
        expect(row.stopTime).toBeGreaterThan(row.startTime);
        if (index > 0) {
          expect(row.startTime).toBeGreaterThan(table[index - 1].startTime);
        }
      });
    });
  });
});
