// src/store/tree/reducers.ts

import * as types from "./types";

const env = process.env.REACT_APP_MODE + "";

export const treeCleanStore: types.TreeState = {
  availableFiles: [],
  availableMedia: [],
  env: env,
  folderName: "",
  folderPath: "",
  loaded: false
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
    case types.UPDATE_TREE: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.FILE_ADDED: {
      return {
        ...state,
        availableFiles: [...state.availableFiles, action.payload.file]
      };
    }
    case types.MEDIA_ADDED: {
      return {
        ...state,
        availableMedia: [...state.availableMedia, action.payload.file]
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
    case types.MEDIA_CHANGED: {
      const tempState = state.availableMedia.filter(
        file => file.name !== action.payload.file.name
      );
      return {
        ...state,
        availableMedia: [...tempState, action.payload.file]
      };
    }
    case types.FILE_DELETED: {
      return {
        ...state,
        // ToDo: Minor memory waste: try to determine which category has the file instead of double filter.
        availableMedia: [
          ...state.availableMedia.filter(file => file.name !== action.payload)
        ],
        availableFiles: [
          ...state.availableFiles.filter(file => file.name !== action.payload)
        ]
      };
    }
    // TODO add Media/File Deletion
    default:
      // console.log("Failed Tree Action", action);
      return state;
  }
}
