import { MediaPlayerState, UPDATE_PLAYER_SESSION, PLAY_PAUSE, STOP_PLAYING, PlayerActionTypes } from './types'

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
/*export function setNewURL(newURL: URL): PlayerActionTypes {
    return {
        type: UPDATE_PLAYER_SESSION,
        tempState = ...MediaPlayerState
        payload: newURL
      }*/


