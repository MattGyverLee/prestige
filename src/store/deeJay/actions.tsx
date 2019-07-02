import * as types from "./types";

export function setWaveSurfer1(waveSurfer1: any): types.DeeJayActionTypes {
  return {
    type: types.SET_WAVE_SURFER1,
    payload: waveSurfer1
  };
}

export function waveSurferPosChange(pos: number): types.DeeJayActionTypes {
  return {
    type: types.WAVE_SURFER_POS_CHANGE,
    payload: pos
  };
}

export function toggleWaveSurferPlay(): types.DeeJayActionTypes {
  return {
    type: types.TOGGLE_WAVE_SURFER_PLAY
  };
}
