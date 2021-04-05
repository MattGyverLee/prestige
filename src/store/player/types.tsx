// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
  controls?: boolean;
  duration: number;
  loaded: number;
  loop: boolean;
  muted: boolean;
  playbackMultiplier: number;
  playbackRate: number;
  played: number;
  playing: boolean;
  ready: boolean;
  seek: { time: number; scale: "seconds" | "fraction" | undefined };
  seeking?: boolean;
  speedsIndex: number;
  url: string;
  volume: number;
}

// Describing the different ACTION NAMES available
export const CHANGE_SPEEDS_INDEX = "CHANGE_SPEEDS_INDEX";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_ENDED = "ON_ENDED";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const ON_PLAY = "ON_PLAY";
export const ON_PAUSE = "ON_PAUSE";
export const ON_READY = "ON_READY";
export const ON_PROGRESS = "ON_PROGESS";
export const ON_SEEK_CHANGE = "ON_SEEK_CHANGE";
export const ON_SEEK_MOUSE_DOWN = "ON_SEEK_MOUSE_DOWN";
export const ON_SEEK_MOUSE_UP = "ON_SEEK_MOUSE_UP";
export const ON_VOLUME_CHANGE = "ON_VOLUME_CHANGE";
export const SET_DURATION = "SET_DURATION";
export const SET_PLAYBACK_MULTIPLIER = "SET_PLAYBACK_MULTIPLIER";
export const SET_PLAYBACK_RATE = "SET_PLAYBACK_RATE";
export const SET_SEEK = "SET_SEEK";
export const SET_URL = "SET_URL";
export const SET_VOLUME = "SET_VOLUME";
export const STOP_PLAYING = "STOP_PLAYING";
export const TOGGLE_LOOP = "TOGGLE_LOOP";
export const TOGGLE_MUTED = "TOGGLE_MUTED";
export const TOGGLE_PLAY = "TOGGLE_PLAY";
export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";

interface ChangeSpeedsIndex {
  type: typeof CHANGE_SPEEDS_INDEX;
  payload: string;
}

interface OnEnded {
  type: typeof ON_ENDED;
}

interface OnPlay {
  type: typeof ON_PLAY;
}

interface OnPause {
  type: typeof ON_PAUSE;
}

interface OnReady {
  type: typeof ON_READY;
  payload: boolean;
}

interface OnProgress {
  type: typeof ON_PROGRESS;
  payload: any;
}

interface OnSeekChange {
  type: typeof ON_SEEK_CHANGE;
  payload: number;
}

interface OnSeekMouseDown {
  type: typeof ON_SEEK_MOUSE_DOWN;
}

interface OnSeekMouseUp {
  type: typeof ON_SEEK_MOUSE_UP;
}

interface OnVolumeChange {
  type: typeof ON_VOLUME_CHANGE;
  payload: number;
}

interface PlayHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface PlayOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { path: string; blobURL?: string };
}

interface SetDuration {
  type: typeof SET_DURATION;
  payload: number;
}

interface SetPlaybackMultiplier {
  type: typeof SET_PLAYBACK_MULTIPLIER;
  payload: number;
}

interface SetPlaybackRate {
  type: typeof SET_PLAYBACK_RATE;
  payload: number;
}

interface SetSeek {
  type: typeof SET_SEEK;
  payload: { time: number; scale: "seconds" | "fraction" | undefined };
}

interface SetURL {
  type: typeof SET_URL;
  payload: { blobURL: string; timelineIndex: number };
}

interface SetVolume {
  type: typeof SET_VOLUME;
  payload: number;
}

interface StopPlaying {
  type: typeof STOP_PLAYING;
}

interface ToggleLoop {
  type: typeof TOGGLE_LOOP;
}

interface ToggleMuted {
  type: typeof TOGGLE_MUTED;
}

interface TogglePlay {
  type: typeof TOGGLE_PLAY;
  payload?: boolean;
}

interface UpdatePlayerAction {
  type: typeof UPDATE_PLAYER_SESSION;
  payload: MediaPlayerState;
}

export type PlayerActionTypes =
  | ChangeSpeedsIndex
  | OnEnded
  | OnPlay
  | OnPause
  | OnReady
  | OnProgress
  | OnSeekChange
  | OnSeekMouseDown
  | OnSeekMouseUp
  | OnVolumeChange
  | PlayHardResetApp
  | PlayOnNewFolder
  | SetDuration
  | SetPlaybackMultiplier
  | SetPlaybackRate
  | SetSeek
  | SetURL
  | SetVolume
  | StopPlaying
  | ToggleLoop
  | ToggleMuted
  | TogglePlay
  | UpdatePlayerAction;
