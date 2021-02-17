// src/store/tree/reducers.ts

import * as types from "./types";

const env = process.env.REACT_APP_MODE + "";

export const treeCleanStore: types.TreeState = {
  availableFiles: [],
  sourceMedia: [],
  annotMedia: [],
  env: env,
  folderName: "",
  folderPath: "",
  loaded: false,
  prevPath: "",
};

export function treeReducer(
  state = treeCleanStore,
  action: types.TreeActionTypes
): types.TreeState {
  switch (action.type) {
    case types.ON_NEW_FOLDER: {
      return { ...state, folderPath: action.payload };
    }
    case types.ON_RELOAD_FOLDER: {
      return { ...state, folderPath: action.payload };
    }
    case types.CHANGE_PREV_PATH: {
      return { ...state, prevPath: action.payload };
    }
    case types.UPDATE_TREE: {
      return {
        ...action.payload,
      };
    }
    case types.LOAD_TREE: {
      state = action.payload;
      return state;
    }
    case types.FILE_ADDED: {
      return {
        ...state,
        availableFiles: [...state.availableFiles, action.payload.file],
      };
    }
    case types.SOURCE_MEDIA_ADDED: {
      return {
        ...state,
        sourceMedia: [...state.sourceMedia, action.payload.file],
      };
    }
    case types.ANNOT_MEDIA_ADDED: {
      return {
        ...state,
        annotMedia: [...state.annotMedia, action.payload.file],
      };
    }
    case types.FILE_CHANGED: {
      const tempState = state.availableFiles.filter(
        (file) => file.name !== action.payload.file.name
      );
      // let tempState: any[] = []
      return {
        ...state,
        availableFiles: [...tempState, action.payload.file],
      };
    }
    case types.SOURCE_MEDIA_CHANGED: {
      const tempState = state.sourceMedia.filter(
        (file) => file.name !== action.payload.file.name
      );
      return {
        ...state,
        sourceMedia: [...tempState, action.payload.file],
      };
    }
    case types.ANNOT_MEDIA_CHANGED: {
      const tempState = state.annotMedia.filter(
        (file) => file.name !== action.payload.file.name
      );
      return {
        ...state,
        annotMedia: [...tempState, action.payload.file],
      };
    }
    case types.FILE_DELETED: {
      return {
        ...state,
        sourceMedia: [
          ...state.sourceMedia.filter(
            (file) => file.blobURL !== action.payload
          ),
        ],
        annotMedia: [
          ...state.annotMedia.filter((file) => file.blobURL !== action.payload),
        ],
        availableFiles: [
          ...state.availableFiles.filter(
            (file) => file.blobURL !== action.payload
          ),
        ],
      };
    }
    case types.WAVEFORM_ADDED: {
      const tempFiltered = (action.payload.sourceAnnot
        ? state.sourceMedia
        : state.annotMedia
      ).map((file) =>
        file.blobURL === action.payload.ref
          ? { ...file, waveform: action.payload.wavedata }
          : file
      );
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
    case types.SET_ANNOT_MEDIA_IN_MILESTONES: {
      const tempAnnot = state.annotMedia.map((m) => {
        return m.blobURL === action.payload ? { ...m, inMilestones: true } : m;
      });
      return {
        ...state,
        annotMedia: tempAnnot,
      };
    }
    case types.SET_ANNOT_MEDIA_WS_ALLOWED: {
      return {
        ...state,
        annotMedia: state.annotMedia.map((m) => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        }),
      };
    }
    case types.SET_SOURCE_MEDIA_WS_ALLOWED: {
      return {
        ...state,
        sourceMedia: state.sourceMedia.map((m) => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        }),
      };
    }
    default:
      return state;
  }
}
