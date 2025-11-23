/**
 * File System Feature Module
 *
 * Public API for file system components, hooks, and utilities.
 *
 * Components:
 * - FileList: Displays and manages source media file selection
 * - SelectFolderZone: Folder selection and file watching
 *
 * Hooks:
 * - useFileWatcher: File system watching with Chokidar
 * - useEAFParser: EAF file parsing
 * - useAudioMerge: FFmpeg audio merging
 * - useLocalStateCache: localStorage caching
 *
 * @module fileSystem
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { default as FileList } from "./components/FileList";
export { SelectFolderZone } from "./components/SelectFolderZone";

// ============================================================================
// HOOKS
// ============================================================================

export {
  useFileWatcher,
  useEAFParser,
  useAudioMerge,
  useLocalStateCache,
} from "./hooks";

export type {
  FileWatcherOptions,
  FileEventType,
  FileEvent,
  UseFileWatcherReturn,
  ParsedEAFData,
  UseEAFParserReturn,
  AudioMergeOptions,
  AudioConversionOptions,
  InputFileMetadata,
  MergeResult,
  UseAudioMergeReturn,
  CachedFolderState,
  UseLocalStateCacheReturn,
} from "./hooks";
