import { ActiveFolderState, UPDATE_TREE } from "./types";

export function updateActiveFolder(newFolder: ActiveFolderState) {
  return {
    type: UPDATE_TREE,
    payload: newFolder
  };
}
