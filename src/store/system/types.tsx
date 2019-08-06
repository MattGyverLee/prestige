import { LooseObject } from "../annot/types";

// Describing the shape of the system's slice of state

export interface SystemState {
  clicks: number;
  loggedIn: boolean;
  session: string;
  userName: string;
  notifications: LooseObject[];
  dimensions: LooseObject;
}

export interface SnackbarObject {
  key?: string;
  message: string;
  options?: LooseObject;
}

export interface DimensionObject {
  width: number;
  height: number;
  target: string;
}

// Describing the different ACTION NAMES available
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const UPDATE_SESSION = "UPDATE_SESSION";
export const ENQUEUE_SNACKBAR = "ENQUEUE_SNACKBAR";
export const CLOSE_SNACKBAR = "CLOSE_SNACKBAR";
export const REMOVE_SNACKBAR = "REMOVE_SNACKBAR";
export const UPDATE_DIMENSIONS = "UPDATE_DIMENSIONS";
export const UPDATE_SNACKBAR = "UPDATE_SNACKBAR";

interface SysHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface EnqueueSnackbar {
  type: typeof ENQUEUE_SNACKBAR;
  key: any;
  notification: LooseObject;
}

interface CloseSnackbar {
  type: typeof CLOSE_SNACKBAR;
  key: LooseObject;
  dismissAll: boolean;
}

interface RemoveSnackbar {
  type: typeof REMOVE_SNACKBAR;
  key: LooseObject;
}

interface UpdateSnackbar {
  type: typeof UPDATE_SNACKBAR;
  key: LooseObject;
  message: string;
}

interface UpdateDimensions {
  type: typeof UPDATE_DIMENSIONS;
  payload: DimensionObject;
}

interface SysOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}
interface UpdateSessionAction {
  type: typeof UPDATE_SESSION;
  payload: SystemState;
}

export type SystemActionTypes =
  | UpdateSessionAction
  | SysHardResetApp
  | SysOnNewFolder
  | EnqueueSnackbar
  | CloseSnackbar
  | UpdateDimensions
  | UpdateSnackbar
  | RemoveSnackbar;
