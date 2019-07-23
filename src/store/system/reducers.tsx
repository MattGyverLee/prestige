// src/store/system/reducers.ts

import * as types from "./types";

export const systemCleanStore: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: "",
  notifications: []
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
    case types.ENQUEUE_SNACKBAR: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            key: action.key,
            ...action.notification
          }
        ]
      };
    }
    case types.CLOSE_SNACKBAR: {
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          action.dismissAll || notification.key === action.key
            ? { ...notification, dismissed: true }
            : { ...notification }
        )
      };
    }
    case types.REMOVE_SNACKBAR: {
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.key !== action.key
        )
      };
    }
    case types.UPDATE_SNACKBAR: {
      // TODO: Finish This
      state.notifications.filter(
        notification => notification.key === action.key
      );
      return {
        ...state,
        notifications: [
          ...state.notifications.filter(
            notification => notification.key !== action.key
          ),
          state.notifications.filter(
            notification => notification.key === action.key
          )
        ]
      };
    }
    default:
      return state;
  }
}
