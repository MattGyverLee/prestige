/**
 * Annotation Redux Type Definitions
 *
 * This module defines the types for the annotation store, which manages:
 * - Timeline data loaded from EAF (ELAN Annotation Format) files
 * - Annotation milestones with time segments and linguistic data
 * - Video clip definitions for export
 * - UI state for annotation panels and subtitles
 * - Category and metadata management
 *
 * The annotation store is the core of the application, coordinating:
 * - Loading and parsing EAF files
 * - Managing multiple timelines
 * - Tracking transcription and translation text/audio
 * - Generating video clips for export
 *
 * @module store/annot/types
 */

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/**
 * Loose object type for dynamic EAF content
 *
 * @deprecated Use specific types instead of LooseObject where possible.
 * Only use for truly dynamic data like EAF content where structure is
 * not known at compile time.
 */
export interface LooseObject {
  [key: string]: any;
}

/**
 * Component dimension tracking
 *
 * Used to track UI component sizes for layout calculations
 */
export interface ComponentDimensions {
  /** Component width in pixels */
  width: number;
  /** Component height in pixels */
  height: number;
}

/**
 * Map of component names to their dimensions
 *
 * Used to track multiple UI component sizes in a single object
 */
export type DimensionsMap = Record<string, ComponentDimensions>;

/**
 * Annotation data within a milestone
 *
 * Represents linguistic data associated with a time segment, typically
 * containing transcription, translation, or voiceover information.
 */
export interface MilestoneData {
  /** Channel identifier (e.g., "txtTransc", "audCareful") */
  channel: string;

  /** EAF content - dynamic structure from annotation file */
  data: any;

  /** ELAN linguistic type (e.g., "transcription", "translation") */
  linguisticType: string;

  /** Language locale code (e.g., "en", "fr") */
  locale: string;

  /** MIME type for audio/video content */
  mimeType: string;

  /** Optional clip start time in seconds (for voiceover clips) */
  clipStart?: number;

  /** Optional clip stop time in seconds (for voiceover clips) */
  clipStop?: number;

  /** Optional duration in seconds */
  duration?: number;
}

/**
 * Milestone represents a time segment with associated annotation data
 *
 * Milestones are the fundamental unit of annotation, representing a specific
 * time range in the video with associated transcription, translation, and
 * voiceover data.
 */
export interface Milestone {
  /** Unique annotation identifier from EAF file */
  annotationID: string;

  /** Array of annotation data (transcription, translation, voiceover) */
  data: MilestoneData[];

  /** Segment start time in milliseconds */
  startTime: number;

  /** Segment stop time in milliseconds */
  stopTime: number;

  /** Optional start time slot ID from EAF file */
  startId?: string;
}

/**
 * Timeline contains milestones and sync media references
 *
 * A timeline represents a complete annotation session for a video,
 * containing all time-aligned annotations and references to the
 * source media files.
 */
export interface Timeline {
  /** Array of time-segmented annotations */
  milestones: Milestone[];

  /** Array of synchronized media file paths [videoPath, carefulPath, translPath] */
  syncMedia: string[];

  /** Optional timeline name */
  name?: string;

  /** Optional timeline identifier */
  id?: string;
}

/**
 * Annotation row in the table view
 *
 * Simplified representation of a milestone for display in the
 * annotation table UI, with flattened text fields.
 */
export interface AnnotationRow {
  /** Row index/identifier */
  id: number;

  /** Segment start time in milliseconds */
  startTime: number;

  /** Segment stop time in milliseconds */
  stopTime: number;

  /** Careful voiceover audio reference */
  audCareful: string;

  /** Translation voiceover audio reference */
  audTransl: string;

  /** Transcription text */
  txtTransc: string;

  /** Translation text */
  txtTransl: string;
}

/**
 * Video clip definition for export
 *
 * Defines a complete video clip with multiple audio tracks, used for
 * generating final exported videos with synchronized transcription
 * and translation content.
 */
export interface VideoClip {
  // Video track
  /** Video file path */
  V1: string;
  /** Video start time in seconds */
  V1Start: number;
  /** Video stop time in seconds */
  V1Stop: number;
  /** Video playback speed multiplier */
  V1Speed: number;

