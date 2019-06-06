// src/store/system/reducers.ts
import { UPDATE_SESSION, SystemState, SystemActionTypes } from "./types";

const initialState: SystemState = {
  loggedIn: false,
  session: "",
  userName: "",
  clicks: 0
};

export function systemReducer(
  state = initialState,
  action: SystemActionTypes
): SystemState {
  switch (action.type) {
    case UPDATE_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    default:
      return state;
  }
}