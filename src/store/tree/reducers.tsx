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
  prevPath: ""
};

export function treeReducer(
  state = treeCleanStore,
  action: types.TreeActionTypes
): types.TreeState {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = treeCleanStore;
      return state;
    }
    case types.ON_NEW_FOLDER: {
      state = treeCleanStore;
      return { ...state, folderPath: action.payload };
    }
    case types.ON_RELOAD_FOLDER: {
      state = treeCleanStore;
      return { ...state, folderPath: action.payload };
    }
    case types.CHANGE_PREV_PATH: {
      state = treeCleanStore;
      return { ...state, prevPath: action.payload };
    }
    case types.UPDATE_TREE: {
      return {
        ...action.payload
      };
    }
    case types.LOAD_TREE: {
      state = action.payload;
      return state;
    }
    case types.FILE_ADDED: {
      return {
        ...state,
        availableFiles: [...state.availableFiles, action.payload.file]
      };
    }
    case types.SOURCE_MEDIA_ADDED: {
      return {
        ...state,
        sourceMedia: [...state.sourceMedia, action.payload.file]
      };
    }
    case types.ANNOT_MEDIA_ADDED: {
      return {
        ...state,
        annotMedia: [...state.annotMedia, action.payload.file]
      };
    }
    case types.FILE_CHANGED: {
      const tempState = state.availableFiles.filter(
        file => file.name !== action.payload.file.name
      );
      // let tempState: any[] = []
      return {
        ...state,
        availableFiles: [...tempState, action.payload.file]
      };
    }
    case types.SOURCE_MEDIA_CHANGED: {
      const tempState = state.sourceMedia.filter(file => {
        if (file.name === action.payload.file.name) {
          action.payload.file.wsAllowed = file.wsAllowed;
          return false;
        }
        return true;
      });
      return {
        ...state,
        sourceMedia: [...tempState, action.payload.file]
      };
    }
    case types.ANNOT_MEDIA_CHANGED: {
      const tempState = state.annotMedia.filter(file => {
        if (file.name === action.payload.file.name) {
          action.payload.file.wsAllowed = file.wsAllowed;
          return false;
        }
        return true;
      });
      return {
        ...state,
        annotMedia: [...tempState, action.payload.file]
      };
    }
    case types.FILE_DELETED: {
      return {
        ...state,
        sourceMedia: [
          ...state.sourceMedia.filter(file => file.blobURL !== action.payload)
        ],
        annotMedia: [
          ...state.annotMedia.filter(file => file.blobURL !== action.payload)
        ],
        availableFiles: [
          ...state.availableFiles.filter(
            file => file.blobURL !== action.payload
          )
        ]
      };
    }
    case types.WAVEFORM_ADDED: {
      if (action.payload.sourceAnnot) {
        const tempState = state.sourceMedia.filter(sfile => {
          if (sfile.name === action.payload.ref) {
            return false;
          }
          return true;
        });
        const waveFile = state.sourceMedia.filter(sfile => {
          if (sfile.name === action.payload.ref) {
            return true;
          }
          return false;
        });
        return {
          ...state,
          sourceMedia: [
            ...tempState,
            { waveFile, waveform: action.payload.wavedata }
          ]
        };
      } else {
        const tempState = state.annotMedia.filter(afile => {
          if (afile.name === action.payload.ref) {
            return false;
          }
          return true;
        });
        const waveFile = state.annotMedia.filter(afile => {
          if (afile.name === action.payload.ref) {
            return true;
          }
          return false;
        });
        return {
          ...state,
          annotMedia: [
            ...tempState,
            { waveFile, waveform: action.payload.wavedata }
          ]
        };
      }
    }
    case types.SET_ANNOT_MEDIA_IN_MILESTONES: {
      const tempAnnot = state.annotMedia.map(m => {
        return m.blobURL === action.payload ? { ...m, inMilestones: true } : m;
      });
      return {
        ...state,
        annotMedia: tempAnnot
      };
    }
    case types.SET_ANNOT_MEDIA_WS_ALLOWED: {
      return {
        ...state,
        annotMedia: state.annotMedia.map(m => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        })
      };
    }
    case types.SET_SOURCE_MEDIA_WS_ALLOWED: {
      return {
        ...state,
        sourceMedia: state.sourceMedia.map(m => {
          return m.blobURL === action.payload ? { ...m, wsAllowed: true } : m;
        })
      };
    }
    default:
      return state;
  }
}