  // Primary audio track
  /** Primary audio file path */
  A1: string;
  /** Primary audio start time in seconds */
  A1Start: number;
  /** Primary audio stop time in seconds */
  A1Stop: number;
  /** Primary audio playback speed multiplier */
  A1Speed: number;
  /** Primary audio volume (0.0 to 1.0) */
  A1Vol: number;

  // Secondary audio track (optional voiceover)
  /** Whether secondary audio track is present */
  isA2: boolean;
  /** Secondary audio file path */
  A2?: string;
  /** Secondary audio start time in seconds */
  A2Start?: number;
  /** Secondary audio stop time in seconds */
  A2Stop?: number;
  /** Secondary audio playback speed multiplier */
  A2Speed?: number;
  /** Secondary audio volume (0.0 to 1.0) */
  A2Vol?: number;

  // Subtitle
  /** Optional subtitle text to burn into video */
  subtitle?: string;

  // Metadata
  /** Optional comment or description */
  Comment?: string;
}

/**
 * Audio clip definition for audio-only export
 *
 * Mirrors the audio portion of VideoClip but omits video fields and
 * adds timeline metadata for caption generation.
 */
export interface AudioClip {
  /** Primary audio file path */
  A1: string;
  /** Primary audio start time in seconds */
  A1Start: number;
  /** Primary audio stop time in seconds */
  A1Stop: number;
  /** Primary audio playback speed multiplier */
  A1Speed: number;
  /** Primary audio volume (0.0 to 1.0) */
  A1Vol: number;
  /** Whether secondary audio track is present */
  isA2: boolean;
  /** Secondary audio file path */
  A2?: string;
  /** Secondary audio start time */
  A2Start?: number;
  /** Secondary audio stop time */
  A2Stop?: number;
  /** Secondary audio playback speed multiplier */
  A2Speed?: number;
  /** Secondary audio volume (0.0 to 1.0) */
  A2Vol?: number;
  /** Subtitle text aligned with this segment */
  subtitle?: string;
  /** Optional comment or description */
  Comment?: string;
  /** Timeline-relative start time (seconds) for SRT export */
  timelineStart: number;
  /** Timeline-relative stop time (seconds) for SRT export */
  timelineStop: number;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * Annotation module state
 *
 * Complete state for the annotation store, managing timelines,
 * annotations, and UI visibility flags for various panels.
 */
export interface AnnotationState {
  /** Set of all annotations (legacy, may be deprecated) */
  annotationSet: any[];

  /** Flattened annotation data for table view */
  annotationTable: AnnotationRow[];

  /** Current annotations (legacy, may be deprecated) */
  annotations: any[];

  /** Whether careful voiceover is visible in main view */
  audCarefulMain: boolean;

  /** Whether translation voiceover is visible in main view */
  audTranslMain: boolean;

  /** Array of annotation categories */
  categories: string[];

  /** Index of currently active timeline */
  currentTimeline: number;

  /** Whether file info panel is visible in main view */
  fileInfoMain: boolean;

  /** Index of previously active timeline */
  prevTimeline: number;

  /** Whether SayMore metadata panel is visible in main view */
  sayMoreMetaMain: boolean;

  /** Array of all timelines loaded from EAF files */
  timeline: Timeline[];

  /** Whether timeline data has been modified since last save */
  timelineChanged: boolean;

  /** Whether timelines have been instantiated with WaveSurfer instances */
  timelinesInstantiated: boolean;

  /** Whether transcription text is visible in main view */
  txtTranscMain: boolean;

  /** Whether transcription text is shown as subtitle */
  txtTranscSubtitle: boolean;

  /** Whether translation text is visible in main view */
  txtTranslMain: boolean;

