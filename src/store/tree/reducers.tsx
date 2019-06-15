// src/store/tree/reducers.ts
import { UPDATE_TREE, UPDATE_ACTIVE_FOLDER, ActiveFolderState, TreeActionTypes } from "./types";

const initialState: ActiveFolderState = {
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
        folderName: action.payload.folderName,
        folderPath: action.payload.folderPath,
        loaded: true
      };
    }
    default:
      return state;
  }
}