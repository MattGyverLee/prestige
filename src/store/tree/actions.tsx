import * as types from "./types";

/* export function treeOnNewFolder(newPath: string): types.TreeActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: newPath
  };
}
export function treeHardResetApp(inString: string): types.TreeActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
} */
export function updateTree(newTree: types.TreeState): types.TreeActionTypes {
  return {
    type: types.UPDATE_TREE,
    payload: newTree,
  };
}
export function loadTree(inState: types.TreeState): types.TreeActionTypes {
  return {
    type: types.LOAD_TREE,
    payload: inState,
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
    payload: inString,
  };
}

export function treeOnNewFolder(inString: string): types.TreeActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString,
  };
}

export function fileAdded(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.FILE_ADDED,
    payload: inFile,
  };
}
export function sourceMediaAdded(
  inFile: types.FileDesc
): types.TreeActionTypes {
  return {
    type: types.SOURCE_MEDIA_ADDED,
    payload: inFile,
  };
}
export function annotMediaAdded(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.ANNOT_MEDIA_ADDED,
    payload: inFile,
  };
}
export function fileChanged(inFile: types.FileDesc): types.TreeActionTypes {
  return {
    type: types.FILE_CHANGED,
    payload: inFile,
  };
}
export function sourceMediaChanged(
  inFile: types.FileDesc
): types.TreeActionTypes {
  return {
    type: types.SOURCE_MEDIA_CHANGED,
    payload: inFile,
  };
}
export function waveformAdded(waveIn: types.Wavein): types.TreeActionTypes {
  return {
    type: types.WAVEFORM_ADDED,
    payload: waveIn,
  };
}
export function annotMediaChanged(
  inFile: types.FileDesc
): types.TreeActionTypes {
  return {
    type: types.ANNOT_MEDIA_CHANGED,
    payload: inFile,
  };
}
export function fileDeleted(blobURL: string): types.TreeActionTypes {
  return {
    type: types.FILE_DELETED,
    payload: blobURL,
  };
}
export function changePrevPath(inPath: string): types.TreeActionTypes {
  return {
    type: types.CHANGE_PREV_PATH,
    payload: inPath,
  };
}
export function setAnnotMediaInMilestones(
  blobURL: string
): types.TreeActionTypes {
  return {
    type: types.SET_ANNOT_MEDIA_IN_MILESTONES,
    payload: blobURL,
  };
}
export function setAnnotMediaWSAllowed(blobURL: string): types.TreeActionTypes {
  return {
    type: types.SET_ANNOT_MEDIA_WS_ALLOWED,
    payload: blobURL,
  };
}
export function setSourceMediaWSAllowed(
  blobURL: string
): types.TreeActionTypes {
  return {
    type: types.SET_SOURCE_MEDIA_WS_ALLOWED,
    payload: blobURL,
  };
}
