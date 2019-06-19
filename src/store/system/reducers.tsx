// src/store/system/reducers.ts

import * as types from "./types";

const initialState: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: ""
};

export function systemReducer(
  state = initialState,
  action: types.SystemActionTypes
): types.SystemState {
  switch (action.type) {
    case types.UPDATE_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    default:
      return state;
  }
}
