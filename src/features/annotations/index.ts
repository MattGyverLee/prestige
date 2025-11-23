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
export {
  Waveform,
  type WaveformProps,
  AnnotationTable,
  type AnnotationTableProps,
  DeeJay,
} from "./components";

// Hooks
export {
  useWaveformRenderer,
  type WaveformRendererOptions,
  type UseWaveformRendererReturn,
  useAnnotationTable,
  type UseAnnotationTableProps,
  type UseAnnotationTableReturn,
  type AnnotationColumn,
  type ColumnWidth,
  type DispatchAction,
  useWaveSurfer,
  type UseWaveSurferOptions,
  type UseWaveSurferReturn,
  useTimelineSync,
  useManualTimelineSync,
  type UseTimelineSyncOptions,
  useMultiTrackPlayback,
  type Track,
  type UseMultiTrackPlaybackReturn,
  useZoomPan,
  type UseZoomPanOptions,
  type UseZoomPanReturn,
  useAudioPreview,
  useAudioPreviewQueue,
  type AudioPreviewOptions,
  type GenerationProgress,
  type UseAudioPreviewReturn,
} from "./hooks";