  /** Whether translation text is shown as subtitle */
  txtTranslSubtitle: boolean;
}

// ============================================================================
// ACTION TYPE CONSTANTS
// ============================================================================

// STATE MANAGEMENT
/**
 * Load complete annotation state from file
 */
export const LOAD_ANNOT = "LOAD_ANNOT";

/**
 * Hard reset entire application state
 */
export const HARD_RESET_APP = "HARD_RESET_APP";

/**
 * Open new folder and load annotations
 */
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";

/**
 * Reload annotations from current folder
 */
export const ON_RELOAD_FOLDER = "ON_RELOAD_FOLDER";

/**
 * Reset annotation session to clean state
 */
export const RESET_ANNOTATION_SESSION = "RESET_ANNOTATION_SESSION";

// TIMELINE MANAGEMENT
/**
 * Add new timeline to timeline array
 */
export const PUSH_TIMELINE = "PUSH_TIMELINE";

/**
 * Set media URL for current timeline
 */
export const SET_URL = "SET_URL";

/**
 * Update previous timeline index
 */
export const UPDATE_PREV_TIMELINE = "UPDATE_PREV_TIMELINE";

/**
 * Mark timeline as changed (unsaved modifications)
 */
export const SET_TIMELINE_CHANGED = "SET_TIMELINE_CHANGED";

/**
 * Mark timelines as instantiated with WaveSurfer
 */
export const SET_TIMELINES_INSTANTIATED = "SET_TIMELINES_INSTANTIATED";

// ANNOTATION MANAGEMENT
/**
 * Add oral annotation (voiceover) to timeline
 */
export const ADD_ORAL_ANNOTATION = "ADD_ORAL_ANNOTATION";

/**
 * Push annotations to milestone array
 * Note: Despite the name "REMOVE_ANNOTATION", this actually adds annotations
 */
export const PUSH_ANNOTATION = "REMOVE_ANNOTATION";

/**
 * Push annotation rows to table view
 */
export const PUSH_ANNOTATION_TABLE = "PUSH_ANNOTATION_TABLE";

/**
 * Add new category to categories array
 */
export const ADD_CATEGORY = "ADD_CATEGORY";

// FILE MANAGEMENT
/**
 * Handle file deletion event
 */
export const FILE_DELETED = "FILE_DELETED";

// UI VISIBILITY TOGGLES
/**
 * Toggle careful voiceover visibility in main view
 */
export const TOGGLE_AUDCAREFUL_MAIN = "TOGGLE_AUDCAREFUL_MAIN";

/**
 * Toggle transcription audio visibility in main view (unused)
 */
export const TOGGLE_AUDTRANSC_MAIN = "TOGGLE_AUDTRANSC_MAIN";

/**
 * Toggle translation voiceover visibility in main view
 */
export const TOGGLE_AUDTRANSL_MAIN = "TOGGLE_AUDTRANSL_MAIN";

/**
 * Toggle translation voiceover as subtitle (unused)
 */
export const TOGGLE_AUDTRANSL_SUB = "TOGGLE_AUDTRANSL_SUB";

/**
 * Toggle transcription text as subtitle
 */
export const TOGGLE_TRANSC_SUB = "DISABLE_TRANSC_SUB";

/**
 * Toggle translation text visibility in main view
 */
export const TOGGLE_TXTTRANSL_MAIN = "TOGGLE_TXTTRANSL_MAIN";

/**
 * Toggle SayMore metadata panel visibility
 */
export const TOGGLE_META_MAIN = "TOGGLE_META_MAIN";

/**
 * Toggle file info panel visibility
 */
export const TOGGLE_FILEINFO = "TOGGLE_FILEINFO";

// ============================================================================
// ACTION INTERFACES
// ============================================================================

/**
 * Load complete annotation state
 */
interface LoadAnnot {
  type: typeof LOAD_ANNOT;
  payload: AnnotationState;
}

/**
 * Hard reset application
 */
interface HardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

/**
 * Open new folder
 */
interface OnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { inString: string; blobURL?: string };
}

/**
 * Reload current folder
 */
interface OnReloadFolder {
  type: typeof ON_RELOAD_FOLDER;
  payload: { inString: string; blobURL?: string };
}

/**
 * Add oral annotation (voiceover)
 */
interface AddOralAnnotation {
  type: typeof ADD_ORAL_ANNOTATION;
  payload: LooseObject;
}

/**
 * Push annotations to milestone array
 */
