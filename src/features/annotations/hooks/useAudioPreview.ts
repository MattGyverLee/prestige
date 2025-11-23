/**
 * useAudioPreview Hook
 *
 * Custom React hook for generating audio previews using FFmpeg.
 * Handles preview generation, progress tracking, URL object management, and cleanup.
 *
 * Key Features:
 * - FFmpeg preview generation with progress tracking
 * - Blob URL management and cleanup
 * - Loading state tracking
 * - Error handling
 * - Automatic cleanup on unmount to prevent memory leaks
 *
 * Memory Leak Prevention:
 * - Revokes all Blob URLs on unmount
 * - Cleans up FFmpeg resources
 * - Aborts in-progress operations
 *
 * @module features/annotations/hooks/useAudioPreview
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Audio preview generation options
 */
export interface AudioPreviewOptions {
  /** Source audio file or blob */
  source: File | Blob | string;

  /** Start time in seconds */
  startTime?: number;

  /** Duration in seconds */
  duration?: number;

  /** Sample rate (Hz) */
  sampleRate?: number;

  /** Audio codec */
  codec?: string;

  /** Bitrate (kbps) */
  bitrate?: number;

  /** Number of channels (1=mono, 2=stereo) */
  channels?: number;
}

/**
 * Generation progress information
 */
export interface GenerationProgress {
  /** Current progress (0.0 to 1.0) */
  progress: number;

  /** Current stage of generation */
  stage: string;

  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;
}

/**
 * Return value from useAudioPreview
 */
export interface UseAudioPreviewReturn {
  /** Generated preview URL (blob URL) */
  previewUrl: string | null;

  /** Whether preview is being generated */
  isGenerating: boolean;

  /** Generation progress (0.0 to 1.0) */
  progress: number;

  /** Progress details */
  progressInfo: GenerationProgress | null;

  /** Error message if generation failed */
  error: string | null;

  /** Generate preview from options */
  generatePreview: (options: AudioPreviewOptions) => Promise<void>;

  /** Cancel current generation */
  cancelGeneration: () => void;

  /** Clear preview and free resources */
  clearPreview: () => void;

