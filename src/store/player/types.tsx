// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
    controls?: boolean,
    duration?: number,
    loaded: boolean,
    loop: boolean,
    muted: boolean,
    pip: boolean,
    playbackRate: number,
    played: any,
    playing: boolean,
    seeking?: boolean,
    url: string,
    volume: number
  }
  // Describing the different ACTION NAMES available
  export const ON_ENDED = "ON_ENDED";
  export const ON_PLAY = "ON_PLAY";
  export const ON_PROGRESS = "ON_PROGESS";
  export const PLAY_PAUSE = "PLAY_PAUSE";
  export const SET_VOLUME = "SET_VOLUME";
  export const STOP_PLAYING = "STOP_PLAYING";
  export const TOGGLE_LOOP = "TOGGLE_LOOP";
  export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";
  
  
  interface UpdatePlayerAction {
    type: typeof UPDATE_PLAYER_SESSION;
    payload: MediaPlayerState;
  }

  interface PlayPause {
    type: typeof PLAY_PAUSE;
  }
  interface StopPlaying {
    type: typeof STOP_PLAYING;
  }
  interface ToggleLoop {
    type: typeof TOGGLE_LOOP;
  }
  interface SetVolume {
    type: typeof SET_VOLUME,
    payload: number,
  }
  interface OnPlay {
    type: typeof ON_PLAY,
  }
  interface OnEnded {
    type: typeof ON_ENDED
  }
  interface OnProgress {
    type: typeof ON_PROGRESS,
    payload: any
  }



  export type PlayerActionTypes = 
  UpdatePlayerAction | 
  PlayPause | 
  StopPlaying | 
  ToggleLoop | 
  SetVolume | 
  OnPlay | 
  OnEnded | 
  OnProgress;