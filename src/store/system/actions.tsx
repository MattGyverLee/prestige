import * as types from "./types";

export function sysHardResetApp(inString: string): types.SystemActionTypes {
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
}

export function updateSession(newSession: types.SystemState) {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession
  };
}
