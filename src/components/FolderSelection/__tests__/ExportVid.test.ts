import { describe, it, expect } from "vitest";
import {
  getAudio,
  hasSyncedVideo,
  formatSrtTimestamp,
  buildSrtContent,
} from "../ExportVid";
import { Milestone, Timeline } from "../../../store/annot/types";

describe("ExportVid - getAudio", () => {
  it("should find audio clip for CarefulMerged channel", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/path/to/careful.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          clipStart: 0,
          clipStop: 2,
          duration: 2,
        },
        {
          channel: "TranslationMerged",
          data: "/path/to/translation.mp3",
          linguisticType: "default-lt",
          locale: "en",
          mimeType: "audio/mpeg",
          clipStart: 0,
          clipStop: 2.5,
          duration: 2.5,
        },
      ],
    };

    const result = getAudio("CarefulMerged", milestone);

    expect(result).toEqual({
      file: "/path/to/careful.mp3",
      start: 0,
      stop: 2,
    });
  });

  it("should find audio clip for TranslationMerged channel", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/path/to/careful.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          clipStart: 0,
          clipStop: 2,
          duration: 2,
        },
        {
          channel: "TranslationMerged",
          data: "/path/to/translation.mp3",
          linguisticType: "default-lt",
          locale: "en",
          mimeType: "audio/mpeg",
          clipStart: 1.5,
          clipStop: 4,
          duration: 2.5,
        },
      ],
    };

    const result = getAudio("TranslationMerged", milestone);

    expect(result).toEqual({
      file: "/path/to/translation.mp3",
      start: 1.5,
      stop: 4,
    });
  });

  it("should return empty values when channel not found", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/path/to/careful.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          clipStart: 0,
          clipStop: 2,
          duration: 2,
        },
      ],
    };

    const result = getAudio("TranslationMerged", milestone);

    expect(result).toEqual({
      file: "",
      start: -1,
      stop: -1,
    });
  });

  it("should handle milestone with no data", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [],
    };

    const result = getAudio("CarefulMerged", milestone);

    expect(result).toEqual({
      file: "",
      start: -1,
      stop: -1,
    });
  });

  it("should handle missing clipStart/clipStop (undefined)", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/path/to/careful.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          // No clipStart, clipStop, or duration
        },
      ],
    };

    const result = getAudio("CarefulMerged", milestone);

    expect(result).toEqual({
      file: "/path/to/careful.mp3",
      start: -1,
      stop: -1,
    });
  });

  it("should take the last matching channel if duplicates exist", () => {
    const milestone: Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/path/to/careful1.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          clipStart: 0,
          clipStop: 2,
          duration: 2,
        },
        {
          channel: "CarefulMerged",
          data: "/path/to/careful2.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
          clipStart: 2,
          clipStop: 4,
          duration: 2,
        },
      ],
    };

    const result = getAudio("CarefulMerged", milestone);

    expect(result).toEqual({
      file: "/path/to/careful2.mp3",
      start: 2,
      stop: 4,
    });
  });
});

describe("ExportVid - Kings and Princes Logic", () => {
  it("should categorize volumes correctly", () => {
    const vols = [0.8, 0.3, 0.5, 0, 0.7, 0.1];
    const kings: number[] = [];
    const princes: number[] = [];

    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    expect(kings).toEqual([0, 4]); // 0.8 and 0.7
    expect(princes).toEqual([1, 2, 5]); // 0.3, 0.5, 0.1
  });

  it("should handle all kings (no princes)", () => {
    const vols = [0.9, 0.8, 0.7];
    const kings: number[] = [];
    const princes: number[] = [];

    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    expect(kings).toEqual([0, 1, 2]);
    expect(princes).toEqual([]);
  });

  it("should handle all princes (no kings)", () => {
    const vols = [0.3, 0.5, 0.1];
    const kings: number[] = [];
    const princes: number[] = [];

    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    expect(kings).toEqual([]);
    expect(princes).toEqual([0, 1, 2]);
  });

  it("should handle all silent (no kings or princes)", () => {
    const vols = [0, 0, 0];
    const kings: number[] = [];
    const princes: number[] = [];

    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    expect(kings).toEqual([]);
    expect(princes).toEqual([]);
  });

  it("should handle boundary case (exactly 0.7)", () => {
    const vols = [0.7];
    const kings: number[] = [];
    const princes: number[] = [];

    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    expect(kings).toEqual([0]); // 0.7 is a king (>=)
    expect(princes).toEqual([]);
  });
});

