export interface DeeJayState {
  dispatch: DeeJayDispatch;
  volumes: number[];
  subtitle: string;
}

export interface DeeJayDispatch {
  dispatchType: string;
  wsNum?: number;
  wsNum2?: number;
  clipStart?: number;
  clipStop?: number;
  refStart?: number;
  refStop?: number;
  loop?: number;
}

export const SET_WS_VOLUME = "SET_WS_VOLUME";
export const RESET_DEE_JAY = "RESET_DEE_JAY";
export const SET_DISPATCH = "SET_DISPATCH";
export const SET_SUBTITLE = "SET_SUBTITLE";

interface SetWSVolume {
  type: typeof SET_WS_VOLUME;
  payload: { idx: number; volume: number };
}

interface ResetDeeJay {
  type: typeof RESET_DEE_JAY;
}
interface SetDispatch {
  type: typeof SET_DISPATCH;
  payload: DeeJayDispatch;
}
interface SetSubtitle {
  type: typeof SET_SUBTITLE;
  payload: string;
}

export type DeeJayActionTypes =
  | SetWSVolume
  | ResetDeeJay
  | SetDispatch
  | SetSubtitle;
