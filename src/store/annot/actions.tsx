/**
 * Annotation Redux Action Creators
 *
 * This module provides action creators for the annotation store, which manages:
 * - Timeline data loaded from EAF files
 * - Annotation milestones with linguistic data
 * - UI visibility toggles for annotation panels
 * - Category and metadata management
 *
 * Action groups:
 * - State Management: Load/reset annotation state
 * - Timeline Management: Add timelines, track changes, instantiation
 * - Annotation Management: Add/push annotations, categories
 * - UI Visibility Toggles: Show/hide annotation panels and subtitles
 *
 * @module store/annot/actions
 */

import * as types from "./types";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Hard reset entire application
 *
 * Triggers a complete application reset, clearing all state across all stores.
 * This is typically called when starting a new session or closing a project.
 *
 * @param {string} inString - Reset identifier or reason
 * @returns {AnnotationActionTypes} Hard reset action
 *
 * @example
 * // Reset application when closing project
 * dispatch(hardResetApp("close_project"));
 */
export function hardResetApp(inString: string): types.AnnotationActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}

/**
 * Load complete annotation state
 *
 * Loads a complete annotation state object, typically from a saved session file.
 * This replaces the entire annotation store with the loaded state.
 *
 * @param {AnnotationState} inState - Complete annotation state to load
 * @returns {AnnotationActionTypes} Load annotation action
 *
 * @example
 * // Load saved annotation session
 * const savedState = JSON.parse(sessionData);
 * dispatch(loadAnnot(savedState));
 */
export function loadAnnot(
  inState: types.AnnotationState,
): types.AnnotationActionTypes {
  return {
    type: types.LOAD_ANNOT,
    payload: inState,
  };
}

/**
 * Open new folder and load annotations
 *
 * Opens a new project folder and loads all EAF annotation files found within.
 * This resets the annotation state and parses all timeline data from the folder.
 *
 * @param {string} inString - Folder path to open
 * @param {string} [blobURL] - Optional blob URL for media file
 * @returns {AnnotationActionTypes} Open folder action
 *
 * @example
 * // Open new annotation folder
 * dispatch(onNewFolder("/path/to/project"));
 *
 * @example
 * // Open folder with preloaded media
 * dispatch(onNewFolder("/path/to/project", "blob:http://localhost/video.mp4"));
 */
export function onNewFolder(
  inString: string,
  blobURL?: string,
): types.AnnotationActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: { inString, blobURL },
  };
}

/**
 * Reload annotations from current folder
 *
 * Reloads all EAF files from the currently open folder, refreshing the
 * annotation data. This is useful when annotation files have been modified
 * externally.
 *
 * @param {string} inString - Folder path to reload
 * @returns {AnnotationActionTypes} Reload folder action
 *
 * @example
 * // Reload current folder after external changes
 * dispatch(onReloadFolder("/path/to/project"));
 */
export function onReloadFolder(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ON_RELOAD_FOLDER,
    payload: { inString },
  };
}

// ============================================================================
// TIMELINE MANAGEMENT
// ============================================================================

/**
 * Add new timeline to timeline array
 *
 * Pushes a new timeline object to the timeline array. Each timeline represents
 * a complete annotation session for a video file.
 *
 * @param {LooseObject} timeline - Timeline object to add
 * @returns {AnnotationActionTypes} Push timeline action
 *
 * @example
 * // Add newly loaded timeline
 * dispatch(pushTimeline({
 *   milestones: parsedMilestones,
 *   syncMedia: ["video.mp4", "careful.wav", "translation.wav"],
 *   name: "Interview 1"
 * }));
 */
export function pushTimeline(
  timeline: types.LooseObject,
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_TIMELINE,
    payload: timeline,
  };
}

/**
 * Update previous timeline index
 *
 * Tracks which timeline was previously active before switching to a new one.
 * This is used for cleanup and state management when switching between timelines.
 *
 * @param {number} idx - Index of previously active timeline
 * @returns {AnnotationActionTypes} Update previous timeline action
 *
 * @example
 * // Store current timeline index before switching
 * dispatch(updatePrevTimeline(currentTimelineIndex));
 */
export function updatePrevTimeline(idx: number): types.AnnotationActionTypes {
  return {
    type: types.UPDATE_PREV_TIMELINE,
    payload: idx,
  };
}

