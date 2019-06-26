// Describing the shape of the tree's slice of state
export interface TreeState {
  env: string;
  folderPath: string;
  folderName: string;
  loaded: boolean;
  availableFiles: any[];
  sourceMedia: any[];
  annotMedia: any[];
  prevPath: string;
}

export interface Folders {
  folderName: string;
  folderPath: string;
}

export interface FileDesc {
  file: any;
}

// Describing the different ACTION NAMES available
export const UPDATE_TREE = "UPDATE_TREE";
export const UPDATE_ACTIVE_FOLDER = "UPDATE_ACTIVE_FOLDER";
export const FILE_ADDED = "FILE_ADDED";
export const SOURCE_MEDIA_ADDED = "SOURCE_MEDIA_ADDED";
export const ANNOT_MEDIA_ADDED = "ANNOT_MEDIA_ADDED";
export const FILE_CHANGED = "FILE_CHANGED";
export const SOURCE_MEDIA_CHANGED = "SOURCE_MEDIA_CHANGED";
export const ANNOT_MEDIA_CHANGED = "ANNOT_MEDIA_CHANGED";
export const FILE_DELETED = "FILE_DELETED";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const CHANGE_PREV_PATH = "CHANGE_PREV_PATH";

interface TreeHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface TreeOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}
interface UpdateTree {
  type: typeof UPDATE_TREE;
  payload: TreeState;
}
interface UpdateActiveFolder {
  // deprecate
  type: typeof UPDATE_ACTIVE_FOLDER;
  payload: Folders;
}
interface FileAdded {
  type: typeof FILE_ADDED;
  payload: FileDesc;
}
interface SourceMediaAdded {
  type: typeof SOURCE_MEDIA_ADDED;
  payload: FileDesc;
}
interface AnnotMediaAdded {
  type: typeof ANNOT_MEDIA_ADDED;
  payload: FileDesc;
}
interface FileChanged {
  type: typeof FILE_CHANGED;
  payload: FileDesc;
}
interface SourceMediaChanged {
  type: typeof SOURCE_MEDIA_CHANGED;
  payload: FileDesc;
}
interface AnnotMediaChanged {
  type: typeof ANNOT_MEDIA_CHANGED;
  payload: FileDesc;
}
interface FileDeleted {
  type: typeof FILE_DELETED;
  payload: string;
}
interface ChangePrevPath {
  type: typeof CHANGE_PREV_PATH;
  payload: string;
}

export type TreeActionTypes =
  | FileAdded
  | FileChanged
  | FileDeleted
  | SourceMediaAdded
  | AnnotMediaAdded
  | SourceMediaChanged
  | AnnotMediaChanged
  | UpdateActiveFolder
  | TreeHardResetApp
  | TreeOnNewFolder
  | UpdateTree
  | ChangePrevPath;
