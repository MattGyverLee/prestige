// Describing the shape of the tree's slice of state
export interface ActiveFolderState {
    env: string;
    folderPath: string;
    folderName: string;
    loaded: boolean;
    availableFiles?: [Blob]
    availableMedia?: [Blob]
  }

export interface Folders {
  folderName: string;
  folderPath: string
}

  
  // Describing the different ACTION NAMES available
  export const UPDATE_TREE = "UPDATE_TREE";
  export const UPDATE_ACTIVE_FOLDER = "UPDATE_ACTIVE_FOLDER";
  
  interface UpdateTree {
    type: typeof UPDATE_TREE;
    payload: ActiveFolderState;
  }
  interface UpdateActiveFolder {
    type: typeof UPDATE_ACTIVE_FOLDER;
    payload: Folders;
  }
  
  export type TreeActionTypes = UpdateTree | UpdateActiveFolder;