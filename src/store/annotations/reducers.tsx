// src/store/tree/reducers.ts
import * as annTy from "./types";
import {map, boolean } from "redux-data-structures"

export function audCareful_Main() {
 return map({
  trueActionTypes: ['ENABLE_AUDCAREFUL_MAIN'],
  falseActionTypes: ['DISABLE_AUDCAREFUL_MAIN']
})
}

export function annotationReducer(
  state = initialState,
  action: annTy.AnnotationActionTypes
): annTy.AnnotationState {
  let annotations = initialState.annotations
  switch (action.type) {
    case annTy.RESET_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.WIPE_ANNOTATION_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.ADD_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.UPDATE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.REMOVE_ANNOTATION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.ADD_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.UPDATE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.REMOVE_ANNOTATIONSET: {
      return {
        ...state,
        ...action.payload
      };
    }
    case annTy.ENABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.ENABLE_AUDTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_AUDTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.ENABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTransc_Main: true
      };
    }
    case annTy.DISABLE_AUDTRANSC_MAIN: {

      return {
        ...state,
        txtTransc_Main: false
      };
    }
    case annTy.ENABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case annTy.ENABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case annTy.ENNABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case annTy.ENABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case annTy.ENABLE_FILEINFO: {
      return {
        ...state
      };
    }
    case annTy.DISABLE_FILEINFO: {
      return {
        ...state
      };
    }

    default:
      return state;
  }
}

