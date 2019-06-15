import { ActiveFolderState, Folders, UPDATE_TREE, UPDATE_ACTIVE_FOLDER } from "./types";

export function updateTree(newTree: ActiveFolderState) {
  return {
    type: UPDATE_TREE,
    payload: newTree
  };
}
export function updateActiveFolder(newFolder: Folders) {
  return {
    type: UPDATE_ACTIVE_FOLDER,
    payload: newFolder
  };
}
