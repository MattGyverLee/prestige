import * as types from "./types";

// TODO: Collapse these to *
// Object.entries(annTy).forEach(([name, exported]) => window[name] = exported);

export function hardResetApp(inString: string): types.AnnotationActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}

export function onNewFolder(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString
  };
}

export function resetAnnotationAction(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.RESET_ANNOTATION_SESSION,
    payload: annotState
  };
}

export function wipeAnnotationAction(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.WIPE_ANNOTATION_SESSION,
    payload: annotState
  };
}

export function addAnnotation(
  milestone: types.Milestone
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ANNOTATION,
    payload: milestone
  };
}
export function addOralAnnotation(
  newMilestone: any
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ORAL_ANNOTATION,
    payload: newMilestone
  };
}
export function addCategory(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ADD_CATEGORY,
    payload: inString
  };
}
export function pushAnnotation(
  milestones: types.Milestone[]
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION,
    payload: milestones
  };
}
export function pushAnnotationTable(
  inTable: types.AnnotationRow[]
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION_TABLE,
    payload: inTable
  };
}
export function pushWhichTimeline(
  whichtimeline: types.LooseObject
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_WHICH_TIMELINE,
    payload: whichtimeline
  };
}
export function pushTimeline(
  timeline: types.LooseObject
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_TIMELINE,
    payload: timeline
  };
}
export function updateAnnotation(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.UPDATE_ANNOTATION,
    payload: annotState
  };
}
export function removeAnnotation(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.REMOVE_ANNOTATION,
    payload: annotState
  };
}
export function addAnnotationset(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ANNOTATIONSET,
    payload: annotState
  };
}
export function updateAnnotationset(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.UPDATE_ANNOTATIONSET,
    payload: annotState
  };
}
export function removeAnnotationset(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.REMOVE_ANNOTATIONSET,
    payload: annotState
  };
}
export function enableAudcarefulMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_AUDCAREFUL_MAIN
  };
}
export function disableAudcarefulMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_AUDCAREFUL_MAIN
  };
}
export function enableAudtranslMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_AUDTRANSL_MAIN
  };
}
export function disableAudtranslMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_AUDTRANSL_MAIN
  };
}
export function enableAudtranscMain(): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_AUDTRANSC_MAIN
  };
}
export function disableAudtranscMain(): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_AUDTRANSC_MAIN
  };
}
export function enableTranscSub(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_TRANSC_SUB
  };
}
export function disableTranscSub(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_TRANSC_SUB
  };
}
export function enableTxttranslMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_TXTTRANSL_MAIN
  };
}
export function disableTxttranslMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_TXTTRANSL_MAIN
  };
}
export function enableAudtranslSub(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_AUDTRANSL_SUB
  };
}
export function disableAudtranslSub(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_AUDTRANSL_SUB
  };
}
export function enableMetaMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_META_MAIN
  };
}
export function disableMetaMain(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_META_MAIN
  };
}
export function enableFileinfo(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.ENABLE_FILEINFO
  };
}
export function disableFileinfo(
  annotState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.DISABLE_FILEINFO
  };
}
