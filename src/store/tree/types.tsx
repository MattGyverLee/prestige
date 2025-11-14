/**
 * Tree Redux Type Definitions
 *
 * This module defines the types for the tree store, which manages:
 * - File tree and folder structure
 * - Source media tracking (video/audio files from original content)
 * - Annotation media tracking (voiceover/subtitle files)
 * - File system operations (add, change, delete)
 * - Waveform data for audio visualization
 * - WaveSurfer instance permissions
 *
 * The tree store coordinates:
 * - Loading and tracking all media files in a project folder
 * - Managing file system watchers for real-time updates
 * - Organizing files into source vs annotation categories
 * - Tracking which files have waveforms generated
 * - Controlling which files can be loaded into WaveSurfer instances
 *
 * @module store/tree/types
 */

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/**
 * Media File Information
 *
 * Represents a media file (video, audio, or annotation) with all metadata
 * needed for playback, waveform visualization, and timeline integration.
 */
export interface Media {
  /** Blob URL for accessing the file in the browser */
  blobURL: string;

  /** File extension (e.g., ".mp4", ".wav", ".eaf") */
  extension: string;

  /** Whether this file has an associated EAF annotation file */
  hasAnnotation: boolean;

  /** Whether this file is an annotation/voiceover file */
  isAnnotation: boolean;

  /** Whether this is a merged voiceover file (CarefulMerged or TranslationMerged) */
  isMerged: boolean;

  /** Whether this file is referenced in timeline milestones */
  inMilestones: boolean;

  /** MIME type of the file (e.g., "video/mp4", "audio/wav") */
  mimeType: string;

  /** Filename with extension */
  name: string;

  /** Full filesystem path to the file */
  path: string;

  /** Whether this file is allowed to be loaded into WaveSurfer */
  wsAllowed: boolean;

  /**
   * Waveform data for audio visualization
   * - false: No waveform generated yet
   * - string: Waveform peaks data
   */
  waveform: boolean | string;
}

/**
 * Tree State
 *
 * Complete state of the file tree, tracking all media files in the current
 * project folder with categorization and metadata.
 */
export interface TreeState {
  /** Runtime environment (development/production) */
  env: string;

  /** Current project folder path */
  folderPath: string;

  /** Current project folder name */
  folderName: string;

  /** Whether folder has been fully loaded */
  loaded: boolean;

  /** All files in the folder (may be deprecated) */
  availableFiles: any[];

  /** Source media files (original video/audio content) */
  sourceMedia: Media[];

  /** Annotation media files (voiceovers, subtitles) */
  annotMedia: Media[];

  /** Previously active folder path */
  prevPath: string;
}

/**
 * Waveform Input
 *
 * Data structure for adding waveform visualization to a media file.
 */
export interface Wavein {
  /** Blob URL reference to the media file */
  ref: string;

  /**
   * Whether this is for source media or annotation media
   * - true: Source media (sourceMedia array)
   * - false: Annotation media (annotMedia array)
   */
  sourceAnnot: boolean;

  /**
   * Waveform peak data for visualization
   * - boolean false: No waveform
   * - string: Peak data string
   */
  wavedata: boolean | string;
}

/**
 * Folder Information
 *
 * Basic folder metadata for folder selection.
 */
export interface Folders {
  /** Folder name */
  folderName: string;

  /** Full folder path */
  folderPath: string;
}

/**
 * File Descriptor
 *
 * Wrapper for file information in file operation actions.
 */
export interface FileDesc {
  /** Media file object */
  file: any;
}

/**
 * Blob URL and Path Pair
 *
 * Links a blob URL with its filesystem path.
 */
export interface PairPathURL {
  /** Blob URL for browser access */
  blobURL: string;

  /** Filesystem path */
  blobPath: string;
}

// ============================================================================
// ACTION TYPE CONSTANTS
// ============================================================================

// STATE MANAGEMENT
/**
 * Update entire tree state
 */
export const UPDATE_TREE = "UPDATE_TREE";

/**
 * Update active folder information
 * @deprecated May be removed in future versions
 */
export const UPDATE_ACTIVE_FOLDER = "UPDATE_ACTIVE_FOLDER";

/**
 * Hard reset entire application state
 */
export const HARD_RESET_APP = "HARD_RESET_APP";

/**
 * Open new folder and load media files
 */
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";

/**
 * Reload media files from current folder
 */
export const ON_RELOAD_FOLDER = "ON_RELOAD_FOLDER";

/**
 * Load complete tree state from saved session
 */
export const LOAD_TREE = "LOAD_TREE";

/**
 * Update previous folder path
 */
export const CHANGE_PREV_PATH = "CHANGE_PREV_PATH";

// FILE ADDITION
/**
 * Add new file to availableFiles
 */
export const FILE_ADDED = "FILE_ADDED";

/**
 * Add new source media file
 */
export const SOURCE_MEDIA_ADDED = "SOURCE_MEDIA_ADDED";

/**
 * Add new annotation media file
 */
export const ANNOT_MEDIA_ADDED = "ANNOT_MEDIA_ADDED";

