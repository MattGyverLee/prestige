// src/store/tree/reducers.ts

import {
  ADD_ANNOTATION,
  ADD_ANNOTATIONSET,
  ADD_CATEGORY,
  ADD_ORAL_ANNOTATION,
  AnnotationActionTypes,
  AnnotationState,
  DISABLE_AUDCAREFUL_MAIN,
  DISABLE_AUDTRANSC_MAIN,
  DISABLE_AUDTRANSL_MAIN,
  DISABLE_AUDTRANSL_SUB,
  DISABLE_FILEINFO,
  DISABLE_META_MAIN,
  DISABLE_TRANSC_SUB,
  DISABLE_TXTTRANSL_MAIN,
  ENABLE_AUDCAREFUL_MAIN,
  ENABLE_AUDTRANSC_MAIN,
  ENABLE_AUDTRANSL_MAIN,
  ENABLE_AUDTRANSL_SUB,
  ENABLE_FILEINFO,
  ENABLE_META_MAIN,
  ENABLE_TRANSC_SUB,
  ENABLE_TXTTRANSL_MAIN,
  LooseObject,
  PUSH_ANNOTATION,
  PUSH_TIMELINE,
  PUSH_WHICH_TIMELINE,
  REMOVE_ANNOTATION,
  REMOVE_ANNOTATIONSET,
  RESET_ANNOTATION_SESSION,
  UPDATE_ANNOTATION,
  UPDATE_ANNOTATIONSET,
  WIPE_ANNOTATION_SESSION
} from "./types";

//import {map} from "redux-data-structures"

/* export function audCareful_Main() {
 return map({
  trueActionTypes: ['ENABLE_AUDCAREFUL_MAIN'],
  falseActionTypes: ['DISABLE_AUDCAREFUL_MAIN']
})
} */

const initialState: AnnotationState = {
  annotations: [],
  annotationSet: [],
  audCareful_Main: false,
  audTransl_Main: false,
  categories: [],
  fileInfo_Main: false,
  sayMoreMeta_Main: false,
  timeline: {},
  txtTransc_Main: false,
  txtTransc_Subtitle: false,
  txtTransl_Main: false,
  txtTransl_Subtitle: false
};

export function annotationReducer(
  state = initialState,
  action: AnnotationActionTypes
): AnnotationState {
  switch (action.type) {
    case RESET_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case WIPE_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case ADD_ANNOTATION: {
      return {
        ...state,
        annotations: [...state.annotations, action.payload]
      };
    }
    case ADD_ORAL_ANNOTATION: {
      //TODO: Need to clean this up, it's awfully messy!
      //todo: pass BLOBURL inside
      var tempState = { ...state.timeline };

      const targetMilestone = state.timeline[0].milestones.filter(
        (milestone: any) =>
          milestone.startTime == action.payload.startTime &&
          milestone.stopTime == action.payload.stopTime
      )[0];
      const targetData = targetMilestone.data.concat(action.payload.data);
      const targetMilestoneEd = { ...targetMilestone, data: targetData };
      //action.payload.annotationID = targetMilestone.annotationID;
      var otherMilestones = state.timeline[0].milestones.filter(
        (milestone: any) =>
          milestone.startTime !== action.payload.startTime &&
          milestone.stopTime !== action.payload.stopTime
      );
      const editedMilestones = otherMilestones.concat(targetMilestoneEd);
      tempState[0].milestones = editedMilestones.sort(function(
        a: LooseObject,
        b: LooseObject
      ) {
        return a.id - b.id || a.name.localeCompare(b.name);
      });
      const tempStateFinal = { ...state, timeline: { ...tempState } };
      return tempStateFinal;
    }
    case ADD_CATEGORY: {
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    }
    case PUSH_ANNOTATION: {
      return {
        ...state,
        annotations: [action.payload]
      };
    }
    case PUSH_TIMELINE: {
      return {
        ...state,
        timeline: state.timeline.concat(action.payload.timeline)
      };
    }
    case PUSH_WHICH_TIMELINE: {
      return {
        ...state,
        timeline: [action.payload]
      };
    }
    case UPDATE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case REMOVE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case ADD_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case UPDATE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case REMOVE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case ENABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case DISABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case ENABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTransl_Main: true
      };
    }
    case DISABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTransl_Main: false
      };
    }
    case ENABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTransc_Main: true
      };
    }
    case DISABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTransc_Main: false
      };
    }
    case ENABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case DISABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case ENABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case DISABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case ENABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case DISABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case ENABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case DISABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case ENABLE_FILEINFO: {
      return {
        ...state
      };
    }
    case DISABLE_FILEINFO: {
      return {
        ...state
      };
    }

    default:
      return state;
  }
}
