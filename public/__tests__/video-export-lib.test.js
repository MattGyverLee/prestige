/**
 * Unit tests for video export library
 */

import { describe, it, expect } from 'vitest';
import {
  buildFilterComplex,
  buildTempoFilters,
  validateClip,
  calculateTotalDuration,
  getTempExportDir,
  generateConcatFileContent
} from '../video-export-lib.mjs';

describe('video-export-lib', () => {
  describe('buildTempoFilters', () => {
    it('should handle normal speed (1x)', () => {
      const filters = buildTempoFilters(1.0);
      expect(filters).toEqual(['atempo=1']);
    });

    it('should handle 2x speed', () => {
      const filters = buildTempoFilters(2.0);
      expect(filters).toEqual(['atempo=2']);
    });

    it('should stack filters for 4x speed', () => {
      const filters = buildTempoFilters(4.0);
      expect(filters).toEqual(['atempo=2.0', 'atempo=2']);
    });

    it('should stack filters for 8x speed', () => {
      const filters = buildTempoFilters(8.0);
      expect(filters).toEqual(['atempo=2.0', 'atempo=2.0', 'atempo=2']);
    });

    it('should handle non-power-of-2 speeds (3x)', () => {
      const filters = buildTempoFilters(3.0);
      expect(filters).toEqual(['atempo=2.0', 'atempo=1.5']);
    });

    it('should handle slow speed (0.5x)', () => {
      const filters = buildTempoFilters(0.5);
      expect(filters).toEqual(['atempo=0.5']);
    });

    it('should handle 0.75x speed', () => {
      const filters = buildTempoFilters(0.75);
      expect(filters).toEqual(['atempo=0.75']);
    });

    it('should stack filters for very slow speed (0.25x)', () => {
      const filters = buildTempoFilters(0.25);
      expect(filters).toEqual(['atempo=0.5', 'atempo=0.5']);
    });
  });

  describe('buildFilterComplex', () => {
    it('should build filter for 1x speed video with no volume adjustment', () => {
      const clip = {
        V1Speed: 1.0,
        A1Speed: 1.0,
        A1Vol: 1.0,
        isA2: false
      };

      const filter = buildFilterComplex(clip, false);

      // Video filter should use null passthrough at 1x speed
      expect(filter).toContain('[0:v]null[v]');
      expect(filter).toContain('[1:a]');
      expect(filter).toContain('[a1]');
      // Audio should use anull for passthrough
      expect(filter).toContain('anull');
    });

    it('should build filter for 2x speed video', () => {
      const clip = {
        V1Speed: 2.0,
        A1Speed: 2.0,
        A1Vol: 1.0,
        isA2: false
      };

      const filter = buildFilterComplex(clip, false);

      expect(filter).toContain('[0:v]setpts=0.5*PTS[v]'); // 1/2.0 = 0.5
      expect(filter).toContain('atempo=2'); // JS formats whole numbers without decimal
    });

    it('should apply volume adjustment to A1', () => {
      const clip = {
        V1Speed: 1.0,
        A1Speed: 1.0,
        A1Vol: 0.5,
        isA2: false
      };

      const filter = buildFilterComplex(clip, false);

      expect(filter).toContain('volume=0.5');
    });

    it('should mix A1 and A2 when isA2=true', () => {
      const clip = {
        V1Speed: 1.0,
        A1Speed: 1.0,
        A1Vol: 0.8,
        isA2: true,
        A2: '/path/to/audio',
        A2Speed: 1.5,
        A2Vol: 0.3
      };

      const filter = buildFilterComplex(clip, true);

      expect(filter).toContain('[a1]');
      expect(filter).toContain('[a2]');
      expect(filter).toContain('volume=0.8');
      expect(filter).toContain('volume=0.3');
      expect(filter).toContain('amix=inputs=2:duration=longest');
    });

    it('should handle complex speed (4x video, 3x audio)', () => {
      const clip = {
        V1Speed: 4.0,
        A1Speed: 3.0,
        A1Vol: 1.0,
        isA2: false
      };

      const filter = buildFilterComplex(clip, false);

      expect(filter).toContain('setpts=0.25*PTS[v]'); // 1/4.0 = 0.25
      expect(filter).toContain('atempo=2.0');
      expect(filter).toContain('atempo=1.5');
    });
  });

  describe('validateClip', () => {
    it('should validate a correct clip', () => {
      const clip = {
        V1: '/path/to/video.mp4',
        V1Start: 0,
        V1Stop: 10,
        V1Speed: 1.5,
        A1: '/path/to/audio.wav',
        A1Start: 0,
        A1Stop: 10,
        A1Speed: 1.5,
        A1Vol: 0.8,
        isA2: false
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing V1', () => {
      const clip = {
        A1: '/path/to/audio.wav',
        V1Start: 0,
        V1Stop: 10,
        V1Speed: 1.5
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing V1 (video source)');
    });

    it('should detect invalid time range (stop <= start)', () => {
      const clip = {
        V1: '/path/to/video.mp4',
        V1Start: 10,
        V1Stop: 5, // Invalid: stop before start
        V1Speed: 1.5,
        A1: '/path/to/audio.wav'
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('V1Stop must be greater than V1Start');
    });

    it('should detect negative speed', () => {
      const clip = {
        V1: '/path/to/video.mp4',
        V1Start: 0,
        V1Stop: 10,
        V1Speed: -1.5, // Invalid: negative speed
        A1: '/path/to/audio.wav'
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('V1Speed must be greater than 0');
    });

    it('should detect missing A2 when isA2=true', () => {
      const clip = {
        V1: '/path/to/video.mp4',
        V1Start: 0,
        V1Stop: 10,
        V1Speed: 1.5,
        A1: '/path/to/audio.wav',
        isA2: true
        // Missing A2, A2Start, A2Stop
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('isA2 is true but A2 is missing');
      expect(result.errors).toContain('isA2 is true but A2Start is missing');
      expect(result.errors).toContain('isA2 is true but A2Stop is missing');
    });

    it('should validate clip with A2', () => {
      const clip = {
        V1: '/path/to/video.mp4',
        V1Start: 0,
        V1Stop: 10,
        V1Speed: 1.5,
        A1: '/path/to/audio.wav',
        A1Start: 0,
        A1Stop: 10,
        A1Speed: 1.5,
        A1Vol: 0.8,
        isA2: true,
        A2: '/path/to/voiceover.mp3',
        A2Start: 0,
        A2Stop: 8,
        A2Speed: 1.2,
        A2Vol: 0.3
      };

      const result = validateClip(clip);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('calculateTotalDuration', () => {
    it('should calculate duration for single clip', () => {
      const clips = [
        {
          V1Start: 0,
          V1Stop: 10,
          V1Speed: 1.0
        }
      ];

      const duration = calculateTotalDuration(clips);

      expect(duration).toBe(10);
    });

    it('should calculate duration for 2x speed clip', () => {
      const clips = [
        {
          V1Start: 0,
          V1Stop: 10,
          V1Speed: 2.0
        }
      ];

      const duration = calculateTotalDuration(clips);

      expect(duration).toBe(5); // 10 seconds at 2x = 5 seconds output
    });

    it('should calculate total duration for multiple clips', () => {
      const clips = [
        {
          V1Start: 0,
          V1Stop: 10,
          V1Speed: 1.0
        },
        {
          V1Start: 10,
          V1Stop: 20,
          V1Speed: 2.0
        },
        {
          V1Start: 20,
          V1Stop: 30,
          V1Speed: 0.5
        }
      ];

      const duration = calculateTotalDuration(clips);

      expect(duration).toBe(35); // 10 + 5 + 20 = 35
    });
  });

  describe('getTempExportDir', () => {
    it('should generate temp directory path with timestamp', () => {
      const tempPath = '/tmp';
      const dir = getTempExportDir(tempPath);

      // Match both Unix (/) and Windows (\) path separators
      expect(dir).toMatch(/[\/\\]tmp[\/\\]prestige-export-\d+/);
    });

    it('should use provided base path', () => {
      const tempPath = '/custom/temp';
      const dir = getTempExportDir(tempPath);

      // Normalize path for cross-platform compatibility
      expect(dir.replace(/\\/g, '/')).toContain('/custom/temp');
    });
  });

  describe('generateConcatFileContent', () => {
    it('should generate concat file content for single clip', () => {
      const clipFiles = ['/tmp/clip_0.mp4'];
      const content = generateConcatFileContent(clipFiles);

      expect(content).toBe("file '/tmp/clip_0.mp4'");
    });

    it('should generate concat file content for multiple clips', () => {
      const clipFiles = [
        '/tmp/clip_0.mp4',
        '/tmp/clip_1.mp4',
        '/tmp/clip_2.mp4'
      ];
      const content = generateConcatFileContent(clipFiles);

      expect(content).toBe(
        "file '/tmp/clip_0.mp4'\nfile '/tmp/clip_1.mp4'\nfile '/tmp/clip_2.mp4'"
      );
    });

    it('should handle Windows-style paths', () => {
      const clipFiles = ['C:\\temp\\clip_0.mp4'];
      const content = generateConcatFileContent(clipFiles);

      expect(content).toBe("file 'C:\\temp\\clip_0.mp4'");
    });
  });
});
