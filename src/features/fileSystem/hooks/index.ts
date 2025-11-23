/**
 * File System Hooks
 *
 * Custom hooks for file system operations, EAF parsing,
 * audio merging, and local state caching.
 *
 * @module fileSystem/hooks
 */

// ============================================================================
// FILE SYSTEM HOOKS
// ============================================================================

export { useFileWatcher } from "./useFileWatcher";
export type {
  FileWatcherOptions,
  FileEventType,
  FileEvent,
  UseFileWatcherReturn,
} from "./useFileWatcher";

export { useEAFParser } from "./useEAFParser";
export type { ParsedEAFData, UseEAFParserReturn } from "./useEAFParser";

export { useAudioMerge } from "./useAudioMerge";
export type {
  AudioMergeOptions,
  AudioConversionOptions,
  InputFileMetadata,
  MergeResult,
  UseAudioMergeReturn,
} from "./useAudioMerge";

export { useLocalStateCache } from "./useLocalStateCache";
export type {
  CachedFolderState,
  UseLocalStateCacheReturn,
} from "./useLocalStateCache";
