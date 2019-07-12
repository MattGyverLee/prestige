import * as types from "./types";

export const deeJayCleanStore: types.DeeJayState = {
  durations: [-1, -1, -1],
  volumes: [1, 0, 0],
  playing: [false, false, false],
  dispatch: { dispatchType: "" }
};

export function deeJayReducer(
  state = deeJayCleanStore,
  action: types.DeeJayActionTypes
): types.DeeJayState {
  switch (action.type) {
    case types.RESET_DEE_JAY: {
      state = deeJayCleanStore;
      return {
        ...state
      };
    }
    case types.SET_WS_DURATION: {
      return {
        ...state,
        durations: state.durations.map((v: number, idx: number) =>
          idx === action.payload.idx ? action.payload.duration : v
        )
      };
    }
    case types.SET_WS_VOLUME: {
      return {
        ...state,
        volumes: state.volumes.map((v: number, idx: number) =>
          idx === action.payload.idx ? action.payload.volume : v
        )
      };
    }
    case types.PLAY_PAUSE: {
      return {
        ...state,
        playing: state.playing.map((p: boolean, idx: number) =>
          idx === 0 ? !p : p
        )
      };
    }
    case types.SET_DISPATCH: {
      return {
        ...state,
        dispatch: action.payload
      };
    }
    default: {
      return state;
    }
  }
}