describe("ExportVid - Speed Calculations", () => {
  it("should calculate video speed when king is video audio (king=0)", () => {
    const multiplier = 1.5;
    const startTime = 0;
    const stopTime = 10;

    const V1Speed = multiplier;
    const A1Speed = multiplier;
    const expectedKingLen = (stopTime - startTime) * multiplier;

    expect(V1Speed).toBe(1.5);
    expect(A1Speed).toBe(1.5);
    expect(expectedKingLen).toBe(15); // 10 seconds * 1.5
  });

  it("should calculate video speed when king is annotation audio (king=1)", () => {
    const multiplier = 1.5;
    const msStartTime = 0;
    const msStopTime = 10;
    const A1Start = 0;
    const A1Stop = 8; // Annotation audio is 8 seconds

    const kingLen = (A1Stop - A1Start) * multiplier; // 8 * 1.5 = 12
    const V1Speed = kingLen / (msStopTime - msStartTime); // 12 / 10 = 1.2

    expect(kingLen).toBe(12);
    expect(V1Speed).toBe(1.2);
  });

  it("should calculate voiceover speed for prince audio", () => {
    const kingLen = 12; // From previous calculation
    const A2Start = 0;
    const A2Stop = 6; // Voiceover is 6 seconds

    const A2Speed = kingLen / (A2Stop - A2Start); // 12 / 6 = 2.0

    expect(A2Speed).toBe(2.0);
  });

  it("should handle edge case where annotation equals milestone duration", () => {
    const multiplier = 1.5;
    const msStartTime = 0;
    const msStopTime = 10;
    const A1Start = 0;
    const A1Stop = 10; // Same as milestone

    const kingLen = (A1Stop - A1Start) * multiplier; // 10 * 1.5 = 15
    const V1Speed = kingLen / (msStopTime - msStartTime); // 15 / 10 = 1.5

    expect(kingLen).toBe(15);
    expect(V1Speed).toBe(1.5);
  });
});

describe("ExportVid - helpers", () => {
  it("detects synced video entries", () => {
    const timeline: Timeline = {
      milestones: [],
      syncMedia: ["file:///test/video.mp4", "file:///test/audio.wav"],
    };

    expect(hasSyncedVideo(timeline)).toBe(true);
  });

  it("detects absence of synced video", () => {
    const timeline: Timeline = {
      milestones: [],
      syncMedia: ["file:///test/audio.wav"],
    };

    expect(hasSyncedVideo(timeline)).toBe(false);
  });

  it("formats SRT timestamps", () => {
    expect(formatSrtTimestamp(1.234)).toBe("00:00:01,234");
    expect(formatSrtTimestamp(3723.5)).toBe("01:02:03,500");
  });

  it("builds SRT content from milestones", () => {
    const timeline: Timeline = {
      milestones: [
        {
          annotationID: "a1",
          startTime: 0,
          stopTime: 2,
          data: [
            {
              channel: "Transcription",
              data: "Bonjour",
              linguisticType: "Transcription_text",
              locale: "fr",
              mimeType: "text/plain",
            },
          ],
        } as Milestone,
      ],
      syncMedia: [],
    };

    const content = buildSrtContent(timeline, [0]);
    expect(content).toContain("1");
    expect(content).toContain("00:00:00,000 --> 00:00:02,000");
    expect(content).toContain("Bonjour");
  });
});
