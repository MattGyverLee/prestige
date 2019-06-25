import * as types from "./types";

export const annCleanStore: types.AnnotationState = {
  annotations: [],
  annotationSet: [],
  annotationTable: [
    {
      id: "0",
      startTime: 0,
      txtTransc: "Not Loaded"
    }
  ],
  audCarefulMain: false,
  audTranslMain: false,
  categories: [],
  fileInfoMain: false,
  sayMoreMetaMain: false,
  timeline: [],
  txtTranscMain: false,
  txtTranscSubtitle: false,
  txtTranslMain: false,
  txtTranslSubtitle: false
};

export function annotationReducer(
  state = annCleanStore,
  action: types.AnnotationActionTypes
): types.AnnotationState {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = annCleanStore;
      return state;
    }
    case types.ON_NEW_FOLDER: {
      state = annCleanStore;
      return state;
    }
    case types.RESET_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.WIPE_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.ADD_ANNOTATION: {
      return {
        ...state,
        annotations: [...state.annotations, action.payload]
      };
    }
    case types.ADD_ORAL_ANNOTATION: {
      // todo: pass BLOBURL inside
      const milestones = state.timeline[0].milestones.map(
        (m: types.LooseObject) =>
          m.startTime === action.payload.startTime &&
          m.stopTime === action.payload.stopTime
            ? { ...m, data: m.data.concat(action.payload.data) }
            : m
      );
      return {
        ...state,
        timeline: state.timeline.map((t: types.LooseObject, i: number) =>
          i === 0 ? { ...t, milestones } : t
        )
      };
    }
    case types.ADD_CATEGORY: {
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    }
    case types.PUSH_ANNOTATION: {
      return {
        ...state,
        annotations: [action.payload]
      };
    }
    case types.PUSH_ANNOTATION_TABLE: {
      return {
        ...state,
        annotationTable: action.payload
      };
    }
    case types.PUSH_TIMELINE: {
      return {
        ...state,
        timeline: state.timeline.concat(action.payload.timeline)
      };
    }
    case types.PUSH_WHICH_TIMELINE: {
      return {
        ...state,
        timeline: [action.payload]
      };
    }
    case types.UPDATE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.REMOVE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.ADD_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.UPDATE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.REMOVE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.ENABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTranslMain: true
      };
    }
    case types.DISABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTranslMain: false
      };
    }
    case types.ENABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTranscMain: true
      };
    }
    case types.DISABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTranscMain: false
      };
    }
    case types.ENABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case types.DISABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case types.ENABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case types.DISABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case types.ENABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_FILEINFO: {
      return {
        ...state
      };
    }
    case types.DISABLE_FILEINFO: {
      return {
        ...state
      };
    }

    default:
      // console.log("Failed Tree Action", action);
      return state;
  }
}
