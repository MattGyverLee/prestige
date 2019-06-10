// src/store/tree/reducers.ts
import { UPDATE_TREE, ActiveFolderState, TreeActionTypes } from "./types";

const initialState: ActiveFolderState = {
  path: "",
  URI: ""
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