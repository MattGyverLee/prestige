/**
 * Audio Merge Hook
 *
 * Manages audio file merging using FFmpeg via Electron IPC.
 * Supports:
 * - Multiple input file merging
 * - Silence padding between clips
 * - Progress tracking
 * - Bitrate and channel configuration
 *
 * @module hooks/useAudioMerge
 */

import { useState, useCallback, useRef } from "react";
import { electronAPI } from "../../../utils/electronAPI";
import { safeParseSync, roundIt } from "../../../components/globalFunctions";

/**
 * Audio merge options
 */
export interface AudioMergeOptions {
  /**
   * Output bitrate (e.g., "128k")
   */
  bitrate?: string;
  /**
   * Number of audio channels (1 = mono, 2 = stereo)
   */
  channels?: number;
  /**
   * Path to silence audio file for padding
   */
  silencePath?: string;
}

/**
 * Audio conversion options
 */
export interface AudioConversionOptions {
  /**
   * Output bitrate (e.g., "128k")
   */
  bitrate?: string;
  /**
   * Number of audio channels
   */
  channels?: number;
  /**
   * Apply audio normalization
   */
  normalize?: boolean;
}

/**
 * Input file metadata
 */
export interface InputFileMetadata {
  /**
   * File path
   */
  file: string;
  /**
   * File name
   */
  name: string;
  /**
   * Duration in seconds
   */
  duration: number;
  /**
   * Reference start time from filename
   */
  refStart: string;
  /**
   * Reference stop time from filename
   */
  refStop: string;
}

/**
 * Audio merge result
 */
export interface MergeResult {
  /**
   * Output file URL
   */
  outputURL: string;
  /**
   * Timecodes from FFmpeg merge (silence padding boundaries)
   */
  timecodes: number[];
  /**
   * Metadata for all input files
   */
  inputMetadata: InputFileMetadata[];
}

/**
 * Audio merge hook return type
 */
export interface UseAudioMergeReturn {
  /**
   * Whether currently merging audio files
   */
  isMerging: boolean;
  /**
   * Whether currently converting audio
   */
  isConverting: boolean;
  /**
   * Merge progress (0-100)
   */
  progress: number;
  /**
   * Last error that occurred
   */
  error: Error | null;
  /**
   * Merge multiple audio files
   */
  mergeAudioFiles: (
    inputFiles: string[],
    outputPath: string,
    options?: AudioMergeOptions,
  ) => Promise<MergeResult | null>;
  /**
   * Convert audio file to MP3 with normalization
   */
  convertToMP3: (
    inputPath: string,
    outputPath: string,
    options?: AudioConversionOptions,
  ) => Promise<string | null>;
  /**
   * Collect metadata for input files
   */
  collectInputMetadata: (inputFiles: string[]) => Promise<InputFileMetadata[]>;
  /**
   * Clear the last error
   */
  clearError: () => void;
}

/**
 * useAudioMerge Hook
 *
 * Provides FFmpeg-based audio merging and conversion capabilities.
 * Handles progress tracking and error handling for long-running operations.
 *
 * @returns Audio merge state and methods
 *
 * @example
 * ```typescript
 * const { mergeAudioFiles, isMerging, progress } = useAudioMerge();
 *
 * const result = await mergeAudioFiles(
 *   ['/path/to/file1.mp3', '/path/to/file2.mp3'],
 *   '/path/to/output.mp3',
 *   { bitrate: '128k', channels: 1 }
 * );
 *
 * if (result) {
 *   console.log('Merged:', result.outputURL);
 *   console.log('Timecodes:', result.timecodes);
 * }
 * ```
 */
