// src/store/system/reducers.ts

import * as types from "./types";

export const systemCleanStore: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: "",
  snackbarText: []
};

export function systemReducer(
  state = systemCleanStore,
  action: types.SystemActionTypes
): types.SystemState {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = systemCleanStore;
      return state;
    }
    case types.ON_NEW_FOLDER: {
      return state;
    }
    case types.UPDATE_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case types.DISPATCH_SNACKBAR: {
      return {
        ...state,
        snackbarText: [...state.snackbarText, action.payload]
      };
    }
    case types.COMPLETE_SNACKBAR: {
      return {
        ...state,
        snackbarText: state.snackbarText.filter(t => t !== action.payload)
      };
    }
    default:
      return state;
  }
}
