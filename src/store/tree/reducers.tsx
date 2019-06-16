// src/store/tree/reducers.ts
import { UPDATE_TREE, UPDATE_ACTIVE_FOLDER, FILE_ADDED, MEDIA_ADDED, FILE_CHANGED, MEDIA_CHANGED, FILE_DELETED, ActiveFolderState, TreeActionTypes } from "./types";

const initialState: ActiveFolderState = {
  env: "",
  folderName: "",
  folderPath: "",
  loaded: false,
  availableFiles: [],
  availableMedia: [],
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
        folderName: action.payload.folderName,
        folderPath: action.payload.folderPath,
        loaded: true,
        availableFiles: [],
        availableMedia: [] 
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
      let tempState = state.availableFiles.filter(file => file.name !== action.payload.file.name);
      //let tempState: any[] = []
      return {
        ...state,
        availableFiles: [...tempState, action.payload.file]
      };
    }
    case MEDIA_CHANGED: {
      let tempState = state.availableMedia.filter(file => file.name !== action.payload.file.name);
      return {
        ...state,
        availableMedia: [...tempState, action.payload.file]
      };
    }
    case FILE_DELETED: {
      //let tempMedia = state.availableMedia.filter(file => file.name !== action.payload);
      //let tempFiles = state.availableMedia.filter(file => file.name !== action.payload);
      return {
        ...state,
        availableMedia: [...state.availableMedia.filter(file => file.name !== action.payload)],
        availableFiles: [...state.availableFiles.filter(file => file.name !== action.payload)]
      };
    }
    //TODO add Media/File Deletion
    default:
      return state;
  }
}