/**
 * Waveform Component
 *
 * A React component that renders an audio waveform visualization using WaveSurfer.js.
 * This component has been migrated from a class-based to a function-based architecture
 * using the useWaveformRenderer custom hook.
 *
 * Features:
 * - Self-contained WaveSurfer instance management
 * - Automatic cleanup on unmount (prevents memory leaks)
 * - Flexible configuration through props
 * - TypeScript type safety
 * - Support for WaveSurfer plugins (regions, timeline, etc.)
 *
 * Migration Notes:
 * - Converted from class component to function component
 * - Extracted WaveSurfer logic into useWaveformRenderer hook
 * - Removed 'this' references and instance variables
 * - Converted lifecycle methods to useEffect
 * - Improved TypeScript typing
 *
 * @module features/annotations/components
 */

import React, { useRef, useEffect } from "react";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  useWaveformRenderer,
  type WaveformRendererOptions,
} from "../../hooks/useWaveformRenderer";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the Waveform component
 */
export interface WaveformProps {
  /**
   * Unique identifier for this waveform instance
   * Used to generate DOM element IDs
   */
  index: number;

  /**
   * URL of the audio file to display
   * Can be empty string to show empty waveform
   */
  audioUrl?: string;

  /**
   * Click handler for the waveform container
   * Useful for seeking or interaction
   */
  onClick?: (event: React.MouseEvent<HTMLTableCellElement>) => void;

  /**
   * WaveSurfer configuration options
   * Defaults to Prestige's standard styling if not provided
   */
  options?: WaveformRendererOptions;

  /**
   * Initial volume level (0.0 to 1.0)
   * Defaults to 1.0 for index 0, 0.0 for others (following DeeJay pattern)
   */
  volume?: number;

  /**
   * Height of the waveform in pixels or 'auto'
   * Defaults to 128
   */
  height?: number | "auto";

  /**
   * Optional regions plugin instance for milestone visualization
   * If provided, will be passed to WaveSurfer options
   */
  regionsPlugin?: RegionsPlugin;

  /**
   * Custom CSS class name for the container
   */
  className?: string;

  /**
   * Callback fired when WaveSurfer is ready
   */
  onReady?: () => void;

  /**
   * Callback fired when audio is loaded
   */
  onLoad?: () => void;

  /**
   * Callback fired on WaveSurfer errors
   */
  onError?: (error: Error) => void;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

/**
 * Default WaveSurfer options matching Prestige's visual style
 * These match the styling in WaveSurferFunctions.tsx
 */
const DEFAULT_OPTIONS: WaveformRendererOptions = {
  barWidth: 1,
  cursorWidth: 4,
  progressColor: "#fff",
  cursorColor: "#4a74a5",
  waveColor: "#00ccff",
  hideScrollbar: true,
  height: 128,
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Waveform Component
 *
 * Renders an audio waveform visualization with WaveSurfer.js.
 * Manages its own WaveSurfer instance through the useWaveformRenderer hook.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Waveform
 *   index={0}
 *   audioUrl="https://example.com/audio.mp3"
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With custom options and click handler
 * <Waveform
 *   index={1}
 *   audioUrl="https://example.com/voiceover.mp3"
 *   volume={0.5}
 *   height={96}
 *   onClick={(e) => console.log('Clicked at:', e.clientX)}
 *   options={{
 *     waveColor: '#ff0000',
 *     progressColor: '#ffff00',
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With regions plugin
 * const regionsPlugin = RegionsPlugin.create();
 *
 * <Waveform
 *   index={0}
 *   audioUrl="https://example.com/audio.mp3"
 *   regionsPlugin={regionsPlugin}
 *   onReady={() => {
 *     regionsPlugin.addRegion({
 *       start: 5,
 *       end: 10,
 *       color: 'rgba(0, 200, 255, 0.1)',
 *     });
 *   }}
 * />
 * ```
 */
export function Waveform({
  index,
  audioUrl = "",
  onClick,
  options = {},
  volume,
  height = DEFAULT_OPTIONS.height,
  regionsPlugin,
  className = "waveform",
  onReady,
  onLoad,
  onError,
}: WaveformProps): JSX.Element {
  // ============================================================================
  // REFS
  // ============================================================================

  /**
   * Reference to the DOM container element
   * Passed to useWaveformRenderer for WaveSurfer initialization
   */
  const containerRef = useRef<HTMLTableCellElement>(null);

  // ============================================================================
  // WAVESURFER OPTIONS
  // ============================================================================

  /**
   * Merge default options with user-provided options
   * Include regions plugin if provided
   */
  const mergedOptions: WaveformRendererOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    height: height,
    plugins: regionsPlugin ? [regionsPlugin] : options.plugins || [],
  };

  // ============================================================================
  // HOOK USAGE
  // ============================================================================

  /**
   * Initialize WaveSurfer with the useWaveformRenderer hook
   * This handles the complete lifecycle:
   * - Creating the WaveSurfer instance
   * - Loading the audio
   * - Cleaning up on unmount
   */
  const {
    wavesurfer,
    isReady,
    isLoaded,
    setVolume: setWavesurferVolume,
  } = useWaveformRenderer(containerRef, audioUrl, mergedOptions);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Set initial volume when WaveSurfer is ready
   * Follows DeeJay pattern: source track (index 0) is audible, others are muted
   */
  useEffect(() => {
    if (wavesurfer && isReady) {
      const initialVolume =
        volume !== undefined ? volume : index === 0 ? 1.0 : 0.0;
      setWavesurferVolume(initialVolume);
    }
  }, [wavesurfer, isReady, volume, index, setWavesurferVolume]);

  /**
   * Fire onReady callback when WaveSurfer is initialized
   */
  useEffect(() => {
    if (isReady && onReady) {
      onReady();
    }
  }, [isReady, onReady]);

  /**
   * Fire onLoad callback when audio is loaded
   */
  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  /**
   * Set up error listener on WaveSurfer instance
   */
  useEffect(() => {
    if (!wavesurfer || !onError) {
      return;
    }

    const handleError = (error: Error) => {
      onError(error);
    };

    wavesurfer.on("error", handleError);

    return () => {
      wavesurfer.un("error", handleError);
    };
  }, [wavesurfer, onError]);

  // ============================================================================
  // RENDER
  // ============================================================================

  /**
   * Render the waveform container
   * The container element is passed to useWaveformRenderer via containerRef
   * WaveSurfer will mount its canvas inside this element
   */
  return (
    <td
      ref={containerRef}
      className={className}
      id={`waveform${index}`}
      onClick={onClick}
    />
  );
}

export default Waveform;