interface PushAnnotation {
  type: typeof PUSH_ANNOTATION;
  payload: Milestone[];
}

/**
 * Push annotation rows to table
 */
interface PushAnnotationTable {
  type: typeof PUSH_ANNOTATION_TABLE;
  payload: AnnotationRow[];
}

/**
 * Add new timeline
 */
interface PushTimeline {
  type: typeof PUSH_TIMELINE;
  payload: Timeline;
}

/**
 * Add new category
 */
interface AddCategory {
  type: typeof ADD_CATEGORY;
  payload: string;
}

/**
 * Toggle careful voiceover visibility
 * Payload: optional boolean to force state
 */
interface ToggleAudcarefulMain {
  type: typeof TOGGLE_AUDCAREFUL_MAIN;
  payload?: boolean;
}

/**
 * Toggle translation voiceover visibility
 * Payload: optional boolean to force state
 */
interface ToggleAudtranslMain {
  type: typeof TOGGLE_AUDTRANSL_MAIN;
  payload?: boolean;
}

/**
 * Toggle transcription audio visibility (unused)
 * Payload: optional boolean to force state
 */
interface ToggleAudtranscMain {
  type: typeof TOGGLE_AUDTRANSC_MAIN;
  payload?: boolean;
}

/**
 * Toggle transcription text as subtitle
 * Payload: optional boolean to force state
 */
interface ToggleTranscSub {
  type: typeof TOGGLE_TRANSC_SUB;
  payload?: boolean;
}

/**
 * Toggle translation text visibility
 * Payload: optional boolean to force state
 */
interface ToggleTxttranslMain {
  type: typeof TOGGLE_TXTTRANSL_MAIN;
  payload?: boolean;
}

/**
 * Toggle translation voiceover as subtitle (unused)
 * Payload: optional boolean to force state
 */
interface ToggleAudtranslSub {
  type: typeof TOGGLE_AUDTRANSL_SUB;
  payload?: boolean;
}

/**
 * Toggle SayMore metadata panel
 * Payload: optional boolean to force state
 */
interface ToggleMetaMain {
  type: typeof TOGGLE_META_MAIN;
  payload?: boolean;
}

/**
 * Toggle file info panel
 * Payload: optional boolean to force state
 */
interface ToggleFileinfo {
  type: typeof TOGGLE_FILEINFO;
  payload?: boolean;
}

/**
 * Set media URL for timeline
 */
interface SetURL {
  type: typeof SET_URL;
  payload: { blobURL: string; timelineIndex: number };
}

/**
 * Handle file deletion
 */
interface FileDeleted {
  type: typeof FILE_DELETED;
  payload: string;
}

/**
 * Update previous timeline index
 */
interface UpdatePrevTimeline {
  type: typeof UPDATE_PREV_TIMELINE;
  payload: number;
}

/**
 * Mark timelines as instantiated
 */
interface SetTimelinesInstantiated {
  type: typeof SET_TIMELINES_INSTANTIATED;
  payload: boolean;
}

/**
 * Mark timeline as changed
 */
interface SetTimelineChanged {
  type: typeof SET_TIMELINE_CHANGED;
  payload: boolean;
}

// ============================================================================
// ACTION UNION TYPE
// ============================================================================

/**
 * Union of all annotation action types
 *
 * This type ensures type safety across all annotation-related actions,
 * allowing TypeScript to infer the correct payload type based on
 * the action type in reducers and middleware.
 */
export type AnnotationActionTypes =
  | LoadAnnot
  | HardResetApp
  | OnNewFolder
  | OnReloadFolder
  | AddOralAnnotation
  | PushAnnotation
  | PushAnnotationTable
  | PushTimeline
  | AddCategory
  | ToggleAudcarefulMain
  | ToggleAudtranslMain
  | ToggleAudtranscMain
  | ToggleTranscSub
  | ToggleTxttranslMain
  | ToggleAudtranslSub
  | ToggleMetaMain
  | ToggleFileinfo
  | SetURL
  | FileDeleted
  | UpdatePrevTimeline
  | SetTimelinesInstantiated
  | SetTimelineChanged;
