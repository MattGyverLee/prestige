// Describing the shape of the tree's slice of state
export interface ActiveFolderState {
    env: string;
    path: string;
    loaded: boolean;
    availableFiles?: [Blob]
    availableMedia?: [Blob]
  }
  
  // Describing the different ACTION NAMES available
  export const UPDATE_TREE = "UPDATE_TREE";
  
  interface UpdateActiveFolder {
    type: typeof UPDATE_TREE;
    payload: ActiveFolderState;
  }
  
  export type TreeActionTypes = UpdateActiveFolder;