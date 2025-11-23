/**
 * Annotations Feature Public API
 *
 * This module exports the public API for the annotations feature,
 * including components, hooks, and utilities for waveform rendering
 * and milestone management.
 *
 * @module features/annotations
 */

// Components
export { Waveform, type WaveformProps } from "./components";

// Hooks
export {
  useWaveformRenderer,
  type WaveformRendererOptions,
  type UseWaveformRendererReturn,
} from "./hooks";
