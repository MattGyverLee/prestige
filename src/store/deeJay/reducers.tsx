import * as types from "./types";

export const deeJayCleanStore: types.DeeJayState = {
  durations: [-1, -1, -1],
  volumes: [1, 0, 0],
  pos: [0, 0, 0],
  clipStarts: [-1, -1, -1],
  clipStops: [-1, -1, -1],
  playing: [false, false, false]
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
    case types.WAVE_SURFER_POS_CHANGE: {
      return {
        ...state,
        pos: state.pos.map((p: number, idx: number) =>
          idx === action.payload.idx ? action.payload.pos : p
        )
      };
    }
    case types.WAVE_SURFER_PLAY_CLIP: {
      return {
        ...state,
        clipStarts: state.clipStarts.map((p: number, idx: number) =>
          idx === action.payload.idx ? action.payload.clipStart : p
        ),
        clipStops: state.clipStops.map((p: number, idx: number) =>
          idx === action.payload.idx ? action.payload.clipStop : p
        )
      };
    }
    case types.SET_SEEK: {
      return {
        ...state,
        pos: state.pos.map((p: number, idx: number) =>
          idx === action.payload.waveSurferNum && action.payload.time !== -1
            ? action.payload.time
            : p
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
    default: {
      return state;
    }
  }
}
