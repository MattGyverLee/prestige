import * as types from "./types";

export function updatePlayerAction(
  newPlayerState: types.MediaPlayerState
): types.PlayerActionTypes {
  return {
    type: types.UPDATE_PLAYER_SESSION,
    payload: newPlayerState
  };
}

export function playPause(): types.PlayerActionTypes {
  return {
    type: types.PLAY_PAUSE
  };
}

export function stopPlaying(): types.PlayerActionTypes {
  return {
    type: types.STOP_PLAYING
  };
}

export function toggleLoop(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_LOOP
  };
}

export function onPlay(): types.PlayerActionTypes {
  return {
    type: types.ON_PLAY
  };
}

export function onEnded(): types.PlayerActionTypes {
  return {
    type: types.ON_ENDED
  };
}
export function onProgress(playState: any): types.PlayerActionTypes {
  return {
    type: types.ON_PROGRESS,
    payload: playState.played
  };
}
/*export function setNewURL(newURL: URL): PlayerActionTypes {
    return {
        type: UPDATE_PLAYER_SESSION,
        tempState = ...MediaPlayerState
        payload: newURL
      }*/
