/**
 * Tree Redux Actions
 *
 * This module provides action creators for managing the file tree state,
 * including:
 * - Folder operations (open, reload, path tracking)
 * - Tree state management (bulk updates, session loading)
 * - File system events (add, change, delete)
 * - Media categorization (source vs annotation)
 * - Waveform data management
 * - Media file permissions (WaveSurfer, milestones)
 *
 * Action groups:
 * - STATE MANAGEMENT: updateTree, loadTree, treeHardResetApp, treeOnNewFolder
 * - FILE OPERATIONS: fileAdded, fileChanged, fileDeleted
 * - MEDIA OPERATIONS: sourceMediaAdded/Changed, annotMediaAdded/Changed
 * - WAVEFORM: waveformAdded
 * - MEDIA FLAGS: setAnnotMediaInMilestones, setAnnotMediaWSAllowed, setSourceMediaWSAllowed
 * - PATH TRACKING: changePrevPath
 *
 * @module store/tree/actions
 */

import * as types from "./types";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Update entire tree state
 *
 * Replaces the current tree state with a new complete state object.
 * Used for bulk updates when multiple properties need to change at once.
 *
 * @param {TreeState} newTree - Complete new tree state
 * @returns {TreeActionTypes} UPDATE_TREE action
 *
 * @example
 * // Update tree with newly loaded folder
 * dispatch(updateTree({
 *   ...treeCleanStore,
 *   folderPath: "/path/to/project",
 *   folderName: "MyProject",
 *   loaded: true,
 *   sourceMedia: loadedSourceFiles,
 *   annotMedia: loadedAnnotFiles
 * }));
 */
export function updateTree(newTree: types.TreeState): types.TreeActionTypes {
  return {
    type: types.UPDATE_TREE,
    payload: newTree,
  };
}

/**
 * Load complete tree state from saved session
 *
 * Restores the tree state from a previously saved session, typically when
 * reopening a project or restoring from localStorage.
 *
 * @param {TreeState} inState - Saved tree state to restore
 * @returns {TreeActionTypes} LOAD_TREE action
 *
 * @example
 * // Restore tree state from saved session
 * const savedState = JSON.parse(localStorage.getItem('treeState'));
 * dispatch(loadTree(savedState));
 *
 * @example
 * // Restore tree after application restart
 * if (window.electron && lastSession) {
 *   dispatch(loadTree(lastSession.tree));
 * }
 */
export function loadTree(inState: types.TreeState): types.TreeActionTypes {
  return {
    type: types.LOAD_TREE,
    payload: inState,
  };
}

/**
 * Hard reset entire application state
 *
 * Triggers a complete reset of all stores to their initial clean state.
 * Used when closing a project or resetting the application.
 *
 * @param {string} inString - Reset trigger message (for logging/debugging)
 * @returns {TreeActionTypes} HARD_RESET_APP action
 *
 * @example
 * // Reset application when closing project
 * dispatch(treeHardResetApp("Project closed"));
 *
 * @example
 * // Reset on critical error
 * dispatch(treeHardResetApp("Error recovery reset"));
 */
export function treeHardResetApp(inString: string): types.TreeActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}

/**
 * Open new folder and reset tree state
 *
 * Resets the tree to clean state and sets the new folder path.
 * This triggers folder loading logic in middleware/effects.
 *
 * @param {string} inString - Path to the new folder to open
 * @returns {TreeActionTypes} ON_NEW_FOLDER action
 *
 * @example
 * // User selects new project folder
 * const folderPath = await window.electron.dialog.showOpenDialog({
 *   properties: ['openDirectory']
 * });
 * dispatch(treeOnNewFolder(folderPath[0]));
 *
 * @example
 * // Open recent project
 * dispatch(treeOnNewFolder("/Users/name/Documents/MyProject"));
 */
export function treeOnNewFolder(inString: string): types.TreeActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString,
  };
}

// ============================================================================
// PATH TRACKING
// ============================================================================

/**
 * Update previous folder path
 *
 * Stores the previously active folder path for navigation history or
 * comparison purposes.
 *
 * @param {string} inPath - Path to the previous folder
 * @returns {TreeActionTypes} CHANGE_PREV_PATH action
 *
 * @example
 * // Track previous folder before switching
 * dispatch(changePrevPath(currentFolderPath));
 * dispatch(treeOnNewFolder(newFolderPath));
 */
export function changePrevPath(inPath: string): types.TreeActionTypes {
  return {
    type: types.CHANGE_PREV_PATH,
    payload: inPath,
  };
}

// ============================================================================
// FILE OPERATIONS - AVAILABLEFILES ARRAY
// ============================================================================