// FILE MODIFICATION
/**
 * Update existing file in availableFiles
 */
export const FILE_CHANGED = "FILE_CHANGED";

/**
 * Update existing source media file
 */
export const SOURCE_MEDIA_CHANGED = "SOURCE_MEDIA_CHANGED";

/**
 * Update existing annotation media file
 */
export const ANNOT_MEDIA_CHANGED = "ANNOT_MEDIA_CHANGED";

// FILE DELETION
/**
 * Remove file from all arrays
 */
export const FILE_DELETED = "FILE_DELETED";

// WAVEFORM MANAGEMENT
/**
 * Add waveform data to a media file
 */
export const WAVEFORM_ADDED = "WAVEFORM_ADDED";

// MEDIA FLAGS
/**
 * Mark annotation media as present in timeline milestones
 */
export const SET_ANNOT_MEDIA_IN_MILESTONES = "SET_ANNOT_MEDIA_IN_MILESTONES";

/**
 * Mark annotation media as allowed for WaveSurfer
 */
export const SET_ANNOT_MEDIA_WS_ALLOWED = "SET_ANNOT_MEDIA_WS_ALLOWED";

/**
 * Mark source media as allowed for WaveSurfer
 */
export const SET_SOURCE_MEDIA_WS_ALLOWED = "SET_SOURCE_MEDIA_WS_ALLOWED";

// ============================================================================
// ACTION INTERFACES
// ============================================================================

/**
 * Hard reset application
 */
interface TreeHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

/**
 * Open new folder
 */
interface TreeOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}

/**
 * Reload current folder
 */
interface TreeOnReloadFolder {
  type: typeof ON_RELOAD_FOLDER;
  payload: string;
}

/**
 * Update entire tree state
 */
interface UpdateTree {
  type: typeof UPDATE_TREE;
  payload: TreeState;
}

/**
 * Load complete tree state
 */
interface LoadTree {
  type: typeof LOAD_TREE;
  payload: TreeState;
}

/**
 * Update active folder
 * @deprecated May be removed in future versions
 */
interface UpdateActiveFolder {
  type: typeof UPDATE_ACTIVE_FOLDER;
  payload: Folders;
}

/**
 * Add file to availableFiles
 */
interface FileAdded {
  type: typeof FILE_ADDED;
  payload: FileDesc;
}

/**
 * Add source media file
 */
interface SourceMediaAdded {
  type: typeof SOURCE_MEDIA_ADDED;
  payload: FileDesc;
}

/**
 * Add annotation media file
 */
interface AnnotMediaAdded {
  type: typeof ANNOT_MEDIA_ADDED;
  payload: FileDesc;
}

/**
 * Update file in availableFiles
 */
interface FileChanged {
  type: typeof FILE_CHANGED;
  payload: FileDesc;
}

/**
 * Update source media file
 */
interface SourceMediaChanged {
  type: typeof SOURCE_MEDIA_CHANGED;
  payload: FileDesc;
}

/**
 * Update annotation media file
 */
interface AnnotMediaChanged {
  type: typeof ANNOT_MEDIA_CHANGED;
  payload: FileDesc;
}

/**
 * Add waveform to media file
 */
interface WaveformAdded {
  type: typeof WAVEFORM_ADDED;
  payload: Wavein;
}

/**
 * Delete file from tree
 */
interface FileDeleted {
  type: typeof FILE_DELETED;
  payload: string;
}

/**
 * Update previous folder path
 */
interface ChangePrevPath {
  type: typeof CHANGE_PREV_PATH;
  payload: string;
}

/**
 * Mark annotation media as in milestones
 */
interface SetAnnotMediaInMilestones {
  type: typeof SET_ANNOT_MEDIA_IN_MILESTONES;
  payload: string;
}

/**
 * Allow annotation media in WaveSurfer
 */
interface SetAnnotMediaWSAllowed {
  type: typeof SET_ANNOT_MEDIA_WS_ALLOWED;
  payload: string;
}

/**
 * Allow source media in WaveSurfer
 */
interface SetSourceMediaWSAllowed {
  type: typeof SET_SOURCE_MEDIA_WS_ALLOWED;
  payload: string;
}

// ============================================================================
// ACTION UNION TYPE
// ============================================================================

/**
 * Union of all tree action types
 *
 * This type ensures type safety across all tree-related actions,
 * allowing TypeScript to infer the correct payload type based on
 * the action type in reducers and middleware.
 */
export type TreeActionTypes =
  | FileAdded
  | FileChanged
  | FileDeleted
  | SourceMediaAdded
  | AnnotMediaAdded
  | SourceMediaChanged
  | AnnotMediaChanged
  | UpdateActiveFolder
  | TreeHardResetApp
  | TreeOnNewFolder
  | TreeOnReloadFolder
  | UpdateTree
  | ChangePrevPath
  | SetAnnotMediaInMilestones
  | SetAnnotMediaWSAllowed
  | SetSourceMediaWSAllowed
  | LoadTree
  | WaveformAdded;
