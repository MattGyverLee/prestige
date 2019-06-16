// src/store/tree/reducers.ts

import {
  ActiveFolderState,
  FILE_ADDED,
  FILE_CHANGED,
  FILE_DELETED,
  MEDIA_ADDED,
  MEDIA_CHANGED,
  TreeActionTypes,
  UPDATE_ACTIVE_FOLDER,
  UPDATE_TREE
} from "./types";

const initialState: ActiveFolderState = {
  availableFiles: [],
  availableMedia: [],
  env: "",
  folderName: "",
  folderPath: "",
  loaded: false
};

export function treeReducer(
  state = initialState,
  action: TreeActionTypes
): ActiveFolderState {
  switch (action.type) {
    case UPDATE_TREE: {
      return {
        ...state,
        ...action.payload
      };
    }
    case UPDATE_ACTIVE_FOLDER: {
      return {
        ...state,
        availableFiles: [],
        availableMedia: [],
        folderName: action.payload.folderName,
        folderPath: action.payload.folderPath,
        loaded: true
      };
    }
    case FILE_ADDED: {
      return {
        ...state,
        availableFiles: [...state.availableFiles, action.payload.file]
      };
    }
    case MEDIA_ADDED: {
      return {
        ...state,
        availableMedia: [...state.availableMedia, action.payload.file]
      };
    }
    case FILE_CHANGED: {
      let tempState = state.availableFiles.filter(
        file => file.name !== action.payload.file.name
      );
      //let tempState: any[] = []
      return {
        ...state,
        availableFiles: [...tempState, action.payload.file]
      };
    }
    case MEDIA_CHANGED: {
      let tempState = state.availableMedia.filter(
        file => file.name !== action.payload.file.name
      );
      return {
        ...state,
        availableMedia: [...tempState, action.payload.file]
      };
    }
    case FILE_DELETED: {
      return {
        ...state,
        //ToDo: Minor memory waste: try to determine which category has the file instead of double filter.
        availableMedia: [
          ...state.availableMedia.filter(file => file.name !== action.payload)
        ],
        availableFiles: [
          ...state.availableFiles.filter(file => file.name !== action.payload)
        ]
      };
    }
    //TODO add Media/File Deletion
    default:
      return state;
  }
}
