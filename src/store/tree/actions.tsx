import * as types from "./types";

export function updateTree(newTree: types.TreeState) {
  return {
    type: types.UPDATE_TREE,
    payload: newTree
  };
}
/* export function updateActiveFolder(newFolder: types.Folders) {
  //might deprecate this
  return {
    type: types.UPDATE_ACTIVE_FOLDER,
    payload: newFolder
  };
} */
export function treeHardResetApp(inString: string): types.TreeActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}

export function treeOnNewFolder(inString: string): types.TreeActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString
  };
}

export function fileAdded(inFile: types.FileDesc) {
  return {
    type: types.FILE_ADDED,
    payload: inFile
  };
}
export function mediaAdded(inFile: types.FileDesc) {
  return {
    type: types.MEDIA_ADDED,
    payload: inFile
  };
}
export function fileChanged(inFile: types.FileDesc) {
  return {
    type: types.FILE_CHANGED,
    payload: inFile
  };
}
export function mediaChanged(inFile: types.FileDesc) {
  return {
    type: types.MEDIA_CHANGED,
    payload: inFile
  };
}
export function fileDeleted(inPath: string) {
  return {
    type: types.FILE_DELETED,
    payload: inPath
  };
}
