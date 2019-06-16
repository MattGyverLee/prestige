import {
  ActiveFolderState,
  FILE_ADDED,
  FILE_CHANGED,
  FILE_DELETED,
  FileDesc,
  Folders,
  MEDIA_ADDED,
  MEDIA_CHANGED,
  UPDATE_ACTIVE_FOLDER,
  UPDATE_TREE
} from "./types";

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
export function fileAdded(inFile: FileDesc) {
  return {
    type: FILE_ADDED,
    payload: inFile
  };
}
export function mediaAdded(inFile: FileDesc) {
  return {
    type: MEDIA_ADDED,
    payload: inFile
  };
}
export function fileChanged(inFile: FileDesc) {
  return {
    type: FILE_CHANGED,
    payload: inFile
  };
}
export function mediaChanged(inFile: FileDesc) {
  return {
    type: MEDIA_CHANGED,
    payload: inFile
  };
}
export function fileDeleted(inPath: string) {
  return {
    type: FILE_DELETED,
    payload: inPath
  };
}
