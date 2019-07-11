import * as types from "./types";

/* export function sysHardResetApp(inString: string): types.SystemActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}

export function sysOnNewFolder(inString: string): types.SystemActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString
  };
} */

export function completeSnackbar(inString: string): types.SystemActionTypes {
  return {
    type: types.COMPLETE_SNACKBAR,
    payload: inString
  };
}
export function dispatchSnackbar(inString: string): types.SystemActionTypes {
  return {
    type: types.DISPATCH_SNACKBAR,
    payload: inString
  };
}

export function sysHardResetApp(inString: string): types.SystemActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}
export function updateSession(
  newSession: types.SystemState
): types.SystemActionTypes {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession
  };
}
export function snackbarToggleActive(onOff: boolean): types.SystemActionTypes {
  return {
    type: types.SNACKBAR_TOGGLE_ACTIVE,
    payload: onOff
  };
}
