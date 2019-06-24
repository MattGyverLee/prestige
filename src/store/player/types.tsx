// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
  controls?: boolean;
  duration?: any;
  loaded: number;
  loop: boolean;
  muted: boolean;
  pip: boolean;
  playbackRate: number;
  played: any;
  playing: boolean;
  seeking?: boolean;
  url: string;
  volume: number;
  vidPlayerRef: any;
}

// Describing the different ACTION NAMES available
export const ON_ENDED = "ON_ENDED";
export const ON_PLAY = "ON_PLAY";
export const PLAY = "PLAY";
export const SET_URL = "SET_URL";
export const ON_PROGRESS = "ON_PROGESS";
export const SET_DURATION = "SET_DURATION";
export const PLAY_PAUSE = "PLAY_PAUSE";
export const SET_VOLUME = "SET_VOLUME";
export const STOP_PLAYING = "STOP_PLAYING";
export const TOGGLE_LOOP = "TOGGLE_LOOP";
export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";
export const SET_VID_PLAYER_REF = "SET_VID_PLAYER_REF";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";

interface PlayHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface PlayOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}

interface UpdatePlayerAction {
  type: typeof UPDATE_PLAYER_SESSION;
  payload: MediaPlayerState;
}

interface SetURL {
  type: typeof SET_URL;
  payload: string;
}

interface PlayPause {
  type: typeof PLAY_PAUSE;
}
interface Play {
  type: typeof PLAY;
}
interface StopPlaying {
  type: typeof STOP_PLAYING;
}
interface ToggleLoop {
  type: typeof TOGGLE_LOOP;
}
interface SetVolume {
  type: typeof SET_VOLUME;
  payload: number;
}
interface SetVidPlayerRef {
  type: typeof SET_VID_PLAYER_REF;
  payload: number;
}
interface OnPlay {
  type: typeof ON_PLAY;
}
interface OnEnded {
  type: typeof ON_ENDED;
}
interface OnProgress {
  type: typeof ON_PROGRESS;
  payload: any;
}
interface SetDuration {
  type: typeof SET_DURATION;
  payload: any;
}

export type PlayerActionTypes =
  | OnEnded
  | Play
  | SetURL
  | OnPlay
  | SetDuration
  | OnProgress
  | PlayPause
  | SetVidPlayerRef
  | SetVolume
  | StopPlaying
  | ToggleLoop
  | UpdatePlayerAction
  | PlayHardResetApp
  | PlayOnNewFolder;
