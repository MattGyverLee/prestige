export interface DeeJayState {
  durations: number[];
  dispatch: DeeJayDispatch;
  volumes: number[];
  playing: boolean[];
}

export interface DeeJayDispatch {
  dispatchType: string;
  wsNum?: number;
  clipStart?: number;
  clipStop?: number;
  refStart?: number;
  refStop?: number;
  loop?: number;
}

export const SET_WS_DURATION = "SET_WS_DURATION";
export const SET_WS_VOLUME = "SET_WS_VOLUME";
export const PLAY_PAUSE = "PLAY_PAUSE";
export const RESET_DEE_JAY = "RESET_DEE_JAY";
export const SET_DISPATCH = "SET_DISPATCH";

interface SetWSDuration {
  type: typeof SET_WS_DURATION;
  payload: { idx: number; duration: number };
}

interface SetWSVolume {
  type: typeof SET_WS_VOLUME;
  payload: { idx: number; volume: number };
}

interface PlayPause {
  type: typeof PLAY_PAUSE;
}
interface ResetDeeJay {
  type: typeof RESET_DEE_JAY;
}
interface SetDispatch {
  type: typeof SET_DISPATCH;
  payload: DeeJayDispatch;
}

export type DeeJayActionTypes =
  | SetWSDuration
  | SetWSVolume
  | PlayPause
  | ResetDeeJay
  | SetDispatch;
