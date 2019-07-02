import * as types from "./types";

export const deeJayCleanStore: types.DeeJayState = {
  waveSurfer1: null,
  waveSurfer2: null,
  waveSurfer3: null,
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
    case types.SET_WAVE_SURFER1: {
      return {
        ...state,
        waveSurfer1: action.payload
      };
    }
    default: {
      return state;
    }
  }
}