/**
 * Add new file to availableFiles array
 *
 * Triggered by file system watcher when a new file is created in the folder.
 * Note: This may be deprecated in favor of sourceMediaAdded/annotMediaAdded.
 *
 * @param {FileDesc} inFile - File descriptor with file metadata
 * @returns {TreeActionTypes} FILE_ADDED action
 *
 * @example
 * // File watcher detects new file
 * dispatch(fileAdded({ file: newFileMetadata }));
 */
export function fileAdded(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.FILE_ADDED,
    payload: inFile,
  };
}

/**
 * Update existing file in availableFiles array
 *
 * Triggered by file system watcher when a file is modified.
 * Replaces the old file entry with updated metadata.
 *
 * @param {FileDesc} inFile - Updated file descriptor
 * @returns {TreeActionTypes} FILE_CHANGED action
 *
 * @example
 * // File watcher detects file modification
 * dispatch(fileChanged({ file: updatedFileMetadata }));
 */
export function fileChanged(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.FILE_CHANGED,
    payload: inFile,
  };
}

/**
 * Remove file from all arrays
 *
 * Triggered by file system watcher when a file is deleted.
 * Removes the file from sourceMedia, annotMedia, and availableFiles arrays.
 *
 * @param {string} blobURL - Blob URL of the file to delete
 * @returns {TreeActionTypes} FILE_DELETED action
 *
 * @example
 * // File watcher detects file deletion
 * dispatch(fileDeleted("blob:http://localhost/video.mp4"));
 *
 * @example
 * // User deletes file from UI
 * const handleDelete = (media) => {
 *   await window.electron.fs.unlink(media.path);
 *   dispatch(fileDeleted(media.blobURL));
 * };
 */
export function fileDeleted(blobURL: string): types.TreeActionTypes {
  return {
    type: types.FILE_DELETED,
    payload: blobURL,
  };
}

// ============================================================================
// SOURCE MEDIA OPERATIONS
// ============================================================================

/**
 * Add new source media file
 *
 * Adds a new source media file (original video/audio content) to the
 * sourceMedia array. Source media files are the primary content that
 * gets annotated.
 *
 * @param {FileDesc} inFile - Source media file descriptor
 * @returns {TreeActionTypes} SOURCE_MEDIA_ADDED action
 *
 * @example
 * // Folder loader detects new video file
 * dispatch(sourceMediaAdded({
 *   file: {
 *     name: "interview.mp4",
 *     path: "/project/interview.mp4",
 *     blobURL: "blob:http://localhost/abc123",
 *     mimeType: "video/mp4",
 *     extension: ".mp4",
 *     hasAnnotation: true,  // Has matching .eaf file
 *     isAnnotation: false,  // Not an annotation file
 *     isMerged: false,
 *     inMilestones: false,
 *     wsAllowed: false,
 *     waveform: false
 *   }
 * }));
 */
export function sourceMediaAdded(
  inFile: types.FileDesc,
): types.TreeActionTypes {
  return {
    type: types.SOURCE_MEDIA_ADDED,
    payload: inFile,
  };
}

/**
 * Update existing source media file
 *
 * Replaces an existing source media file with updated metadata.
 * Used when a source file is modified (e.g., re-encoded, waveform added).
 *
 * @param {FileDesc} inFile - Updated source media file descriptor
 * @returns {TreeActionTypes} SOURCE_MEDIA_CHANGED action
 *
 * @example
 * // Update file after waveform generation
 * dispatch(sourceMediaChanged({
 *   file: {
 *     ...existingMedia,
 *     waveform: peakDataString
 *   }
 * }));
 */
export function sourceMediaChanged(
  inFile: types.FileDesc,
): types.TreeActionTypes {
  return {
    type: types.SOURCE_MEDIA_CHANGED,
    payload: inFile,
  };
}

// ============================================================================
// ANNOTATION MEDIA OPERATIONS
// ============================================================================

/**
 * Add new annotation media file
 *
 * Adds a new annotation media file (voiceover, subtitle) to the annotMedia
 * array. Annotation files are derivatives created from source media during
 * the annotation process.
 *
 * @param {FileDesc} inFile - Annotation media file descriptor
 * @returns {TreeActionTypes} ANNOT_MEDIA_ADDED action
 *
 * @example
 * // Folder loader detects new voiceover file
 * dispatch(annotMediaAdded({
 *   file: {
 *     name: "interview-CarefulVoice.wav",
 *     path: "/project/interview-CarefulVoice.wav",
 *     blobURL: "blob:http://localhost/xyz789",
 *     mimeType: "audio/wav",
 *     extension: ".wav",
 *     hasAnnotation: false,
 *     isAnnotation: true,   // This IS an annotation file
 *     isMerged: false,
 *     inMilestones: false,
 *     wsAllowed: false,
 *     waveform: false
 *   }
 * }));
 */
