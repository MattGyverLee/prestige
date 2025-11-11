import * as types from "./types";

export const updateDimensions = (payload: types.DimensionObject) => ({
  type: types.UPDATE_DIMENSIONS,
  payload,
});

export function sysHardResetApp(inString: string): types.SystemActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}
export function updateSession(
  newSession: types.SystemState,
): types.SystemActionTypes {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession,
  };
}
