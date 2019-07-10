import * as types from "./types";

export function resetDeeJay(): types.DeeJayActionTypes {
  return {
    type: types.RESET_DEE_JAY
  };
}

export function setWSDuration(
  idx: number,
  duration: number
): types.DeeJayActionTypes {
  return {
    type: types.SET_WS_DURATION,
    payload: { idx, duration }
  };
}

export function waveSurferPlayClip(
  idx: number,
  clipStart: number,
  clipStop: number = -1
): types.DeeJayActionTypes {
  return {
    type: types.WAVE_SURFER_PLAY_CLIP,
    payload: { idx, clipStart, clipStop }
  };
}

export function waveSurferPosChange(
  idx: number,
  pos: number
): types.DeeJayActionTypes {
  return {
    type: types.WAVE_SURFER_POS_CHANGE,
    payload: { idx, pos }
  };
}
export function setWSVolume(
  idx: number,
  volume: number
): types.DeeJayActionTypes {
  return {
    type: types.SET_WS_VOLUME,
    payload: { idx, volume }
  };
}
