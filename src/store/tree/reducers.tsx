// src/store/tree/reducers.ts
import { UPDATE_TREE, ActiveFolderState, TreeActionTypes } from "./types";

const initialState: ActiveFolderState = {
  env: "",
  path: "",
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
    default:
      return state;
  }
}