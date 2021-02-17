// src/store/system/reducers.ts

import * as types from "./types";

export const systemCleanStore: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: "",
  notifications: [],
  dimensions: {
    AppDetails: { width: -1, height: -1 },
    AppPlayer: { width: -1, height: -1 },
    AppDeeJay: { width: -1, height: -1 },
    AppBody: { width: -1, height: -1 },
    AnnotDiv: { width: -1, height: -1 },
    FileList: { width: -1, height: -1 },
  },
};

export function systemReducer(
  state = systemCleanStore,
  action: types.SystemActionTypes
): types.SystemState {
  switch (action.type) {
    case types.UPDATE_SESSION: {
      return {
        ...state,
        ...action.payload,
      };
    }
    case types.ENQUEUE_SNACKBAR: {
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            key: action.key,
            ...action.notification,
          },
        ],
      };
    }
    case types.CLOSE_SNACKBAR: {
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          action.dismissAll || notification.key === action.key
            ? { ...notification, dismissed: true }
            : { ...notification }
        ),
      };
    }
    case types.REMOVE_SNACKBAR: {
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.key !== action.key
        ),
      };
    }
    case types.UPDATE_DIMENSIONS: {
      // TODO: Finish This
      switch (action.payload.target) {
        case "AppDetails":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppDetails: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        case "AppPlayer":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppPlayer: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        case "AppDeeJay":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppDeeJay: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        case "AppBody":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppBody: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        case "AnnotDiv":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AnnotDiv: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        case "FileList":
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              FileList: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        default:
          return state;
      }
    }
    case types.UPDATE_SNACKBAR: {
      // TODO: Finish This
      state.notifications.filter(
        (notification) => notification.key === action.key
      );
      return {
        ...state,
        notifications: [
          ...state.notifications.filter(
            (notification) => notification.key !== action.key
          ),
          state.notifications.filter(
            (notification) => notification.key === action.key
          ),
        ],
      };
    }
    default:
      return state;
  }
}
