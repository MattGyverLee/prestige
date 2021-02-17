import * as types from "./types";

export const enqueueSnackbar = (notification: types.SnackbarObject) => {
  const key = notification.options && notification.options.key;
  return {
    type: types.ENQUEUE_SNACKBAR,
    notification: {
      ...notification,
      key: key || new Date().getTime() + Math.random(),
    },
  };
};

export const closeSnackbar = (key: any) => ({
  type: types.CLOSE_SNACKBAR,
  dismissAll: !key, // dismiss all if no key has been defined
  key,
});

export const removeSnackbar = (key: any) => ({
  type: types.REMOVE_SNACKBAR,
  key,
});

export const updateDimensions = (payload: types.DimensionObject) => ({
  type: types.UPDATE_DIMENSIONS,
  payload,
});

export const updateSnackbar = (key: any, message: string) => ({
  type: types.UPDATE_SNACKBAR,
  key,
  message,
});

export function sysHardResetApp(inString: string): types.SystemActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}
export function updateSession(
  newSession: types.SystemState
): types.SystemActionTypes {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession,
  };
}
