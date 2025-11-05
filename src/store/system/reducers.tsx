// src/store/system/reducers.ts

import * as types from "./types";

export const systemCleanStore: types.SystemState = {
  clicks: 0,
  loggedIn: false,
  session: "",
  userName: "",
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
    default:
      return state;
  }
}