/**
 * Mark timelines as instantiated with WaveSurfer
 *
 * Sets a flag indicating that WaveSurfer instances have been created for
 * all timelines. This ensures audio waveforms are ready for playback.
 *
 * @param {boolean} bln - Whether timelines are instantiated
 * @returns {AnnotationActionTypes} Set timelines instantiated action
 *
 * @example
 * // Mark timelines as ready after WaveSurfer setup
 * dispatch(setTimelinesInstantiated(true));
 */
export function setTimelinesInstantiated(
  bln: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINES_INSTANTIATED,
    payload: bln,
  };
}

/**
 * Mark timeline as changed
 *
 * Sets a flag indicating that timeline data has been modified since the last
 * save. This is used to prompt the user to save changes before closing.
 *
 * @param {boolean} bln - Whether timeline has unsaved changes
 * @returns {AnnotationActionTypes} Set timeline changed action
 *
 * @example
 * // Mark timeline as modified after editing annotation
 * dispatch(setTimelineChanged(true));
 *
 * @example
 * // Clear changed flag after successful save
 * dispatch(setTimelineChanged(false));
 */
export function setTimelineChanged(bln: boolean): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINE_CHANGED,
    payload: bln,
  };
}

/**
 * Set view mode based on EAF file complexity
 *
 * Sets whether to show column view (DeeJay) for simple SayMore files
 * or grid view (AnnotationTable) for complex ELAN files.
 *
 * @param {boolean} isSimple - Whether file is a simple SayMore file (≤3 tiers)
 * @param {types.TierMetadata[]} tiers - Tier metadata from parsed EAF file
 * @returns {AnnotationActionTypes} Set view mode action
 *
 * @example
 * // After parsing EAF file
 * dispatch(setViewMode(result.isSimpleSayMoreFile, result.tiers));
 */
export function setViewMode(
  isSimple: boolean,
  tiers: types.TierMetadata[],
): types.AnnotationActionTypes {
  return {
    type: types.SET_VIEW_MODE,
    payload: { isSimpleSayMoreFile: isSimple, tierMetadata: tiers },
  };
}

// ============================================================================
// ANNOTATION MANAGEMENT
// ============================================================================

/**
 * Add oral annotation (voiceover) to timeline
 *
 * Adds a new voiceover annotation milestone at a specific timeline index.
 * This is used when recording new voiceover segments.
 *
 * @param {Milestone} newMilestone - New milestone with voiceover data
 * @param {number} idx - Timeline index to add annotation to
 * @returns {AnnotationActionTypes} Add oral annotation action
 *
 * @example
 * // Add new voiceover annotation
 * dispatch(addOralAnnotation({
 *   annotationID: "a1",
 *   data: [{
 *     channel: "audCareful",
 *     data: voiceoverBlob,
 *     linguisticType: "voiceover",
 *     locale: "en",
 *     mimeType: "audio/wav",
 *     clipStart: 0,
 *     clipStop: 5.2
 *   }],
 *   startTime: 1000,
 *   stopTime: 6200
 * }, 0));
 */
export function addOralAnnotation(
  newMilestone: types.Milestone,
  idx: number,
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ORAL_ANNOTATION,
    payload: { newMilestone, idx },
  };
}

/**
 * Push annotations to milestone array
 *
 * Replaces the current milestone array with a new one. Used when loading
 * or refreshing annotation data.
 *
 * Note: Despite the constant name "REMOVE_ANNOTATION", this action actually
 * adds/replaces the milestone array.
 *
 * @param {Milestone[]} milestones - Array of milestones to set
 * @returns {AnnotationActionTypes} Push annotation action
 *
 * @example
 * // Load parsed annotations from EAF file
 * dispatch(pushAnnotation(parsedMilestones));
 */
export function pushAnnotation(
  milestones: types.Milestone[],
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION,
    payload: milestones,
  };
}

/**
 * Push annotation rows to table view
 *
 * Updates the annotation table with flattened milestone data for display
 * in the table UI. Each row represents a time segment with text fields.
 *
 * @param {AnnotationRow[]} inTable - Array of annotation rows for table
 * @returns {AnnotationActionTypes} Push annotation table action
 *
 * @example
 * // Update annotation table after loading timeline
 * dispatch(pushAnnotationTable(flattenedRows));
 */
export function pushAnnotationTable(
  inTable: types.AnnotationRow[],
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION_TABLE,
    payload: inTable,
  };
}

