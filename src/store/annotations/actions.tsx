import {
  ADD_ANNOTATION,
  ADD_ANNOTATIONSET,
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
  ENABLE_FILEINFO,
  ENABLE_META_MAIN,
  ENABLE_TRANSC_SUB,
  ENABLE_TXTTRANSL_MAIN,
  ENNABLE_AUDTRANSL_SUB,
  REMOVE_ANNOTATION,
  REMOVE_ANNOTATIONSET,
  RESET_ANNOTATION_SESSION,
  UPDATE_ANNOTATION,
  UPDATE_ANNOTATIONSET,
  WIPE_ANNOTATION_SESSION
} from "./types";

//Object.entries(annTy).forEach(([name, exported]) => window[name] = exported);

export function resetAnnotationAction(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: RESET_ANNOTATION_SESSION,
    payload: annotState
  };
}

export function wipeAnnotationAction(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: WIPE_ANNOTATION_SESSION,
    payload: annotState
  };
}

export function addAnnotation(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ADD_ANNOTATION,
    payload: annotState
  };
}
export function updateAnnotation(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: UPDATE_ANNOTATION,
    payload: annotState
  };
}
export function removeAnnotation(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: REMOVE_ANNOTATION,
    payload: annotState
  };
}
export function addAnnotationset(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ADD_ANNOTATIONSET,
    payload: annotState
  };
}
export function updateAnnotationset(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: UPDATE_ANNOTATIONSET,
    payload: annotState
  };
}
export function removeAnnotationset(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: REMOVE_ANNOTATIONSET,
    payload: annotState
  };
}
export function enableAudcarefulMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_AUDCAREFUL_MAIN
  };
}
export function disableAudcarefulMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_AUDCAREFUL_MAIN
  };
}
export function enableAudtranslMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_AUDTRANSL_MAIN
  };
}
export function disableAudtranslMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_AUDTRANSL_MAIN
  };
}
export function enableAudtranscMain(): AnnotationActionTypes {
  return {
    type: ENABLE_AUDTRANSC_MAIN
  };
}
export function disableAudtranscMain(): AnnotationActionTypes {
  return {
    type: DISABLE_AUDTRANSC_MAIN
  };
}
export function enableTranscSub(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_TRANSC_SUB
  };
}
export function disableTranscSub(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_TRANSC_SUB
  };
}
export function enableTxttranslMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_TXTTRANSL_MAIN
  };
}
export function disableTxttranslMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_TXTTRANSL_MAIN
  };
}
export function ennableAudtranslSub(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENNABLE_AUDTRANSL_SUB
  };
}
export function disableAudtranslSub(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_AUDTRANSL_SUB
  };
}
export function enableMetaMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_META_MAIN
  };
}
export function disableMetaMain(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_META_MAIN
  };
}
export function enableFileinfo(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: ENABLE_FILEINFO
  };
}
export function disableFileinfo(
  annotState: AnnotationState
): AnnotationActionTypes {
  return {
    type: DISABLE_FILEINFO
  };
}
