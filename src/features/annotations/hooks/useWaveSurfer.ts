/**
 * useWaveSurfer Hook
 *
 * Custom React hook for managing a single WaveSurfer instance with regions plugin.
 * Handles complete lifecycle: initialization, loading, seeking, playback, cleanup.
 *
 * Key Features:
 * - WaveSurfer instance creation and configuration
 * - Container ref management
 * - Load/seek/play/pause methods
 * - Event listener setup and cleanup
 * - Proper destroy() in cleanup to prevent memory leaks
 * - Regions plugin integration
 * - Ready state tracking
 *
 * Memory Leak Prevention:
 * - Automatically destroys WaveSurfer instance on unmount
 * - Cleans up all event listeners
 * - Unregisters regions plugin
 *
 * @module features/annotations/hooks/useWaveSurfer
 */

import { useRef, useEffect, useCallback, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for WaveSurfer instance
 */
export interface UseWaveSurferOptions {
  /** Container element ID (e.g., "waveform0") */
  containerId: string;

  /** Initial volume (0.0 to 1.0) */
  initialVolume?: number;

  /** Waveform bar width in pixels */
  barWidth?: number;

  /** Cursor width in pixels */
  cursorWidth?: number;

  /** Waveform height in pixels */
  height?: number;

  /** Progress color (hex or rgba) */
  progressColor?: string;

  /** Cursor color (hex or rgba) */
  cursorColor?: string;

  /** Waveform color (hex or rgba) */
  waveColor?: string;

  /** Hide scrollbar */
  hideScrollbar?: boolean;

  /** Event handlers */
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: Error) => void;
  onInteraction?: () => void;
  onSeeking?: () => void;
  onSeek?: () => void;
  onRegionCreated?: (region: any) => void;
  onRegionMouseEnter?: (region: any) => void;
  onRegionMouseLeave?: (region: any) => void;
  onRegionClicked?: (region: any) => void;
}

/**
 * Return value from useWaveSurfer hook
 */
export interface UseWaveSurferReturn {
  /** WaveSurfer instance (null until initialized) */
  wavesurfer: WaveSurfer | null;

  /** Regions plugin instance */
  regionsPlugin: RegionsPlugin | null;

  /** Whether WaveSurfer is ready (audio loaded and decoded) */
  isReady: boolean;

  /** Load audio file into WaveSurfer */
  load: (url: string, peaks?: number[][]) => void;

  /** Seek to normalized position (0.0 to 1.0) */
  seekTo: (progress: number) => void;

  /** Play from optional start to optional end */
  play: (start?: number, end?: number) => void;

  /** Pause playback */
  pause: () => void;

  /** Stop playback and reset to beginning */
  stop: () => void;

  /** Set volume (0.0 to 1.0) */
  setVolume: (volume: number) => void;

  /** Set playback rate */
  setPlaybackRate: (rate: number) => void;

  /** Get current time in seconds */
  getCurrentTime: () => number;

  /** Get duration in seconds */
  getDuration: () => number;

  /** Check if currently playing */
  isPlaying: () => boolean;

  /** Get current volume */
  getVolume: () => number;

  /** Get current playback rate */
  getPlaybackRate: () => number;

  /** Get decoded audio data (for waveform export) */
  getDecodedData: () => AudioBuffer | null;

  /** Clear all regions */
  clearRegions: () => void;

  /** Add a region */
  addRegion: (options: any) => any;

  /** Get all regions */
  getRegions: () => any[];