/**
 * Add new category to categories array
 *
 * Adds a new annotation category to the available categories list.
 * Categories are used to organize and filter annotations.
 *
 * @param {string} inString - Category name to add
 * @returns {AnnotationActionTypes} Add category action
 *
 * @example
 * // Add new category
 * dispatch(addCategory("Interview"));
 *
 * @example
 * // Add topic category
 * dispatch(addCategory("Technical Discussion"));
 */
export function addCategory(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ADD_CATEGORY,
    payload: inString,
  };
}

// ============================================================================
// UI VISIBILITY TOGGLES
// ============================================================================

/**
 * Toggle careful voiceover visibility in main view
 *
 * Shows or hides the careful voiceover waveform and controls in the main UI.
 * Can optionally force a specific state.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle careful voiceover action
 *
 * @example
 * // Toggle visibility
 * dispatch(toggleAudcarefulMain());
 *
 * @example
 * // Force show
 * dispatch(toggleAudcarefulMain(true));
 *
 * @example
 * // Force hide
 * dispatch(toggleAudcarefulMain(false));
 */
export function toggleAudcarefulMain(
  toggle?: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDCAREFUL_MAIN,
    payload: toggle,
  };
}

/**
 * Toggle translation voiceover visibility in main view
 *
 * Shows or hides the translation voiceover waveform and controls in the main UI.
 * Can optionally force a specific state.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle translation voiceover action
 *
 * @example
 * // Toggle visibility
 * dispatch(toggleAudtranslMain());
 *
 * @example
 * // Force show translation voiceover
 * dispatch(toggleAudtranslMain(true));
 */
export function toggleAudtranslMain(
  toggle?: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSL_MAIN,
    payload: toggle,
  };
}

/**
 * Toggle transcription audio visibility in main view
 *
 * Shows or hides transcription audio controls in the main UI.
 * Note: This feature may not be actively used in current implementation.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle transcription audio action
 *
 * @example
 * // Toggle visibility
 * dispatch(toggleAudtranscMain());
 */
export function toggleAudtranscMain(
  toggle?: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSC_MAIN,
    payload: toggle,
  };
}

/**
 * Toggle transcription text as subtitle
 *
 * Shows or hides transcription text as a subtitle overlay on the video.
 * When enabled, the original language text appears as subtitles.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle transcription subtitle action
 *
 * @example
 * // Toggle transcription subtitle
 * dispatch(toggleTranscSub());
 *
 * @example
 * // Show transcription as subtitle
 * dispatch(toggleTranscSub(true));
 */
export function toggleTranscSub(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_TRANSC_SUB,
    payload: toggle,
  };
}

/**
 * Toggle translation text visibility in main view
 *
 * Shows or hides translation text in the main UI. When enabled,
 * the translated text is displayed alongside the original.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle translation text action
 *
 * @example
 * // Toggle translation text
 * dispatch(toggleTxttranslMain());
 *
 * @example
 * // Show translation text
 * dispatch(toggleTxttranslMain(true));
 */
export function toggleTxttranslMain(
  toggle?: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_TXTTRANSL_MAIN,
    payload: toggle,
  };
}

/**
 * Toggle translation voiceover as subtitle
 *
 * Shows or hides translation voiceover indicator as subtitle.
 * Note: This feature may not be actively used in current implementation.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle translation subtitle action
 *
 * @example
 * // Toggle translation subtitle
 * dispatch(toggleAudtranslSub());
 */
export function toggleAudtranslSub(
  toggle?: boolean,
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSL_SUB,
    payload: toggle,
  };
}

/**
 * Toggle SayMore metadata panel visibility
 *
 * Shows or hides the SayMore metadata panel in the main UI. This panel
 * displays metadata about the annotation session from SayMore software.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle metadata panel action
 *
 * @example
 * // Toggle metadata panel
 * dispatch(toggleMetaMain());
 *
 * @example
 * // Show metadata panel
 * dispatch(toggleMetaMain(true));
 */
export function toggleMetaMain(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_META_MAIN,
    payload: toggle,
  };
}

/**
 * Toggle file info panel visibility
 *
 * Shows or hides the file information panel in the main UI. This panel
 * displays details about the loaded media files and project structure.
 *
 * @param {boolean} [toggle] - Optional: force visible (true) or hidden (false)
 * @returns {AnnotationActionTypes} Toggle file info action
 *
 * @example
 * // Toggle file info panel
 * dispatch(toggleFileinfo());
 *
 * @example
 * // Hide file info panel
 * dispatch(toggleFileinfo(false));
 */
export function toggleFileinfo(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_FILEINFO,
    payload: toggle,
  };
}