export function annotMediaAdded(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.ANNOT_MEDIA_ADDED,
    payload: inFile,
  };
}

/**
 * Update existing annotation media file
 *
 * Replaces an existing annotation media file with updated metadata.
 * Used when an annotation file is modified or regenerated.
 *
 * @param {FileDesc} inFile - Updated annotation media file descriptor
 * @returns {TreeActionTypes} ANNOT_MEDIA_CHANGED action
 *
 * @example
 * // Update after waveform generation
 * dispatch(annotMediaChanged({
 *   file: {
 *     ...existingAnnot,
 *     waveform: peakDataString,
 *     wsAllowed: true
 *   }
 * }));
 */
export function annotMediaChanged(
  inFile: types.FileDesc,
): types.TreeActionTypes {
  return {
    type: types.ANNOT_MEDIA_CHANGED,
    payload: inFile,
  };
}

// ============================================================================
// WAVEFORM MANAGEMENT
// ============================================================================

/**
 * Add waveform data to a media file
 *
 * Attaches waveform peak data to a media file for audio visualization.
 * The waveform data is generated by WaveSurfer and stored as a string.
 *
 * @param {Wavein} waveIn - Waveform input data
 * @param {string} waveIn.ref - Blob URL reference to the media file
 * @param {boolean} waveIn.sourceAnnot - True for source media, false for annotation
 * @param {boolean|string} waveIn.wavedata - Waveform peak data or false if none
 * @returns {TreeActionTypes} WAVEFORM_ADDED action
 *
 * @example
 * // Add waveform to source video
 * dispatch(waveformAdded({
 *   ref: "blob:http://localhost/abc123",
 *   sourceAnnot: true,  // It's in sourceMedia array
 *   wavedata: "[0.1,0.2,0.3,...]"  // Peak data string
 * }));
 *
 * @example
 * // Add waveform to annotation audio
 * dispatch(waveformAdded({
 *   ref: "blob:http://localhost/xyz789",
 *   sourceAnnot: false,  // It's in annotMedia array
 *   wavedata: peakDataString
 * }));
 */
export function waveformAdded(waveIn: types.Wavein): types.TreeActionTypes {
  return {
    type: types.WAVEFORM_ADDED,
    payload: waveIn,
  };
}

// ============================================================================
// MEDIA FLAGS AND PERMISSIONS
// ============================================================================

/**
 * Mark annotation media as present in timeline milestones
 *
 * Sets the inMilestones flag to true for an annotation file, indicating
 * it's referenced in the timeline's milestone structure and shouldn't be
 * unloaded or deleted.
 *
 * @param {string} blobURL - Blob URL of the annotation file
 * @returns {TreeActionTypes} SET_ANNOT_MEDIA_IN_MILESTONES action
 *
 * @example
 * // Mark voiceover as used in timeline
 * dispatch(setAnnotMediaInMilestones("blob:http://localhost/voiceover.wav"));
 */
export function setAnnotMediaInMilestones(
  blobURL: string,
): types.TreeActionTypes {
  return {
    type: types.SET_ANNOT_MEDIA_IN_MILESTONES,
    payload: blobURL,
  };
}

/**
 * Mark annotation media as allowed for WaveSurfer
 *
 * Sets the wsAllowed flag to true for an annotation file, indicating
 * it can be loaded into a WaveSurfer instance for waveform visualization.
 * This prevents conflicts with multiple WaveSurfer instances.
 *
 * @param {string} blobURL - Blob URL of the annotation file
 * @returns {TreeActionTypes} SET_ANNOT_MEDIA_WS_ALLOWED action
 *
 * @example
 * // Allow voiceover to be loaded in WaveSurfer
 * dispatch(setAnnotMediaWSAllowed("blob:http://localhost/voiceover.wav"));
 */
export function setAnnotMediaWSAllowed(blobURL: string): types.TreeActionTypes {
  return {
    type: types.SET_ANNOT_MEDIA_WS_ALLOWED,
    payload: blobURL,
  };
}

/**
 * Mark source media as allowed for WaveSurfer
 *
 * Sets the wsAllowed flag to true for a source file, indicating it can
 * be loaded into a WaveSurfer instance for waveform visualization.
 *
 * @param {string} blobURL - Blob URL of the source media file
 * @returns {TreeActionTypes} SET_SOURCE_MEDIA_WS_ALLOWED action
 *
 * @example
 * // Allow source video to be loaded in WaveSurfer
 * dispatch(setSourceMediaWSAllowed("blob:http://localhost/video.mp4"));
 */
export function setSourceMediaWSAllowed(
  blobURL: string,
): types.TreeActionTypes {
  return {
    type: types.SET_SOURCE_MEDIA_WS_ALLOWED,
    payload: blobURL,
  };
}
