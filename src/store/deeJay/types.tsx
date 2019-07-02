export interface DeeJayState {
  waveSurfer1: any;
  waveSurfer2: any;
  waveSurfer3: any;
  pos: number;
  playing: boolean;
}

export const SET_WAVE_SURFER1 = "SET_WAVE_SURFER1";
export const WAVE_SURFER_POS_CHANGE = "WAVE_SURFER_POS_CHANGE";
export const TOGGLE_WAVE_SURFER_PLAY = "TOGGLE_WAVE_SURFER_PLAY";

interface SetWaveSurfer1 {
  type: typeof SET_WAVE_SURFER1;
  payload: any;
}
interface WaveSurferPosChange {
  type: typeof WAVE_SURFER_POS_CHANGE;
  payload: number;
}
interface ToggleWaveSurferPlay {
  type: typeof TOGGLE_WAVE_SURFER_PLAY;
}

export type DeeJayActionTypes =
  | SetWaveSurfer1
  | WaveSurferPosChange
  | ToggleWaveSurferPlay;
