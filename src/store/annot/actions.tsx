import * as types from "./types";

export function hardResetApp(inString: string): types.AnnotationActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}

export function loadAnnot(
  inState: types.AnnotationState
): types.AnnotationActionTypes {
  return {
    type: types.LOAD_ANNOT,
    payload: inState,
  };
}

export function onNewFolder(
  inString: string,
  blobURL?: string
): types.AnnotationActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: { inString, blobURL },
  };
}

export function onReloadFolder(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ON_RELOAD_FOLDER,
    payload: { inString },
  };
}

export function addOralAnnotation(
  newMilestone: types.Milestone,
  idx: number
): types.AnnotationActionTypes {
  return {
    type: types.ADD_ORAL_ANNOTATION,
    payload: { newMilestone, idx },
  };
}
export function addCategory(inString: string): types.AnnotationActionTypes {
  return {
    type: types.ADD_CATEGORY,
    payload: inString,
  };
}
export function pushAnnotation(
  milestones: types.Milestone[]
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION,
    payload: milestones,
  };
}
export function pushAnnotationTable(
  inTable: types.AnnotationRow[]
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_ANNOTATION_TABLE,
    payload: inTable,
  };
}
export function pushTimeline(
  timeline: types.LooseObject
): types.AnnotationActionTypes {
  return {
    type: types.PUSH_TIMELINE,
    payload: timeline,
  };
}
export function toggleAudcarefulMain(
  toggle?: boolean
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDCAREFUL_MAIN,
    payload: toggle,
  };
}
export function toggleAudtranslMain(
  toggle?: boolean
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSL_MAIN,
    payload: toggle,
  };
}
export function toggleAudtranscMain(
  toggle?: boolean
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSC_MAIN,
    payload: toggle,
  };
}
export function toggleTranscSub(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_TRANSC_SUB,
    payload: toggle,
  };
}
export function toggleTxttranslMain(
  toggle?: boolean
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_TXTTRANSL_MAIN,
    payload: toggle,
  };
}
export function toggleAudtranslSub(
  toggle?: boolean
): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_AUDTRANSL_SUB,
    payload: toggle,
  };
}
export function toggleMetaMain(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_META_MAIN,
    payload: toggle,
  };
}
export function toggleFileinfo(toggle?: boolean): types.AnnotationActionTypes {
  return {
    type: types.TOGGLE_FILEINFO,
    payload: toggle,
  };
}
export function updatePrevTimeline(idx: number): types.AnnotationActionTypes {
  return {
    type: types.UPDATE_PREV_TIMELINE,
    payload: idx,
  };
}
export function setTimelinesInstantiated(
  bln: boolean
): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINES_INSTANTIATED,
    payload: bln,
  };
}

export function setTimelineChanged(bln: boolean): types.AnnotationActionTypes {
  return {
    type: types.SET_TIMELINE_CHANGED,
    payload: bln,
  };
}