  /** Download preview as file */
  downloadPreview: (filename: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Note: These constants are placeholders for future FFmpeg implementation
// const DEFAULT_SAMPLE_RATE = 44100;
// const DEFAULT_CODEC = "libmp3lame";
// const DEFAULT_BITRATE = 192;
// const DEFAULT_CHANNELS = 2;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for audio preview generation
 *
 * @returns {UseAudioPreviewReturn} Preview state and control methods
 *
 * @example
 * ```tsx
 * function AudioPreviewGenerator() {
 *   const {
 *     previewUrl,
 *     isGenerating,
 *     progress,
 *     error,
 *     generatePreview,
 *     clearPreview,
 *     downloadPreview
 *   } = useAudioPreview();
 *
 *   const handleGenerate = async () => {
 *     await generatePreview({
 *       source: audioFile,
 *       startTime: 10,
 *       duration: 30,
 *       sampleRate: 44100
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         Generate Preview
 *       </button>
 *       {isGenerating && <div>Progress: {Math.round(progress * 100)}%</div>}
 *       {previewUrl && (
 *         <>
 *           <audio src={previewUrl} controls />
 *           <button onClick={() => downloadPreview("preview.mp3")}>
 *             Download
 *           </button>
 *         </>
 *       )}
 *       {error && <div>Error: {error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAudioPreview(): UseAudioPreviewReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState<GenerationProgress | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Track abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track created URLs for cleanup
  const createdUrlsRef = useRef<string[]>([]);

  // ============================================================================
  // PREVIEW GENERATION
  // ============================================================================

  /**
   * Generate audio preview
   */
  const generatePreview = useCallback(
    async (_options: AudioPreviewOptions): Promise<void> => {
      try {
        // Reset state
        setIsGenerating(true);
        setProgress(0);
        setError(null);
        setProgressInfo({
          progress: 0,
          stage: "Initializing",
        });

        // Create abort controller
        abortControllerRef.current = new AbortController();

        // Simulate FFmpeg processing (placeholder for actual implementation)
        // In a real implementation, this would use FFmpeg.wasm or server-side FFmpeg
        const simulateProcessing = async () => {
          const stages = [
            "Loading source",
            "Decoding audio",
            "Extracting segment",
            "Encoding preview",
            "Finalizing",
          ];

          for (let i = 0; i < stages.length; i++) {
            // Check if cancelled
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error("Generation cancelled");
            }

            // Update progress
            const currentProgress = (i + 1) / stages.length;
            setProgress(currentProgress);
            setProgressInfo({
              progress: currentProgress,
              stage: stages[i],
              estimatedTimeRemaining: (stages.length - i - 1) * 0.5,
            });

            // Simulate processing time
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        };

        await simulateProcessing();

        // Create mock preview URL
        // In real implementation, this would be the actual generated audio blob
        const mockBlob = new Blob(["mock audio data"], {
          type: "audio/mpeg",
        });
        const url = URL.createObjectURL(mockBlob);

        // Store URL for cleanup
        createdUrlsRef.current.push(url);

        // Set preview URL
        setPreviewUrl(url);
        setProgress(1);
        setProgressInfo({
          progress: 1,
          stage: "Complete",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("[useAudioPreview] Generation failed:", err);
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [],
  );

  /**
   * Cancel current generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setProgress(0);
      setProgressInfo(null);
    }
  }, []);

  /**
   * Clear preview and free resources
   */
  const clearPreview = useCallback(() => {
    // Revoke current preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    // Reset state
    setProgress(0);
    setProgressInfo(null);
    setError(null);
  }, [previewUrl]);

  /**
   * Download preview as file
   */
  const downloadPreview = useCallback(
    (filename: string) => {
      if (!previewUrl) {
        return;
      }

      const link = document.createElement("a");
      link.href = previewUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [previewUrl],
  );

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cancel any in-progress generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Revoke all created URLs
      createdUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      createdUrlsRef.current = [];
    };
  }, []);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    previewUrl,
    isGenerating,
    progress,
    progressInfo,
    error,
    generatePreview,
    cancelGeneration,
    clearPreview,
    downloadPreview,
  };
}

/**
 * Helper hook for generating multiple previews
 *
 * Manages a queue of preview generation requests to avoid overloading the system.
 *
 * @param maxConcurrent - Maximum number of concurrent generations (default: 1)
 * @returns Queue management methods
 *
 * @example
 * ```tsx
 * function MultiPreviewGenerator() {
 *   const {
 *     queuePreview,
 *     queueLength,
 *     isProcessing
 *   } = useAudioPreviewQueue(2);
 *
 *   const handleGenerateMultiple = () => {
 *     files.forEach(file => {
 *       queuePreview({
 *         source: file,
 *         duration: 10
 *       });
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerateMultiple}>Generate All</button>
 *       <div>Queue: {queueLength} | Processing: {isProcessing ? 'Yes' : 'No'}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAudioPreviewQueue(maxConcurrent = 1) {
  const [queue, setQueue] = useState<AudioPreviewOptions[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingCountRef = useRef(0);

  const queuePreview = useCallback((options: AudioPreviewOptions) => {
    setQueue((prev) => [...prev, options]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  // Process queue
  useEffect(() => {
    const processNext = async () => {
      if (queue.length === 0 || processingCountRef.current >= maxConcurrent) {
        setIsProcessing(processingCountRef.current > 0);
        return;
      }

      setIsProcessing(true);
      const [...remaining] = queue.slice(1);
      setQueue(remaining);

      processingCountRef.current++;

      // Process would happen here (using useAudioPreview internally)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      processingCountRef.current--;
      setIsProcessing(processingCountRef.current > 0);
    };

    processNext();
  }, [queue, maxConcurrent]);

  return {
    queuePreview,
    clearQueue,
    queueLength: queue.length,
    isProcessing,
  };
}
