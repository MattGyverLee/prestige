import * as types from "./types";

export function updateSession(newSession: types.SystemState) {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession
  };
}
