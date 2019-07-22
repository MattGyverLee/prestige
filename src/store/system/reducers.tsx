// src/store/system/reducers.ts

import * as types from "./types";

export const systemCleanStore: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: "",
  snackbarText: [],
  snackbarIsActive: false
};

export function systemReducer(
  state = systemCleanStore,
  action: types.SystemActionTypes
): types.SystemState {
  switch (action.type) {
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
    case types.SNACKBAR_TOGGLE_ACTIVE: {
      return {
        ...state,
        snackbarIsActive: action.payload
      };
    }
    default:
      return state;
  }
}
