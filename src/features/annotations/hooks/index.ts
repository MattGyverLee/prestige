/**
 * Annotations Feature Hooks
 *
 * Custom React hooks for the annotations feature.
 * These hooks provide reusable logic for waveform rendering,
 * milestone management, and annotation interactions.
 *
 * @module features/annotations/hooks
 */

export {
  useWaveformRenderer,
  type WaveformRendererOptions,
  type UseWaveformRendererReturn,
} from "./useWaveformRenderer";

export {
  useAnnotationTable,
  type UseAnnotationTableProps,
  type UseAnnotationTableReturn,
  type AnnotationColumn,
  type ColumnWidth,
  type DispatchAction,
} from "./useAnnotationTable";

export {
  useWaveSurfer,
  type UseWaveSurferOptions,
  type UseWaveSurferReturn,
} from "./useWaveSurfer";

export {
  useTimelineSync,
  useManualTimelineSync,
  type UseTimelineSyncOptions,
} from "./useTimelineSync";

export {
  useMultiTrackPlayback,
  type Track,
  type UseMultiTrackPlaybackReturn,
} from "./useMultiTrackPlayback";

export {
  useZoomPan,
  type UseZoomPanOptions,
  type UseZoomPanReturn,
} from "./useZoomPan";

export {
  useAudioPreview,
  useAudioPreviewQueue,
  type AudioPreviewOptions,
  type GenerationProgress,
  type UseAudioPreviewReturn,
} from "./useAudioPreview";
