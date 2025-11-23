/**
 * useMultiTrackPlayback Hook
 *
 * Custom React hook for managing synchronized playback across multiple audio tracks.
 * Handles volume control, playback rate synchronization, and simultaneous play/pause.
 *
 * Key Features:
 * - High/low audio track management (volume-based classification)
 * - Volume control per track
 * - Playback rate synchronization across all tracks
 * - Simultaneous play/pause across active tracks
 * - Solo/mute functionality
 * - Active track detection
 *
 * Track Classification:
 * - "Highs": Tracks with volume > 0.5^0.25 (≈0.84) - primary audio
 * - "Lows": Tracks with volume ≤ 0.5^0.25 (≈0.84) - voiceovers
 * - Inactive: Tracks with volume = 0 (muted)
 *
 * @module features/annotations/hooks/useMultiTrackPlayback
 */

import { useCallback, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Track information
 */
export interface Track {
  /** WaveSurfer instance */
  wavesurfer: WaveSurfer | null;

  /** Track index (0 = source, 1 = careful, 2 = translation) */
  index: number;

  /** Current volume (0.0 to 1.0) */
  volume: number;

  /** Current playback rate */
  playbackRate: number;

  /** Whether track is ready */
  isReady: boolean;
}

/**
 * Return value from useMultiTrackPlayback
 */
export interface UseMultiTrackPlaybackReturn {
  /** Play all active tracks */
  playAll: (start?: number, end?: number) => void;

  /** Pause all active tracks */
  pauseAll: () => void;

  /** Stop all tracks */
  stopAll: () => void;

  /** Set volume for a specific track */
  setTrackVolume: (trackIndex: number, volume: number) => void;

  /** Set playback rate for all tracks */
  setGlobalPlaybackRate: (rate: number) => void;

  /** Set playback rate for a specific track */
  setTrackPlaybackRate: (trackIndex: number, rate: number) => void;

  /** Solo a track (mute all others) */
  solo: (trackIndex: number, resetAll?: boolean) => void;

  /** Get active track indices */
  getActiveTracks: () => number[];

  /** Get "high" track indices (volume > threshold) */
  getHighTracks: () => number[];

  /** Get "low" track indices (volume <= threshold, > 0) */
  getLowTracks: () => number[];

  /** Check if any track is playing */
  isAnyPlaying: () => boolean;

  /** Get all track volumes */
  getVolumes: () => number[];

  /** Sync playback rates across tracks */
  syncPlaybackRates: (baseRate: number, multiplier: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Volume threshold for high/low classification
 * Tracks above this are "highs", below are "lows"
 * 0.5^0.25 ≈ 0.84
 */
const HIGH_LOW_THRESHOLD = 0.5 ** 0.25;

/**
 * Maximum playback rate
 */
const MAX_PLAYBACK_RATE = 14.5;

/**
 * Minimum playback rate
 */
const MIN_PLAYBACK_RATE = 0.2;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Clamp playback rate to valid range
 */
function clampPlaybackRate(rate: number): number {
  return Math.max(MIN_PLAYBACK_RATE, Math.min(MAX_PLAYBACK_RATE, rate));
}

/**
 * Round to 2 decimal places
 */
function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for multi-track playback control
 *
 * @param {Track[]} tracks - Array of track objects with WaveSurfer instances
 * @returns {UseMultiTrackPlaybackReturn} Playback control methods
 *
 * @example
 * ```tsx
 * function MultiTrackPlayer() {
 *   const ws0 = useWaveSurfer({ containerId: "waveform0" });
 *   const ws1 = useWaveSurfer({ containerId: "waveform1" });
 *   const ws2 = useWaveSurfer({ containerId: "waveform2" });
 *
 *   const [volumes, setVolumes] = useState([1, 0, 0]);
 *   const [playbackRates, setPlaybackRates] = useState([1, 1, 1]);
 *
 *   const tracks: Track[] = [
 *     {
 *       wavesurfer: ws0.wavesurfer,
 *       index: 0,
 *       volume: volumes[0],
 *       playbackRate: playbackRates[0],
 *       isReady: ws0.isReady
 *     },
 *     {
 *       wavesurfer: ws1.wavesurfer,
 *       index: 1,
 *       volume: volumes[1],
 *       playbackRate: playbackRates[1],
 *       isReady: ws1.isReady
 *     },
 *     {
 *       wavesurfer: ws2.wavesurfer,
 *       index: 2,
 *       volume: volumes[2],
 *       playbackRate: playbackRates[2],
 *       isReady: ws2.isReady
 *     }
 *   ];
 *
 *   const {
 *     playAll,
 *     pauseAll,
 *     setTrackVolume,
 *     solo,
 *     getActiveTracks,
 *     getHighTracks,
 *     getLowTracks
 *   } = useMultiTrackPlayback(tracks);
 *
 *   return (
 *     <div>
 *       <button onClick={() => playAll()}>Play All</button>
 *       <button onClick={() => pauseAll()}>Pause All</button>
 *       <button onClick={() => solo(0)}>Solo Track 0</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultiTrackPlayback(
  tracks: Track[],
): UseMultiTrackPlaybackReturn {
  // ============================================================================
  // ACTIVE TRACK DETECTION
  // ============================================================================

  /**
   * Get indices of active tracks (volume > 0 or currently playing)
   */
  const getActiveTracks = useCallback((): number[] => {
    return tracks
      .filter(
        (track) =>
          track.wavesurfer &&
          (track.wavesurfer.getVolume() > 0 || track.wavesurfer.isPlaying()),
      )
      .map((track) => track.index);
  }, [tracks]);

  /**
   * Get indices of "high" tracks (volume > threshold)
   */
  const getHighTracks = useCallback((): number[] => {
    return tracks
      .filter(
        (track) =>
          track.wavesurfer && track.wavesurfer.getVolume() > HIGH_LOW_THRESHOLD,
      )
      .map((track) => track.index);
  }, [tracks]);

  /**
   * Get indices of "low" tracks (0 < volume <= threshold)
   */
  const getLowTracks = useCallback((): number[] => {
    return tracks
      .filter(
        (track) =>
          track.wavesurfer &&
          track.wavesurfer.getVolume() > 0 &&
          track.wavesurfer.getVolume() <= HIGH_LOW_THRESHOLD,
      )
      .map((track) => track.index);
  }, [tracks]);

  /**
   * Check if any track is currently playing
   */
  const isAnyPlaying = useCallback((): boolean => {
    return tracks.some(
      (track) => track.wavesurfer && track.wavesurfer.isPlaying(),
    );
  }, [tracks]);

  /**
   * Get all track volumes
   */
  const getVolumes = useCallback((): number[] => {
    return tracks.map((track) => track.wavesurfer?.getVolume() ?? 0);
  }, [tracks]);

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  /**
   * Play all active tracks simultaneously
   */
  const playAll = useCallback(
    (start?: number, end?: number) => {
      const activeTracks = getActiveTracks();

      activeTracks.forEach((index) => {
        const track = tracks[index];
        if (track.wavesurfer && track.isReady) {
          track.wavesurfer.play(start, end);
        }
      });
    },
    [tracks, getActiveTracks],
  );

  /**
   * Pause all active tracks
   */
  const pauseAll = useCallback(() => {
    const activeTracks = getActiveTracks();

    activeTracks.forEach((index) => {
      const track = tracks[index];
      if (track.wavesurfer) {
        track.wavesurfer.pause();
      }
    });
  }, [tracks, getActiveTracks]);

  /**
   * Stop all tracks
   */
  const stopAll = useCallback(() => {
    tracks.forEach((track) => {
      if (track.wavesurfer) {
        track.wavesurfer.stop();
      }
    });
  }, [tracks]);

  // ============================================================================
  // VOLUME CONTROL
  // ============================================================================

  /**
   * Set volume for a specific track
   */
  const setTrackVolume = useCallback(
    (trackIndex: number, volume: number) => {
      const track = tracks[trackIndex];
      if (track && track.wavesurfer) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        track.wavesurfer.setVolume(clampedVolume);
      }
    },
    [tracks],
  );

  /**
   * Solo a track (mute all others)
   */
  const solo = useCallback(
    (trackIndex: number, resetAll = false) => {
      // Check if we should reset all volumes
      const shouldReset =
        resetAll ||
        !tracks.some(
          (track) => track.wavesurfer?.getVolume() ?? 0 > HIGH_LOW_THRESHOLD,
        );

      if (shouldReset) {
        // Mute all tracks except the selected one
        tracks.forEach((track, index) => {
          if (track.wavesurfer) {
            track.wavesurfer.setVolume(index === trackIndex ? 1 : 0);
          }
        });
      }

      // Stop all tracks except the selected one
      tracks.forEach((track, index) => {
        if (track.wavesurfer && index !== trackIndex) {
          track.wavesurfer.stop();
        }
      });

      // Reset playback rates
      tracks.forEach((track) => {
        if (track.wavesurfer) {
          track.wavesurfer.setPlaybackRate(1);
        }
      });
    },
    [tracks],
  );

  // ============================================================================
  // PLAYBACK RATE CONTROL
  // ============================================================================

  /**
   * Set playback rate for all tracks
   */
  const setGlobalPlaybackRate = useCallback(
    (rate: number) => {
      const clampedRate = clampPlaybackRate(rate);

      tracks.forEach((track) => {
        if (track.wavesurfer) {
          track.wavesurfer.setPlaybackRate(roundTo2(clampedRate));
        }
      });
    },
    [tracks],
  );

  /**
   * Set playback rate for a specific track
   */
  const setTrackPlaybackRate = useCallback(
    (trackIndex: number, rate: number) => {
      const track = tracks[trackIndex];
      if (track && track.wavesurfer) {
        const clampedRate = clampPlaybackRate(rate);
        track.wavesurfer.setPlaybackRate(roundTo2(clampedRate));
      }
    },
    [tracks],
  );

  /**
   * Sync playback rates across all tracks
   *
   * @param baseRate - Base playback rate for each track
   * @param multiplier - Global multiplier applied to all tracks
   */
  const syncPlaybackRates = useCallback(
    (baseRate: number, multiplier: number) => {
      tracks.forEach((track) => {
        if (track.wavesurfer) {
          const finalRate = clampPlaybackRate(baseRate * multiplier);
          track.wavesurfer.setPlaybackRate(roundTo2(finalRate));
        }
      });
    },
    [tracks],
  );

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return useMemo(
    () => ({
      playAll,
      pauseAll,
      stopAll,
      setTrackVolume,
      setGlobalPlaybackRate,
      setTrackPlaybackRate,
      solo,
      getActiveTracks,
      getHighTracks,
      getLowTracks,
      isAnyPlaying,
      getVolumes,
      syncPlaybackRates,
    }),
    [
      playAll,
      pauseAll,
      stopAll,
      setTrackVolume,
      setGlobalPlaybackRate,
      setTrackPlaybackRate,
      solo,
      getActiveTracks,
      getHighTracks,
      getLowTracks,
      isAnyPlaying,
      getVolumes,
      syncPlaybackRates,
    ],
  );
}
