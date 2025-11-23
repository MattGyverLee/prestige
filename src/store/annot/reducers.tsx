/**
 * Annotation Redux Reducer
 *
 * This module contains the reducer and initial state for the annotation store,
 * which manages timeline data, annotation milestones, and UI visibility toggles.
 *
 * The reducer handles:
 * - Loading and parsing EAF annotation files
 * - Managing multiple timelines with synchronized media
 * - Adding oral annotations (voiceovers) to existing milestones
 * - Tracking UI panel visibility states
 * - Handling file deletions across all timelines
 * - Managing timeline change state for save prompts
 *
 * @module store/annot/reducers
 */

import * as types from "./types";

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial clean state for the annotation store
 *
 * This represents a fresh, uninitialized state before any annotations are loaded:
 * - No timelines loaded (empty timeline array)
 * - No annotations or categories
 * - All UI panels hidden by default
 * - Timeline index set to -1 (no active timeline)
 * - Placeholder "Not Loaded" message in annotation table
 *
 * Used for:
 * - Initial application load
 * - Resetting state when opening a new folder
 */
export const annCleanStore: types.AnnotationState = {
  /**
   * Legacy annotations array (may be deprecated)
   */
  annotations: [],

  /**
   * Legacy annotation set (may be deprecated)
   */
  annotationSet: [],

  /**
   * Annotation table rows for UI display
   * Starts with placeholder message before any annotations are loaded
   */
  annotationTable: [
    {
      id: 0,
      startTime: 0,
      txtTransc: "Not Loaded",
    },
  ],

  /**
   * Careful voiceover panel hidden by default
   */
  audCarefulMain: false,

  /**
   * Translation voiceover panel hidden by default
   */
  audTranslMain: false,

  /**
   * No categories defined initially
   */
  categories: [],

  /**
   * File info panel hidden by default
   */
  fileInfoMain: false,

  /**
   * SayMore metadata panel hidden by default
   */
  sayMoreMetaMain: false,

  /**
   * No timelines loaded initially
   */
  timeline: [],

  /**
   * No active timeline (-1 indicates no selection)
   */
  currentTimeline: -1,

  /**
   * No previous timeline (-1 indicates no previous selection)
   */
  prevTimeline: -1,

  /**
   * Transcription text panel hidden by default
   */
  txtTranscMain: false,

  /**
   * Transcription subtitle disabled by default
   */
  txtTranscSubtitle: false,

  /**
   * Translation text panel hidden by default
   */
  txtTranslMain: false,

  /**
   * Translation subtitle disabled by default
   */
  txtTranslSubtitle: false,

  /**
   * No unsaved changes initially
   */
  timelineChanged: false,

  /**
   * Timelines not yet instantiated with WaveSurfer
   */
  timelinesInstantiated: false,

  /**
   * View mode defaults to simple SayMore file (column view)
   * Will be updated when EAF file is loaded
   */
  isSimpleSayMoreFile: true,

  /**
   * No audio annotations initially (false)
   */
  hasAudioAnnotations: false,

  /**
   * Show waveforms by default when available
   */
  showWaveforms: true,

  /**
   * No tier metadata initially (empty array)
   */
  tierMetadata: [],
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Annotation reducer function
 *
 * Handles all actions related to annotation state management, timeline
 * operations, and UI toggles. Maintains immutability by always returning
 * a new state object.
 *
 * @param {AnnotationState} state - Current annotation state (defaults to clean store)
 * @param {AnnotationActionTypes} action - Action to process
 * @returns {AnnotationState} New state after applying the action
 */
export function annotationReducer(
  state = annCleanStore,
  action: types.AnnotationActionTypes,
): types.AnnotationState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // STATE MANAGEMENT
    // -------------------------------------------------------------------------

    case types.LOAD_ANNOT: {
      // Load complete annotation state from saved session
      // Replaces entire state with loaded data
      return { ...action.payload };
    }

    case types.ON_NEW_FOLDER: {
      // Mark timeline as changed when opening new folder
      // This triggers timeline loading/parsing
      return { ...state, timelineChanged: true };
    }

    case types.ON_RELOAD_FOLDER: {
      // Mark timeline as changed when reloading folder
      // This triggers timeline re-parsing
      return { ...state, timelineChanged: true };
    }

    case types.SET_URL: {
      // Set current timeline index when loading new media
      return {
        ...state,
        currentTimeline: action.payload.timelineIndex,
      };
    }

    // -------------------------------------------------------------------------
    // TIMELINE MANAGEMENT
    // -------------------------------------------------------------------------

    case types.PUSH_TIMELINE: {
      // Add new timeline to timeline array
      // Mark as changed to indicate new data needs processing
      return {
        ...state,
        timeline: state.timeline.concat(action.payload.timeline),
        timelineChanged: true,
      };
    }

    case types.UPDATE_PREV_TIMELINE: {
      // Store previous timeline index for cleanup
      // Clear changed flag since we're switching timelines
      return { ...state, prevTimeline: action.payload, timelineChanged: false };
    }

    case types.SET_TIMELINES_INSTANTIATED: {
      // Mark timelines as instantiated with WaveSurfer
      return { ...state, timelinesInstantiated: action.payload };
    }

    case types.SET_TIMELINE_CHANGED: {
      // Set timeline changed flag for save prompts
      return { ...state, timelineChanged: action.payload };
    }

    case types.SET_VIEW_MODE: {
      // Set view mode based on EAF file complexity
      return {
        ...state,
        isSimpleSayMoreFile: action.payload.isSimpleSayMoreFile,
        hasAudioAnnotations: action.payload.hasAudioAnnotations,
        tierMetadata: action.payload.tierMetadata,
        // Reset showWaveforms to true when loading new file
        showWaveforms: true,
      };
    }

    case types.TOGGLE_WAVEFORMS: {
      // Toggle waveform display (user preference)
      return {
        ...state,
        showWaveforms: !state.showWaveforms,
      };
    }

    // -------------------------------------------------------------------------
    // ANNOTATION MANAGEMENT
    // -------------------------------------------------------------------------

    case types.ADD_ORAL_ANNOTATION: {
      // Add voiceover annotation to timeline
      // Two cases:
      // 1. idx === -1: Create new timeline for standalone voiceover
      // 2. idx >= 0: Add to existing milestone or create new milestone

      if (action.payload.idx === -1) {
        // Case 1: Create new standalone voiceover timeline
        // Extract filename from voiceover data path
        let eafFile = action.payload.newMilestone.data[0].data;
        eafFile = eafFile.substring(0, eafFile.indexOf("_Annotations"));
        const syncMedia = eafFile;
        eafFile = eafFile.substring(0, eafFile.lastIndexOf(".")) + ".eaf";

        // Create new timeline with single milestone
        const timeline: types.LooseObject = {
          milestones: [action.payload.newMilestone],
          eafFile: eafFile,
          syncMedia: [syncMedia],
          instantiated: true,
        };

        return { ...state, timeline: [...state.timeline, timeline] };
      }

      // Case 2: Add to existing timeline
      // Try to find matching milestone (same start/stop time) to merge with
      let added = false;
      let milestones = state.timeline[action.payload.idx].milestones.map(
        (m: types.LooseObject) => {
          if (
            m.startTime === action.payload.newMilestone.startTime &&
            m.stopTime === action.payload.newMilestone.stopTime
          ) {
            // Found matching milestone - merge voiceover data into it
            added = true;
            return {
              ...m,
              data: [...m.data, ...action.payload.newMilestone.data],
            };
          } else {
            return m;
          }
        },
      );

      // If no matching milestone found, add as new milestone
      const newM = action.payload.newMilestone;
      if (!added) {
        milestones = [...milestones, newM];
      }

      // Update timeline with modified milestones
      return {
        ...state,
        timeline: state.timeline.map((t: types.LooseObject, i: number) =>
          i === action.payload.idx ? { ...t, milestones } : t,
        ),
      };
    }

    case types.PUSH_ANNOTATION: {
      // Replace annotations array with new data
      return {
        ...state,
        annotations: [action.payload],
      };
    }

    case types.PUSH_ANNOTATION_TABLE: {
      // Update annotation table and clear changed flag
      // Changed flag cleared because table push happens after save
      return {
        ...state,
        annotationTable: action.payload,
        timelineChanged: false,
      };
    }

    case types.ADD_CATEGORY: {
      // Add new category to categories array
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    }

    // -------------------------------------------------------------------------
    // FILE MANAGEMENT
    // -------------------------------------------------------------------------

    case types.FILE_DELETED: {
      // Remove deleted file references from all timelines and annotations
      // This is complex because files can be referenced in multiple places:
      // 1. In milestone data (voiceover files)
      // 2. In syncMedia arrays (video/audio files)
      // 3. In annotation table rows (voiceover references)

      // Filter timelines to remove deleted file references
      const tempTimeline = state.timeline
        .map((t: types.LooseObject) => {
          const tempTimeline = {
            ...t,
            // Filter milestones to remove those with deleted files
            milestones: t.milestones
              .map((m: any) => {
                return {
                  ...m,
                  // Filter milestone data to remove deleted file references
                  data: m.data.filter(
                    (md: any) =>
                      md.data !== action.payload &&
                      !(
                        // Also remove if EAF file is deleted and data is not a file path
                        (
                          t.eafFile === action.payload &&
                          !md.data.startsWith("file:///")
                        )
                      ),
                  ),
                };
              })
              // Remove milestones with no data left
              .filter((m: any) => m.data.length !== 0),
            // Filter syncMedia to remove deleted file
            syncMedia: t.syncMedia.filter((s: any) => s !== action.payload),
          };
          return tempTimeline;
        })
        // Remove timelines with no milestones left
        .filter((t: any) => t.milestones.length !== 0);

      // Update annotation table to clear deleted voiceover references
      return {
        ...state,
        annotationTable: state.annotationTable.map(
          (annot: types.LooseObject) => {
            if (annot.audCareful === action.payload) {
              return { ...annot, audCareful: "" };
            } else if (annot.audTransl === action.payload) {
              return { ...annot, audTransl: "" };
            }
            return annot;
          },
        ),
        timeline: tempTimeline,
        timelineChanged: true,
      };
    }

    // -------------------------------------------------------------------------
    // UI VISIBILITY TOGGLES
    // -------------------------------------------------------------------------

    case types.TOGGLE_AUDCAREFUL_MAIN: {
      // Toggle or force careful voiceover visibility
      return {
        ...state,
        audCarefulMain: action.payload || !state.audCarefulMain,
      };
    }

    case types.TOGGLE_AUDTRANSL_MAIN: {
      // Toggle or force translation voiceover visibility
      return {
        ...state,
        audTranslMain: action.payload || !state.audTranslMain,
      };
    }

    case types.TOGGLE_AUDTRANSC_MAIN: {
      // Toggle or force transcription text visibility
      // Note: Despite the name "AUDTRANSC", this controls txtTranscMain
      return {
        ...state,
        txtTranscMain: action.payload || !state.txtTranscMain,
      };
    }

    case types.TOGGLE_TRANSC_SUB: {
      // Toggle or force transcription subtitle
      return {
        ...state,
        txtTranscSubtitle: action.payload || !state.txtTranscSubtitle,
      };
    }

    case types.TOGGLE_TXTTRANSL_MAIN: {
      // Toggle or force translation text visibility
      return {
        ...state,
        txtTranslMain: action.payload || !state.txtTranslMain,
      };
    }

    case types.TOGGLE_AUDTRANSL_SUB: {
      // Toggle or force translation voiceover subtitle
      // Note: Despite the name "AUDTRANSL_SUB", this controls audTranslMain
      return {
        ...state,
        audTranslMain: action.payload || !state.audTranslMain,
      };
    }

    case types.TOGGLE_META_MAIN: {
      // Toggle or force SayMore metadata panel
      return {
        ...state,
        sayMoreMetaMain: action.payload || !state.sayMoreMetaMain,
      };
    }

    case types.TOGGLE_FILEINFO: {
      // Toggle or force file info panel
      return {
        ...state,
        fileInfoMain: action.payload || !state.fileInfoMain,
      };
    }

    // -------------------------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------------------------

    default: {
      return state;
    }
  }
}
