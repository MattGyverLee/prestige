import { MediaPlayerState, UPDATE_PLAYER_SESSION, PLAY_PAUSE, STOP_PLAYING, TOGGLE_LOOP, ON_PLAY, ON_ENDED, ON_PROGRESS, PlayerActionTypes } from './types'

export function updatePlayerAction(newPlayerState: MediaPlayerState): PlayerActionTypes {
    return {
        type: UPDATE_PLAYER_SESSION,
        payload: newPlayerState
      }
}

export function playPause(): PlayerActionTypes {
  return {
    type: PLAY_PAUSE,
  };
}

export function stopPlaying(): PlayerActionTypes {
  return {
    type: STOP_PLAYING,
  };
}

export function toggleLoop(): PlayerActionTypes {
  return {
    type: TOGGLE_LOOP,
  };
}

export function onPlay(): PlayerActionTypes {
  return {
    type: ON_PLAY,
  };
}

export function onEnded(): PlayerActionTypes {
  return {
    type: ON_ENDED,
  };
}
export function onProgress(playState: any): PlayerActionTypes {
  return {
    type: ON_PROGRESS,
    payload: playState.played
  };
}
/*export function setNewURL(newURL: URL): PlayerActionTypes {
    return {
        type: UPDATE_PLAYER_SESSION,
        tempState = ...MediaPlayerState
        payload: newURL
      }*/


