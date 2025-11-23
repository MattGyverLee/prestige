/**
 * useZoomPan Hook
 *
 * Custom React hook for managing zoom and pan controls for WaveSurfer waveforms.
 * Provides infrastructure for future zoom/pan functionality.
 *
 * Key Features:
 * - Zoom level state management
 * - Pan position state
 * - Zoom in/out methods with customizable step
 * - Pan left/right methods
 * - Boundary constraints
 * - Reset to default view
 *
 * Zoom Levels:
 * - Minimum: 1 (fully zoomed out - entire waveform visible)
 * - Maximum: 1000 (fully zoomed in - very detailed view)
 * - Default: 1 (no zoom)
 *
 * Pan Position:
 * - Range: 0.0 to 1.0 (normalized position in waveform)
 * - 0.0 = beginning of waveform
 * - 1.0 = end of waveform
 *
 * @module features/annotations/hooks/useZoomPan
 */

import { useState, useCallback, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for zoom/pan
 */
export interface UseZoomPanOptions {
  /** WaveSurfer instance to control */
  wavesurfer: WaveSurfer | null;

  /** Initial zoom level (default: 1) */
  initialZoom?: number;

  /** Initial pan position (default: 0) */
  initialPan?: number;

  /** Minimum zoom level (default: 1) */
  minZoom?: number;

  /** Maximum zoom level (default: 1000) */
  maxZoom?: number;

  /** Zoom step for in/out operations (default: 10) */
  zoomStep?: number;

  /** Pan step for left/right operations (default: 0.1) */
  panStep?: number;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Return value from useZoomPan
 */
export interface UseZoomPanReturn {
  /** Current zoom level */
  zoom: number;

  /** Current pan position (0.0 to 1.0) */
  pan: number;

  /** Zoom in by step amount */
  zoomIn: () => void;

  /** Zoom out by step amount */
  zoomOut: () => void;

  /** Set zoom to specific level */
  setZoom: (level: number) => void;

  /** Pan left by step amount */
  panLeft: () => void;

  /** Pan right by step amount */
  panRight: () => void;

  /** Set pan to specific position */
  setPan: (position: number) => void;

  /** Reset to default view (zoom=1, pan=0) */
  reset: () => void;

  /** Zoom to fit entire waveform */
  zoomToFit: () => void;

  /** Check if can zoom in more */
  canZoomIn: boolean;

  /** Check if can zoom out more */
  canZoomOut: boolean;

  /** Check if can pan left more */
  canPanLeft: boolean;

  /** Check if can pan right more */
  canPanRight: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MIN_ZOOM = 1;
const DEFAULT_MAX_ZOOM = 1000;
const DEFAULT_ZOOM_STEP = 10;
const DEFAULT_PAN_STEP = 0.1;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for zoom and pan controls
 *
 * @param {UseZoomPanOptions} options - Zoom/pan configuration
 * @returns {UseZoomPanReturn} Zoom/pan state and control methods
 *
 * @example
 * ```tsx
 * function WaveformWithZoom() {
 *   const ws = useWaveSurfer({ containerId: "waveform0" });
 *
 *   const {
 *     zoom,
 *     pan,
 *     zoomIn,
 *     zoomOut,
 *     panLeft,
 *     panRight,
 *     reset,
 *     canZoomIn,
 *     canZoomOut
 *   } = useZoomPan({
 *     wavesurfer: ws.wavesurfer,
 *     initialZoom: 1,
 *     zoomStep: 20
 *   });
 *
 *   return (
 *     <div>
 *       <div id="waveform0" />
 *       <div>
 *         <button onClick={zoomIn} disabled={!canZoomIn}>Zoom In</button>
 *         <button onClick={zoomOut} disabled={!canZoomOut}>Zoom Out</button>
 *         <button onClick={panLeft}>Pan Left</button>
 *         <button onClick={panRight}>Pan Right</button>
 *         <button onClick={reset}>Reset View</button>
 *         <span>Zoom: {zoom}x</span>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useZoomPan(options: UseZoomPanOptions): UseZoomPanReturn {
  const {
    wavesurfer,
    initialZoom = 1,
    initialPan = 0,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    zoomStep = DEFAULT_ZOOM_STEP,
    panStep = DEFAULT_PAN_STEP,
    debug = false,
  } = options;

  // ============================================================================
  // STATE
  // ============================================================================

  const [zoom, setZoomState] = useState(initialZoom);
  const [pan, setPanState] = useState(initialPan);

  // ============================================================================
  // ZOOM CONTROL
  // ============================================================================

  /**
   * Set zoom level with bounds checking
   */
  const setZoom = useCallback(
    (level: number) => {
      const clampedLevel = Math.max(minZoom, Math.min(maxZoom, level));

      if (debug) {
        console.log(`[useZoomPan] Setting zoom to ${clampedLevel}`);
      }

      setZoomState(clampedLevel);

      // Apply zoom to WaveSurfer if available
      if (wavesurfer) {
        wavesurfer.zoom(clampedLevel);
      }
    },
    [wavesurfer, minZoom, maxZoom, debug],
  );

  /**
   * Zoom in by step amount
   */
  const zoomIn = useCallback(() => {
    setZoom(zoom + zoomStep);
  }, [zoom, zoomStep, setZoom]);

  /**
   * Zoom out by step amount
   */
  const zoomOut = useCallback(() => {
    setZoom(zoom - zoomStep);
  }, [zoom, zoomStep, setZoom]);

  /**
   * Zoom to fit entire waveform
   */
  const zoomToFit = useCallback(() => {
    setZoom(minZoom);
    setPanState(0);
  }, [minZoom, setZoom]);

  // ============================================================================
  // PAN CONTROL
  // ============================================================================

  /**
   * Set pan position with bounds checking
   */
  const setPan = useCallback(
    (position: number) => {
      const clampedPosition = Math.max(0, Math.min(1, position));

      if (debug) {
        console.log(`[useZoomPan] Setting pan to ${clampedPosition}`);
      }

      setPanState(clampedPosition);

      // Seek to pan position if WaveSurfer is available
      if (wavesurfer) {
        wavesurfer.seekTo(clampedPosition);
      }
    },
    [wavesurfer, debug],
  );

  /**
   * Pan left by step amount
   */
  const panLeft = useCallback(() => {
    setPan(pan - panStep);
  }, [pan, panStep, setPan]);

  /**
   * Pan right by step amount
   */
  const panRight = useCallback(() => {
    setPan(pan + panStep);
  }, [pan, panStep, setPan]);

  // ============================================================================
  // RESET
  // ============================================================================

  /**
   * Reset to default view
   */
  const reset = useCallback(() => {
    setZoom(initialZoom);
    setPan(initialPan);
  }, [initialZoom, initialPan, setZoom, setPan]);

  // ============================================================================
  // BOUNDARY CHECKS
  // ============================================================================

  const canZoomIn = zoom < maxZoom;
  const canZoomOut = zoom > minZoom;
  const canPanLeft = pan > 0;
  const canPanRight = pan < 1;

  // ============================================================================
  // SYNC ZOOM WITH WAVESURFER
  // ============================================================================

  /**
   * Apply zoom when WaveSurfer instance becomes available
   */
  useEffect(() => {
    if (wavesurfer && zoom !== 1) {
      wavesurfer.zoom(zoom);
    }
  }, [wavesurfer, zoom]);

  // ============================================================================
  // RETURN VALUE
  // ============================================================================

  return {
    zoom,
    pan,
    zoomIn,
    zoomOut,
    setZoom,
    panLeft,
    panRight,
    setPan,
    reset,
    zoomToFit,
    canZoomIn,
    canZoomOut,
    canPanLeft,
    canPanRight,
  };
}
