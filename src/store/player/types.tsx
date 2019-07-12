// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
  controls?: boolean;
  duration: number;
  loaded: number;
  loop: boolean;
  muted: boolean;
  pip: boolean;
  playbackRate: number;
  played: number;
  playing: boolean;
  seek: number;
  seeking?: boolean;
  url: string;
  volume: number;
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
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const SET_PLAYBACK_RATE = "SET_PLAYBACK_RATE";
export const TOGGLE_MUTED = "TOGGLE_MUTED";
export const ON_SEEK_MOUSE_DOWN = "ON_SEEK_MOUSE_DOWN";
export const ON_SEEK_MOUSE_UP = "ON_SEEK_MOUSE_UP";
export const ON_SEEK_CHANGE = "ON_SEEK_CHANGE";
export const ON_VOLUME_CHANGE = "ON_VOLUME_CHANGE";
export const SET_SEEK = "SET_SEEK";

interface PlayHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface PlayOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { path: string; blobURL?: string };
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
  payload: number;
}
interface SetPlaybackRate {
  type: typeof SET_PLAYBACK_RATE;
  payload: number;
}
interface ToggleMuted {
  type: typeof TOGGLE_MUTED;
}
interface OnSeekMouseDown {
  type: typeof ON_SEEK_MOUSE_DOWN;
}
interface OnSeekMouseUp {
  type: typeof ON_SEEK_MOUSE_UP;
}
interface OnSeekChange {
  type: typeof ON_SEEK_CHANGE;
  payload: number;
}
interface OnVolumeChange {
  type: typeof ON_VOLUME_CHANGE;
  payload: number;
}
interface SetSeek {
  type: typeof SET_SEEK;
  payload: number;
}

export type PlayerActionTypes =
  | OnEnded
  | Play
  | SetURL
  | OnPlay
  | SetDuration
  | OnProgress
  | PlayPause
  | SetVolume
  | StopPlaying
  | ToggleLoop
  | UpdatePlayerAction
  | PlayHardResetApp
  | PlayOnNewFolder
  | SetPlaybackRate
  | ToggleMuted
  | OnSeekMouseDown
  | OnSeekMouseUp
  | OnSeekChange
  | OnVolumeChange
  | SetSeek;
