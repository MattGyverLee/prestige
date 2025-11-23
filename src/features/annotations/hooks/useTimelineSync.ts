/**
 * useTimelineSync Hook
 *
 * Custom React hook for synchronizing video player time with multiple WaveSurfer instances.
 * Ensures all waveforms stay in sync with the video playback position.
 *
 * Key Features:
 * - Multi-timeline synchronization
 * - Video time to waveform position sync
 * - Previous time tracking to prevent infinite loops
 * - Automatic seeking when video position changes
 * - Support for up to 3 WaveSurfer instances
 *
 * Synchronization Strategy:
 * - Tracks previous video time to detect changes
 * - Only syncs when time changes significantly (> 0.1s difference)
 * - Seeks all wavesurfers to normalized position (0.0 to 1.0)
 * - Prevents feedback loops from wavesurfer seek events
 *
 * @module features/annotations/hooks/useTimelineSync
 */

import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for timeline synchronization
 */
export interface UseTimelineSyncOptions {
  /** Current video time in seconds */
  currentTime: number;

  /** Array of WaveSurfer instances to sync (max 3) */
  wavesurfers: (WaveSurfer | null)[];

  /** Enable/disable synchronization */
  enabled?: boolean;

  /** Minimum time difference to trigger sync (seconds) */
  threshold?: number;

  /** Debug logging */
  debug?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default threshold for time difference to trigger sync (0.1 seconds)
 * Prevents excessive seeking for tiny time changes
 */
const DEFAULT_THRESHOLD = 0.1;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for synchronizing video time with waveforms
 *
 * @param {UseTimelineSyncOptions} options - Synchronization options
 *
 * @example
 * ```tsx
 * function DeeJayComponent() {
 *   const currentTime = useSelector((state) => state.player.currentTime);
 *
 *   const ws0 = useWaveSurfer({ containerId: "waveform0" });
 *   const ws1 = useWaveSurfer({ containerId: "waveform1" });
 *   const ws2 = useWaveSurfer({ containerId: "waveform2" });
 *
 *   // Sync all waveforms with video player
 *   useTimelineSync({
 *     currentTime,
 *     wavesurfers: [
 *       ws0.wavesurfer,
 *       ws1.wavesurfer,
 *       ws2.wavesurfer
 *     ],
 *     enabled: true,
 *     debug: false
 *   });
 *
 *   return (
 *     <div>
 *       <div id="waveform0" />
 *       <div id="waveform1" />
 *       <div id="waveform2" />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTimelineSync(options: UseTimelineSyncOptions): void {
  const {
    currentTime,
    wavesurfers,
    enabled = true,
    threshold = DEFAULT_THRESHOLD,
    debug = false,
  } = options;

  // Track previous time to detect changes
  const previousTimeRef = useRef<number>(currentTime);

  /**
   * Synchronize all wavesurfers when video time changes
   */
  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Calculate time difference
    const timeDiff = Math.abs(currentTime - previousTimeRef.current);

    // Only sync if time changed significantly
    if (timeDiff < threshold) {
      return;
    }

    if (debug) {
      console.log(
        `[useTimelineSync] Syncing waveforms to time ${currentTime.toFixed(2)}s (diff: ${timeDiff.toFixed(2)}s)`,
      );
    }

    // Sync each wavesurfer
    wavesurfers.forEach((ws, index) => {
      if (!ws) {
        return;
      }

      const duration = ws.getDuration();
      if (duration <= 0) {
        return;
      }

      // Calculate normalized position (0.0 to 1.0)
      const normalizedPosition = Math.min(
        Math.max(currentTime / duration, 0),
        1,
      );

      // Seek to position
      ws.seekTo(normalizedPosition);

      if (debug) {
        console.log(
          `[useTimelineSync] WS${index} seeked to ${normalizedPosition.toFixed(3)} (${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s)`,
        );
      }
    });

    // Update previous time
    previousTimeRef.current = currentTime;
  }, [currentTime, wavesurfers, enabled, threshold, debug]);
}

/**
 * Alternative hook with manual control over synchronization
 *
 * Returns a function to manually trigger sync instead of auto-syncing on time change.
 *
 * @param {WaveSurfer[]} wavesurfers - Array of WaveSurfer instances
 * @returns {(time: number) => void} Function to sync all wavesurfers to a specific time
 *
 * @example
 * ```tsx
 * function DeeJayComponent() {
 *   const ws0 = useWaveSurfer({ containerId: "waveform0" });
 *   const ws1 = useWaveSurfer({ containerId: "waveform1" });
 *
 *   const syncToTime = useManualTimelineSync([
 *     ws0.wavesurfer,
 *     ws1.wavesurfer
 *   ]);
 *
 *   const handleSeek = (time: number) => {
 *     syncToTime(time);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleSeek(10.0)}>Seek to 10s</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useManualTimelineSync(
  wavesurfers: (WaveSurfer | null)[],
): (time: number) => void {
  return (time: number) => {
    wavesurfers.forEach((ws) => {
      if (!ws) {
        return;
      }

      const duration = ws.getDuration();
      if (duration <= 0) {
        return;
      }

      const normalizedPosition = Math.min(Math.max(time / duration, 0), 1);
      ws.seekTo(normalizedPosition);
    });
  };
}
