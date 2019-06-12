// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
    url: string,
    playing: boolean,
    volume: number,
    muted: boolean,
    playbackRate: number,
    loop: boolean,
    loaded: boolean,
    played: any,
    pip: boolean,
    duration?: number,
    controls?: boolean,
    seeking?: boolean
  }
  // Describing the different ACTION NAMES available
  export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";
  export const PLAY_PAUSE = "PLAY_PAUSE";
  export const STOP_PLAYING = "STOP_PLAYING"
  export const TOGGLE_LOOP = "TOGGLE_LOOP"
  export const SET_VOLUME = "SET_VOLUME"
  export const ON_PLAY = "ON_PLAY"
  export const ON_ENDED = "ON_ENDED"
  export const ON_PROGRESS = "ON_PROGESS"
  
  
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



  export type PlayerActionTypes = UpdatePlayerAction | PlayPause | StopPlaying | ToggleLoop | SetVolume | OnPlay | OnEnded | OnProgress;