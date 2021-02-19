import * as types from "./types";

export const deeJayCleanStore: types.DeeJayState = {
  volumes: [1, 0, 0],
  dispatch: { dispatchType: "" },
  subtitle: "",
};

export function deeJayReducer(
  state = deeJayCleanStore,
  action: types.DeeJayActionTypes
): types.DeeJayState {
  switch (action.type) {
    case types.RESET_DEE_JAY: {
      state = deeJayCleanStore;
      return {
        ...state,
      };
    }
    case types.SET_WS_VOLUME: {
      return {
        ...state,
        volumes: state.volumes.map((v: number, idx: number) =>
          idx === action.payload.idx ? action.payload.volume : v
        ),
      };
    }
    case types.SET_DISPATCH: {
      return {
        ...state,
        dispatch: action.payload,
      };
    }
    case types.SET_SUBTITLE: {
      return {
        ...state,
        subtitle: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}
