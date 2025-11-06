import { DimensionsMap } from "../annot/types";

// Describing the shape of the system's slice of state

export interface SystemState {
  clicks: number;
  loggedIn: boolean;
  session: string;
  userName: string;
  dimensions: DimensionsMap;
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
export const UPDATE_DIMENSIONS = "UPDATE_DIMENSIONS";

interface SysHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
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
  | UpdateDimensions;
