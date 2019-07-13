import * as types from "./types";

export function hardResetApp(inString: string): types.AnnotationActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}

export function loadAnnot(
  inState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.LOAD_ANNOT,
    payload: inState
  };
}

export function onNewFolder(
  inString: string,
  blobURL?: string
): types.AnnotationActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: { inString, blobURL }
  };
}

export function onReloadFolder(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ON_RELOAD_FOLDER,
    payload: { inString }
  };
}

export function addOralAnnotation(
  newMilestone: types.Milestone,
  idx: number
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ORAL_ANNOTATION,
    payload: { newMilestone, idx }
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
export function pushTimeline(
  timeline: types.LooseObject
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_TIMELINE,
    payload: timeline
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
export function updatePrevTimeline(idx: number): types.AnnotationActionTypes {
  return {
    type: types.UPDATE_PREV_TIMELINE,
    payload: idx
  };
}
export function setTimelinesInstantiated(
  bln: boolean
): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINES_INSTANTIATED,
    payload: bln
  };
}

export function setTimelineChanged(bln: boolean): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINE_CHANGED,
    payload: bln
  };
}
