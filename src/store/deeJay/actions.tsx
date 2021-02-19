import * as types from "./types";

export function resetDeeJay(): types.DeeJayActionTypes {
  return {
    type: types.RESET_DEE_JAY,
  };
}

export function setWSVolume(
  idx: number,
  volume: number
): types.DeeJayActionTypes {
  return {
    type: types.SET_WS_VOLUME,
    payload: { idx, volume },
  };
}
export function setDispatch(
  type: types.DeeJayDispatch
): types.DeeJayActionTypes {
  return {
    type: types.SET_DISPATCH,
    payload: type,
  };
}

export function setSubtitle(subtitle: string): types.DeeJayActionTypes {
  return {
    type: types.SET_SUBTITLE,
    payload: subtitle,
  };
}
