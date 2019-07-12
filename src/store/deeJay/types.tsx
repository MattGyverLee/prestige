export interface DeeJayState {
  durations: number[];
  pos: number[];
  clipStarts: number[];
  clipStops: number[];
  volumes: number[];
  playing: boolean[];
  refresh: boolean;
}

export const WAVE_SURFER_PLAY_CLIP = "WAVE_SURFER_PLAY_CLIP";
export const WAVE_SURFER_POS_CHANGE = "WAVE_SURFER_POS_CHANGE";
export const SET_WS_DURATION = "SET_WS_DURATION";
export const SET_WS_VOLUME = "SET_WS_VOLUME";
export const SET_SEEK = "SET_SEEK";
export const PLAY_PAUSE = "PLAY_PAUSE";
export const RESET_DEE_JAY = "RESET_DEE_JAY";
export const SET_DJ_REFRESH = "SET_DJ_REFRESH";

interface SetDJRefresh {
  type: typeof SET_DJ_REFRESH;
  payload: { value: boolean };
}

interface SetWSDuration {
  type: typeof SET_WS_DURATION;
  payload: { idx: number; duration: number };
}

interface SetWSVolume {
  type: typeof SET_WS_VOLUME;
  payload: { idx: number; volume: number };
}

interface WaveSurferPlayClip {
  type: typeof WAVE_SURFER_PLAY_CLIP;
  payload: { idx: number; clipStart: number; clipStop: number };
}

interface WaveSurferPosChange {
  type: typeof WAVE_SURFER_POS_CHANGE;
  payload: { idx: number; pos: number };
}
interface SetSeek {
  type: typeof SET_SEEK;
  payload: { prctTime: number; time: number; waveSurferNum?: number };
}
interface PlayPause {
  type: typeof PLAY_PAUSE;
}
interface ResetDeeJay {
  type: typeof RESET_DEE_JAY;
}

export type DeeJayActionTypes =
  | WaveSurferPlayClip
  | WaveSurferPosChange
  | SetWSDuration
  | SetWSVolume
  | SetSeek
  | SetDJRefresh
  | PlayPause
  | ResetDeeJay;