  /** Destroy WaveSurfer instance */
  destroy: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing WaveSurfer instance
 *
 * @param {UseWaveSurferOptions} options - Configuration options
 * @returns {UseWaveSurferReturn} WaveSurfer instance and control methods
 *
 * @example
 * ```tsx
 * function AudioPlayer() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   const {
 *     wavesurfer,
 *     isReady,
 *     load,
 *     play,
 *     pause
 *   } = useWaveSurfer({
 *     containerId: "waveform0",
 *     initialVolume: 1.0,
 *     onReady: () => console.log("Ready!"),
 *     onPlay: () => console.log("Playing"),
 *     onPause: () => console.log("Paused")
 *   });
 *
 *   useEffect(() => {
 *     if (wavesurfer) {
 *       load("audio.mp3");
 *     }
 *   }, [wavesurfer, load]);
 *
 *   return (
 *     <div>
 *       <div id="waveform0" ref={containerRef} />
 *       <button onClick={play}>Play</button>
 *       <button onClick={pause}>Pause</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWaveSurfer(
  options: UseWaveSurferOptions,
): UseWaveSurferReturn {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [isReady, setIsReady] = useState(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize WaveSurfer instance
   */
  useEffect(() => {
    // Check if container exists
    const container = document.getElementById(options.containerId);
    if (!container) {
      console.warn(
        `[useWaveSurfer] Container #${options.containerId} not found`,
      );
      return;
    }

    // Create regions plugin
    const regionsPlugin = RegionsPlugin.create();
    regionsPluginRef.current = regionsPlugin;

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: `#${options.containerId}`,
      barWidth: options.barWidth ?? 1,
      cursorWidth: options.cursorWidth ?? 4,
      progressColor: options.progressColor ?? "#fff",
      cursorColor: options.cursorColor ?? "#4a74a5",
      waveColor: options.waveColor ?? "#00ccff",
      hideScrollbar: options.hideScrollbar ?? true,
      height: options.height ?? 128,
      plugins: [regionsPlugin],
    });

    // Initialize with empty waveform
    ws.empty();

    // Set initial volume
    ws.setVolume(options.initialVolume ?? 1.0);

    // Store reference
    wavesurferRef.current = ws;

    // Setup event listeners
    if (options.onReady) {
      ws.on("ready", () => {
        setIsReady(true);
        options.onReady?.();
      });
    } else {
      ws.on("ready", () => setIsReady(true));
    }

    if (options.onPlay) {
      ws.on("play", options.onPlay);
    }

    if (options.onPause) {
      ws.on("pause", options.onPause);
    }

    if (options.onError) {
      ws.on("error", options.onError);
    }

    if (options.onInteraction) {
      ws.on("interaction", options.onInteraction);
    }

    if (options.onSeeking) {
      ws.on("seeking", options.onSeeking);
    }

    if (options.onSeek) {
      ws.on("seek" as any, options.onSeek);
    }

    if (options.onRegionCreated) {
      ws.on("region-created" as any, options.onRegionCreated);
    }

    if (options.onRegionMouseEnter) {
      ws.on("region-mouseenter" as any, options.onRegionMouseEnter);
    }

    if (options.onRegionMouseLeave) {
      ws.on("region-mouseleave" as any, options.onRegionMouseLeave);
    }

    if (options.onRegionClicked) {
      ws.on("region-clicked" as any, options.onRegionClicked);
    }

    // Cleanup on unmount
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      regionsPluginRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.containerId]); // Only reinitialize if container changes

  // ============================================================================
  // CONTROL METHODS
  // ============================================================================

  /**
   * Load audio file
   */
  const load = useCallback((url: string, peaks?: number[][]) => {
    if (wavesurferRef.current) {
      setIsReady(false);
      if (peaks) {
        wavesurferRef.current.load(url, peaks);
      } else {
        wavesurferRef.current.load(url);
      }
    }
  }, []);

  /**
   * Seek to normalized position
   */
  const seekTo = useCallback((progress: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(progress);
    }
  }, []);

  /**
   * Play audio
   */
  const play = useCallback((start?: number, end?: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play(start, end);
    }
  }, []);

  /**
   * Pause audio
   */
  const pause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
  }, []);

  /**
   * Stop audio
   */
  const stop = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
    }
  }, []);

  /**
   * Set volume
   */
  const setVolume = useCallback((volume: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume);
    }
  }, []);

  /**
   * Set playback rate
   */
  const setPlaybackRate = useCallback((rate: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate);
    }
  }, []);

  /**
   * Get current time
   */
  const getCurrentTime = useCallback((): number => {
    return wavesurferRef.current?.getCurrentTime() ?? 0;
  }, []);

  /**
   * Get duration
   */
  const getDuration = useCallback((): number => {
    return wavesurferRef.current?.getDuration() ?? 0;
  }, []);

  /**
   * Check if playing
   */
  const isPlayingFn = useCallback((): boolean => {
    return wavesurferRef.current?.isPlaying() ?? false;
  }, []);

  /**
   * Get volume
   */
  const getVolume = useCallback((): number => {
    return wavesurferRef.current?.getVolume() ?? 0;
  }, []);

  /**
   * Get playback rate
   */
  const getPlaybackRate = useCallback((): number => {
    return wavesurferRef.current?.getPlaybackRate() ?? 1;
  }, []);

  /**
   * Get decoded audio data
   */
  const getDecodedData = useCallback((): AudioBuffer | null => {
    return wavesurferRef.current?.getDecodedData() ?? null;
  }, []);

  /**
   * Clear all regions
   */
  const clearRegions = useCallback(() => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions();
    }
  }, []);

  /**
   * Add a region
   */
  const addRegion = useCallback((regionOptions: any): any => {
    if (regionsPluginRef.current) {
      return regionsPluginRef.current.addRegion(regionOptions);
    }
    return null;
  }, []);

  /**
   * Get all regions
   */
  const getRegions = useCallback((): any[] => {
    return regionsPluginRef.current?.getRegions() ?? [];
  }, []);

  /**
   * Destroy WaveSurfer instance
   */
  const destroy = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
      setIsReady(false);
    }
  }, []);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    wavesurfer: wavesurferRef.current,
    regionsPlugin: regionsPluginRef.current,
    isReady,
    load,
    seekTo,
    play,
    pause,
    stop,
    setVolume,
    setPlaybackRate,
    getCurrentTime,
    getDuration,
    isPlaying: isPlayingFn,
    getVolume,
    getPlaybackRate,
    getDecodedData,
    clearRegions,
    addRegion,
    getRegions,
    destroy,
  };
}
