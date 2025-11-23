/**
 * useWaveformRenderer Hook
 *
 * Custom hook for managing WaveSurfer instances in waveform components.
 * Handles the complete lifecycle of a WaveSurfer instance including:
 * - Creation and initialization
 * - Audio loading
 * - Cleanup and destruction
 *
 * This hook abstracts away the complexity of WaveSurfer lifecycle management
 * and provides a clean API for waveform rendering in React components.
 *
 * @module features/annotations/hooks
 */

import { useEffect, useRef, useState, RefObject, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import type { WaveSurferOptions } from "wavesurfer.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for the WaveSurfer renderer
 *
 * Extends WaveSurferOptions but makes container optional since we'll
 * provide it via containerRef
 */
export type WaveformRendererOptions = Omit<WaveSurferOptions, "container"> & {
  container?: WaveSurferOptions["container"];
};

/**
 * Return type for the useWaveformRenderer hook
 *
 * Provides access to the WaveSurfer instance and control methods
 */
export interface UseWaveformRendererReturn {
  /** Reference to the WaveSurfer instance (null until initialized) */
  wavesurfer: WaveSurfer | null;

  /** Whether the WaveSurfer instance is initialized and ready */
  isReady: boolean;

  /** Whether audio is currently loaded */
  isLoaded: boolean;

  /** Load an audio URL into the waveform */
  loadAudio: (url: string) => void;

  /** Seek to a specific time position (in seconds) */
  seekTo: (time: number) => void;

  /** Play the audio */
  play: () => void;

  /** Pause the audio */
  pause: () => void;

  /** Set the playback volume (0.0 to 1.0) */
  setVolume: (volume: number) => void;

  /** Destroy and recreate the WaveSurfer instance */
  reset: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for rendering audio waveforms with WaveSurfer.js
 *
 * Manages the complete lifecycle of a WaveSurfer instance:
 * 1. **Initialization**: Creates WaveSurfer when container ref is available
 * 2. **Audio Loading**: Loads audio from provided URL
 * 3. **Cleanup**: Properly destroys WaveSurfer instance on unmount
 *
 * Memory Leak Prevention:
 * - Returns cleanup function that calls wavesurfer.destroy()
 * - Removes all event listeners during cleanup
 * - Only creates instance when containerRef.current is available
 *
 * @param {RefObject<HTMLElement>} containerRef - React ref to the container element
 * @param {string} audioUrl - URL of the audio file to load (empty string for no audio)
 * @param {WaveformRendererOptions} options - WaveSurfer configuration options
 * @returns {UseWaveformRendererReturn} WaveSurfer instance and control methods
 *
 * @example
 * ```tsx
 * function WaveformComponent({ audioUrl }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   const { wavesurfer, isReady, play, pause, seekTo } = useWaveformRenderer(
 *     containerRef,
 *     audioUrl,
 *     {
 *       waveColor: '#00ccff',
 *       progressColor: '#fff',
 *       cursorColor: '#4a74a5',
 *       barWidth: 1,
 *       height: 128,
 *     }
 *   );
 *
 *   return (
 *     <div>
 *       <div ref={containerRef} />
 *       {isReady && (
 *         <div>
 *           <button onClick={play}>Play</button>
 *           <button onClick={pause}>Pause</button>
 *           <button onClick={() => seekTo(10)}>Seek to 10s</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With regions plugin
 * function WaveformWithRegions({ audioUrl }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const regionsPlugin = RegionsPlugin.create();
 *
 *   const { wavesurfer, isReady } = useWaveformRenderer(
 *     containerRef,
 *     audioUrl,
 *     {
 *       waveColor: '#00ccff',
 *       plugins: [regionsPlugin],
 *     }
 *   );
 *
 *   useEffect(() => {
 *     if (isReady && wavesurfer) {
 *       regionsPlugin.addRegion({
 *         start: 5,
 *         end: 10,
 *         color: 'rgba(0, 200, 255, 0.1)',
 *       });
 *     }
 *   }, [isReady, wavesurfer]);
 *
 *   return <div ref={containerRef} />;
 * }
 * ```
 */
export function useWaveformRenderer(
  containerRef: RefObject<HTMLElement>,
  audioUrl: string,
  options: WaveformRendererOptions = {},
): UseWaveformRendererReturn {
  // Store WaveSurfer instance in ref (doesn't trigger re-renders)
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Track ready state (triggers re-renders for UI updates)
  const [isReady, setIsReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Store options in ref to avoid recreating WaveSurfer on option changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // ============================================================================
  // CONTROL METHODS
  // ============================================================================

  /**
   * Load audio from a URL
   * Wraps WaveSurfer's load method with null checking
   */
  const loadAudio = useCallback((url: string) => {
    if (wavesurferRef.current && url) {
      wavesurferRef.current.load(url);
    }
  }, []);

  /**
   * Seek to a specific time position
   * @param time - Time in seconds
   */
  const seekTo = useCallback((time: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(time);
    }
  }, []);

  /**
   * Play the audio
   */
  const play = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
    }
  }, []);

  /**
   * Pause the audio
   */
  const pause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
  }, []);

  /**
   * Set playback volume
   * @param volume - Volume level (0.0 to 1.0)
   */
  const setVolume = useCallback((volume: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, []);

  /**
   * Destroy and recreate the WaveSurfer instance
   * Useful for resetting the waveform to initial state
   */
  const reset = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
      setIsReady(false);
      setIsLoaded(false);
    }
  }, []);

  // ============================================================================
  // WAVESURFER LIFECYCLE
  // ============================================================================

  /**
   * Initialize WaveSurfer instance
   *
   * This effect runs when:
   * - Component mounts
   * - Container ref changes
   *
   * Cleanup function destroys WaveSurfer to prevent memory leaks
   */
  useEffect(() => {
    // Wait for container to be available
    if (!containerRef.current) {
      return;
    }

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: containerRef.current,
      ...optionsRef.current,
    });

    // Store instance in ref
    wavesurferRef.current = ws;

    // Set up event listeners
    const handleReady = () => {
      setIsReady(true);
    };

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = (error: Error) => {
      console.error("[useWaveformRenderer] Error loading audio:", error);
      setIsLoaded(false);
    };

    // Attach event listeners
    ws.on("ready", handleReady);
    ws.on("load", handleLoad);
    ws.on("error", handleError);

    // Initialize with empty waveform
    ws.empty();

    // Cleanup function - CRITICAL for preventing memory leaks
    return () => {
      // Remove event listeners
      ws.un("ready", handleReady);
      ws.un("load", handleLoad);
      ws.un("error", handleError);

      // Destroy WaveSurfer instance
      ws.destroy();

      // Clear ref and state
      wavesurferRef.current = null;
      setIsReady(false);
      setIsLoaded(false);
    };
  }, [containerRef]);

  /**
   * Load audio when URL changes
   *
   * This effect runs when audioUrl changes and WaveSurfer is ready
   */
  useEffect(() => {
    if (wavesurferRef.current && audioUrl) {
      loadAudio(audioUrl);
    }
  }, [audioUrl, loadAudio]);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    wavesurfer: wavesurferRef.current,
    isReady,
    isLoaded,
    loadAudio,
    seekTo,
    play,
    pause,
    setVolume,
    reset,
  };
}
