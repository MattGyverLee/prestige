// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
    url: string,
    playing: boolean,
    volume: number,
    muted: boolean,
    playbackRate: number,
    loop?: boolean,
    loaded?: boolean,
    played?: boolean,
    pip?: boolean,
    duration?: number,
    controls?: boolean,
    parent?: any
  }
  // Describing the different ACTION NAMES available
  export const UPDATE_PLAYER_SESSION = "UPDATE_PLAYER_SESSION";
  export const PLAY_PAUSE = "PLAY_PAUSE";
  
  interface UpdatePlayerAction {
    type: typeof UPDATE_PLAYER_SESSION;
    payload: MediaPlayerState;
  }

  interface PlayPause {
    type: typeof PLAY_PAUSE;
    payload: true;
  }

  export type PlayerActionTypes = UpdatePlayerAction | PlayPause;