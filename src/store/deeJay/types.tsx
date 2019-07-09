export interface DeeJayState {
  volumes: number[];
  pos: number;
  playing: boolean;
}

export const WAVE_SURFER_POS_CHANGE = "WAVE_SURFER_POS_CHANGE";
export const TOGGLE_WAVE_SURFER_PLAY = "TOGGLE_WAVE_SURFER_PLAY";
export const SET_WS_VOLUME = "SET_WS_VOLUME";

interface WaveSurferPosChange {
  type: typeof WAVE_SURFER_POS_CHANGE;
  payload: number;
}
interface ToggleWaveSurferPlay {
  type: typeof TOGGLE_WAVE_SURFER_PLAY;
}
interface setWSVolume {
  type: typeof SET_WS_VOLUME;
  payload: { idx: number; volume: number };
}

export type DeeJayActionTypes =
  | WaveSurferPosChange
  | ToggleWaveSurferPlay
  | setWSVolume;
