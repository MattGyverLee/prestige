// Describing the shape of the system's slice of state

export interface SystemState {
  clicks: number;
  snackbarText: string[];
  loggedIn: boolean;
  session: string;
  userName: string;
}

// Describing the different ACTION NAMES available
export const COMPLETE_SNACKBAR = "COMPLETE_SNACKBAR";
export const DISPATCH_SNACKBAR = "DISPATCH_SNACKBAR";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const UPDATE_SESSION = "UPDATE_SESSION";

interface CompleteSnackbar {
  type: typeof COMPLETE_SNACKBAR;
  payload: string;
}
interface DispatchSnackbar {
  type: typeof DISPATCH_SNACKBAR;
  payload: string;
}

interface SysHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
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
  | CompleteSnackbar
  | DispatchSnackbar
  | UpdateSessionAction
  | SysHardResetApp
  | SysOnNewFolder;
