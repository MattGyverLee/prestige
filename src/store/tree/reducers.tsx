/**
 * Tree Redux Reducer
 *
 * This module contains the reducer and initial state for the tree store,
 * which manages the file tree, media files, and folder structure.
 *
 * The reducer handles:
 * - Folder operations (open, reload, path changes)
 * - Tree state updates (bulk updates, session loading)
 * - File system events (add, change, delete)
 * - Media categorization (source vs annotation arrays)
 * - Waveform data attachment
 * - Media permissions (WaveSurfer, milestones)
 *
 * @module store/tree/reducers
 */

import * as types from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Runtime environment from .env config
 * Used for environment-specific behavior (development vs production)
 */
const env = process.env.REACT_APP_MODE + "";

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial clean state for the tree store
 *
 * This represents a fresh, uninitialized state before opening a folder:
 * - No folder loaded (empty paths)
 * - No media files loaded
 * - All arrays empty
 * - Runtime environment from config
 *
 * Used for:
 * - Initial application load
 * - Post-folder-close state
 * - Hard app reset
 * - New folder initialization
 */
export const treeCleanStore: types.TreeState = {
  /**
   * All files in folder (may be deprecated in favor of sourceMedia/annotMedia)
   */
  availableFiles: [],

  /**
   * Source media files (original video/audio content to be annotated)
   */
  sourceMedia: [],

  /**
   * Annotation media files (voiceovers, subtitles, derivatives)
   */
  annotMedia: [],

  /**
   * Runtime environment (development/production)
   */
  env: env,

  /**
   * Current project folder name (e.g., "MyProject")
   */
  folderName: "",

  /**
   * Current project folder absolute path (e.g., "/Users/name/MyProject")
   */
  folderPath: "",

  /**
   * Whether folder has been fully loaded and scanned
   */
  loaded: false,

  /**
   * Previously active folder path (for navigation history)
   */
  prevPath: "",
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Tree reducer function
 *
 * Handles all actions related to file tree management, folder operations,
 * and media file tracking. Maintains immutability by always returning a
 * new state object.
 *
 * Key principles:
 * - Always creates new arrays when modifying media lists (immutability)
 * - Filters by blobURL for uniqueness (each file has unique blob URL)
 * - Filters by filename for updates (replaces old with new)
 * - Handles both source and annotation media separately
 *
 * @param {TreeState} state - Current tree state (defaults to clean store)
 * @param {TreeActionTypes} action - Action to process
 * @returns {TreeState} New state after applying the action
 */
export function treeReducer(
  state = treeCleanStore,
  action: types.TreeActionTypes,
): types.TreeState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // FOLDER OPERATIONS
    // -------------------------------------------------------------------------

    case types.ON_NEW_FOLDER: {
      // User opened a new folder - update path
      // This triggers file loading in middleware/effects
      return { ...state, folderPath: action.payload };
    }

    case types.ON_RELOAD_FOLDER: {
      // Reload current folder (re-scan files)
      // Keeps the same path but triggers re-scan in middleware
      return { ...state, folderPath: action.payload };
    }

    case types.CHANGE_PREV_PATH: {
      // Track previous folder for navigation history
      return { ...state, prevPath: action.payload };
    }

    // -------------------------------------------------------------------------
    // STATE MANAGEMENT
    // -------------------------------------------------------------------------

    case types.UPDATE_TREE: {
      // Replace entire tree state with new state
      // Used for bulk updates when loading folder
      return {
        ...action.payload,
      };
    }

    case types.LOAD_TREE: {
      // Load complete tree state from saved session
      // Direct assignment for session restoration
      state = action.payload;
      return state;
    }

    // -------------------------------------------------------------------------
    // FILE ADDITION
    // -------------------------------------------------------------------------

    case types.FILE_ADDED: {
      // Add new file to availableFiles array
      // Note: May be deprecated in favor of sourceMediaAdded/annotMediaAdded
      return {
        ...state,
        availableFiles: [...state.availableFiles, action.payload.file],
      };
    }

    case types.SOURCE_MEDIA_ADDED: {
      // Add new source media file (video/audio to be annotated)
      // Appends to sourceMedia array with new reference for immutability
      return {
        ...state,
        sourceMedia: [...state.sourceMedia, action.payload.file],
      };
    }

    case types.ANNOT_MEDIA_ADDED: {
      // Add new annotation media file (voiceover, subtitle)
      // Appends to annotMedia array with new reference for immutability
      return {
        ...state,
        annotMedia: [...state.annotMedia, action.payload.file],
      };
    }

    // -------------------------------------------------------------------------
    // FILE MODIFICATION
    // -------------------------------------------------------------------------

    case types.FILE_CHANGED: {
      // Update existing file in availableFiles
      // Strategy: Filter out old file by name, append updated file
      const tempState = state.availableFiles.filter(
        (file) => file.name !== action.payload.file.name,
      );
      return {
        ...state,
        availableFiles: [...tempState, action.payload.file],
      };
    }

    case types.SOURCE_MEDIA_CHANGED: {
      // Update existing source media file
      // Strategy: Filter out old file by name, append updated file
      const tempState = state.sourceMedia.filter(
        (file) => file.name !== action.payload.file.name,
      );
      return {
        ...state,
        sourceMedia: [...tempState, action.payload.file],
      };
    }

    case types.ANNOT_MEDIA_CHANGED: {
      // Update existing annotation media file
      // Strategy: Filter out old file by name, append updated file
      const tempState = state.annotMedia.filter(
        (file) => file.name !== action.payload.file.name,
      );
      return {
        ...state,
        annotMedia: [...tempState, action.payload.file],
      };
    }

    // -------------------------------------------------------------------------
    // FILE DELETION
    // -------------------------------------------------------------------------

    case types.FILE_DELETED: {
      // Remove file from ALL arrays (availableFiles, sourceMedia, annotMedia)
      // Filters by blobURL since that's the unique identifier
      // File might be in multiple arrays, so we clean all of them
      return {
        ...state,
        sourceMedia: [
          ...state.sourceMedia.filter(
            (file) => file.blobURL !== action.payload,
          ),
        ],
        annotMedia: [
          ...state.annotMedia.filter((file) => file.blobURL !== action.payload),
        ],
        availableFiles: [
          ...state.availableFiles.filter(
            (file) => file.blobURL !== action.payload,
          ),
        ],
      };
    }

    // -------------------------------------------------------------------------
    // WAVEFORM MANAGEMENT
    // -------------------------------------------------------------------------

    case types.WAVEFORM_ADDED: {
      // Add waveform peak data to a media file
      // Strategy: Map over correct array, update matching file, create new array reference
      // sourceAnnot flag determines which array: true = sourceMedia, false = annotMedia
      const tempFiltered = (
        action.payload.sourceAnnot ? state.sourceMedia : state.annotMedia
      ).map((file) =>
        file.blobURL === action.payload.ref
          ? { ...file, waveform: action.payload.wavedata }
          : file,
      );

      // Return new state with updated array
      if (action.payload.sourceAnnot) {
        return {
          ...state,
          sourceMedia: [...tempFiltered],
        };
      } else {
        return {
          ...state,
          annotMedia: [...tempFiltered],
        };
      }
    }

    // -------------------------------------------------------------------------
    // MEDIA FLAGS AND PERMISSIONS
    // -------------------------------------------------------------------------

    case types.SET_ANNOT_MEDIA_IN_MILESTONES: {
      // Mark annotation media as referenced in timeline milestones
      // Strategy: Map over annotMedia, set inMilestones flag for matching file
      const tempAnnot = state.annotMedia.map((m) => {
        return m.blobURL === action.payload ? { ...m, inMilestones: true } : m;
      });
      return {
        ...state,
        annotMedia: tempAnnot,
      };
    }

    case types.SET_ANNOT_MEDIA_WS_ALLOWED: {
      // Mark annotation media as allowed for WaveSurfer loading
      // Strategy: Map over annotMedia, set wsAllowed flag for matching file
      return {
        ...state,
        annotMedia: state.annotMedia.map((m) => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        }),
      };
    }

    case types.SET_SOURCE_MEDIA_WS_ALLOWED: {
      // Mark source media as allowed for WaveSurfer loading
      // Strategy: Map over sourceMedia, set wsAllowed flag for matching file
      return {
        ...state,
        sourceMedia: state.sourceMedia.map((m) => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        }),
      };
    }

    // -------------------------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------------------------

    default:
      return state;
  }
}
