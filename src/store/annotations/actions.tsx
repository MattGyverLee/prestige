import * as annTy from './types'

//Object.entries(annTy).forEach(([name, exported]) => window[name] = exported);

export function resetAnnotationAction(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.RESET_ANNOTATION_SESSION,
      payload: annotState
    }
}

export function wipeAnnotationAction(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.WIPE_ANNOTATION_SESSION,
      payload: annotState
    }
}

export function addAnnotation(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ADD_ANNOTATION,
      payload: annotState
    }
}
export function updateAnnotation(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.UPDATE_ANNOTATION,
      payload: annotState
    }
}
export function removeAnnotation(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.REMOVE_ANNOTATION,
      payload: annotState
    }
}
export function addAnnotationset(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ADD_ANNOTATIONSET,
      payload: annotState
    }
}
export function updateAnnotationset(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.UPDATE_ANNOTATIONSET,
      payload: annotState
    }
}
export function removeAnnotationset(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.REMOVE_ANNOTATIONSET,
      payload: annotState
    }
}
export function enableAudcarefulMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_AUDCAREFUL_MAIN
    }
}
export function disableAudcarefulMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_AUDCAREFUL_MAIN
    }
}
export function enableAudtranslMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_AUDTRANSL_MAIN
    }
}
export function disableAudtranslMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_AUDTRANSL_MAIN
    }
}
export function enableAudtranscMain(): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_AUDTRANSC_MAIN
    }
}
export function disableAudtranscMain(): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_AUDTRANSC_MAIN
    }
}
export function enableTranscSub(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_TRANSC_SUB
    }
}
export function disableTranscSub(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_TRANSC_SUB
    }
}
export function enableTxttranslMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_TXTTRANSL_MAIN
    }
}
export function disableTxttranslMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_TXTTRANSL_MAIN
    }
}
export function ennableAudtranslSub(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENNABLE_AUDTRANSL_SUB
    }
}
export function disableAudtranslSub(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_AUDTRANSL_SUB
    }
}
export function enableMetaMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_META_MAIN
    }
}
export function disableMetaMain(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_META_MAIN
    }
}
export function enableFileinfo(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.ENABLE_FILEINFO
    }
}
export function disableFileinfo(annotState: annTy.AnnotationState): annTy.AnnotationActionTypes {
  return {
      type: annTy.DISABLE_FILEINFO
    }
}