export function useAudioMerge(): UseAudioMergeReturn {
  const [isMerging, setIsMerging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const mergeAbortController = useRef<AbortController | null>(null);

  /**
   * Collect metadata for all input files
   *
   * For each input file, extracts:
   * - Duration from media metadata
   * - Start/stop times from filename
   */
  const collectInputMetadata = useCallback(
    async (inputFiles: string[]): Promise<InputFileMetadata[]> => {
      const inputTimes: InputFileMetadata[] = [];

      for (const filePath of inputFiles) {
        try {
          const metadata = await electronAPI.getMediaMetadata(filePath);
          const parsedPath = safeParseSync(filePath);
          const name = parsedPath.base;

          inputTimes.push({
            file: filePath,
            name,
            duration: roundIt(metadata.streams[0].duration, 3),
            refStart: name.split("_")[0],
            refStop: name.split("_")[2],
          });
        } catch (err) {
          console.error(
            `[useAudioMerge] Error getting metadata for ${filePath}:`,
            err,
          );
        }
      }

      // Sort by start time
      return inputTimes.sort(
        (a: InputFileMetadata, b: InputFileMetadata) =>
          parseFloat(a.refStart) - parseFloat(b.refStart),
      );
    },
    [],
  );

  /**
   * Merge multiple audio files into a single MP3 with silence padding
   */
  const mergeAudioFiles = useCallback(
    async (
      inputFiles: string[],
      outputPath: string,
      options: AudioMergeOptions = {},
    ): Promise<MergeResult | null> => {
      if (inputFiles.length === 0) {
        console.warn("[useAudioMerge] No input files provided for merging");
        return null;
      }

      setIsMerging(true);
      setProgress(0);
      setError(null);
      mergeAbortController.current = new AbortController();

      try {
        // Get current working directory for silence file
        const cwd = await electronAPI.getCwd();
        const silencePath = options.silencePath ?? `${cwd}/public/silence.wav`;

        console.log(
          `[useAudioMerge] Merging ${inputFiles.length} files to ${outputPath}`,
        );

        // Merge audio files using FFmpeg
        const mergeResult = await electronAPI.mergeAudioFiles(
          inputFiles,
          outputPath,
          {
            bitrate: options.bitrate ?? "128k",
            channels: options.channels ?? 1,
            silencePath,
          },
        );

        // Collect metadata for all input files
        const inputMetadata = await collectInputMetadata(inputFiles);

        // Convert output path to URL
        const outputURL = await electronAPI.pathToFileURL(outputPath);

        console.log("[useAudioMerge] Merge completed successfully");
        setProgress(100);
        setIsMerging(false);

        return {
          outputURL,
          timecodes: mergeResult.timecodes,
          inputMetadata,
        };
      } catch (err) {
        console.error("[useAudioMerge] Error merging audio files:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsMerging(false);
        setProgress(0);
        return null;
      }
    },
    [collectInputMetadata],
  );

  /**
   * Convert audio file to MP3 with optional normalization
   */
  const convertToMP3 = useCallback(
    async (
      inputPath: string,
      outputPath: string,
      options: AudioConversionOptions = {},
    ): Promise<string | null> => {
      setIsConverting(true);
      setProgress(0);
      setError(null);

      try {
        console.log(
          `[useAudioMerge] Converting ${inputPath} to MP3 at ${outputPath}`,
        );

        // Use secure API for FFmpeg conversion
        await electronAPI.convertAudioToMP3(inputPath, outputPath, {
          bitrate: options.bitrate ?? "128k",
          channels: options.channels ?? 2,
          normalize: options.normalize ?? true,
        });

        console.log("[useAudioMerge] MP3 conversion finished!");
        setProgress(100);
        setIsConverting(false);

        // Convert output path to URL
        const fileURL = await electronAPI.pathToFileURL(outputPath);
        return fileURL;
      } catch (err) {
        console.error("[useAudioMerge] Error converting to MP3:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsConverting(false);
        setProgress(0);
        return null;
      }
    },
    [],
  );

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isMerging,
    isConverting,
    progress,
    error,
    mergeAudioFiles,
    convertToMP3,
    collectInputMetadata,
    clearError,
  };
}
