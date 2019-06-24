import * as types from "./types";

export function onNewFolder(newPath: string): types.OverActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: newPath
  };
}
export function tempInit(newURL: string) {
  if (newURL !== undefined) {
    newURL = "http://www.youtube.com/watch?v=Fc1P-AEaEp8";
  }
  return {
    type: types.TEMP_INIT,
    payload: newURL
  };
}
export function hardResetApp() {
  return {
    type: types.HARD_RESET_APP
  };
}
