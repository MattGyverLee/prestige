import * as types from "./types";

export function setWaveSurfer(
  waveSurfer: any,
  idx: number
): types.DeeJayActionTypes {
  return {
    type: types.SET_WAVE_SURFER,
    payload: { waveSurfer, idx }
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

export function setWSVolume(
  idx: number,
  volume: number
): types.DeeJayActionTypes {
  return {
    type: types.SET_WS_VOLUME,
    payload: { idx: idx, volume: volume }
  };
}
