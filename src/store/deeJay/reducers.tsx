import * as types from "./types";

export const deeJayCleanStore: types.DeeJayState = {
  waveSurfers: [null, null, null],
  volumes: [1, 0, 0],
  pos: 0,
  playing: false
};

export function deeJayReducer(
  state = deeJayCleanStore,
  action: types.DeeJayActionTypes
): types.DeeJayState {
  switch (action.type) {
    case types.TOGGLE_WAVE_SURFER_PLAY: {
      return { ...state, playing: !state.playing };
    }
    case types.WAVE_SURFER_POS_CHANGE: {
      return { ...state, pos: action.payload };
    }
    case types.SET_WAVE_SURFER: {
      return {
        ...state,
        waveSurfers: state.waveSurfers.map((w: any, idx: number) =>
          idx === action.payload.idx ? action.payload.waveSurfer : w
        )
      };
    }
    case types.SET_WS_VOLUME: {
      state.waveSurfers[action.payload.idx].setVolume(action.payload.volume);
      return {
        ...state,
        volumes: state.volumes.map((v: number, idx: number) =>
          idx === action.payload.idx ? action.payload.volume : v
        )
      };
    }
    default: {
      return state;
    }
  }
}
