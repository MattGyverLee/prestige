import * as types from "./types";

/* export function playHardResetApp(inString: string): types.PlayerActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString
  };
}

export function playOnNewFolder(inString: string): types.PlayerActionTypes {
  return {
    type: types.ON_NEW_FOLDER,
    payload: inString
  };
} */

export function updatePlayerAction(
  newPlayerState: types.MediaPlayerState
): types.PlayerActionTypes {
  return {
    type: types.UPDATE_PLAYER_SESSION,
    payload: newPlayerState
  };
}

export function setURL(inURL: string): types.PlayerActionTypes {
  return {
    type: types.SET_URL,
    payload: inURL
  };
}
export function play(): types.PlayerActionTypes {
  return {
    type: types.PLAY
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
  // console.log("onEnded");
  return {
    type: types.ON_PLAY
  };
}

export function onEnded(): types.PlayerActionTypes {
  // console.log("onEnded");
  return {
    type: types.ON_ENDED
  };
}
export function setDuration(duration: number): types.PlayerActionTypes {
  // onsole.log("setDuration", duration);
  return {
    type: types.SET_DURATION,
    payload: duration
  };
}
export function onProgress(playState: any): types.PlayerActionTypes {
  // console.log("onProgress", playState);
  return {
    type: types.ON_PROGRESS,
    payload: playState
  };
}
export function setPlaybackRate(speed: number): types.PlayerActionTypes {
  return {
    type: types.SET_PLAYBACK_RATE,
    payload: speed
  };
}
export function toggleMuted(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_MUTED
  };
}
export function onSeekMouseDown(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_DOWN
  };
}
export function onSeekMouseUp(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_UP
  };
}
export function onSeekChange(time: number): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_CHANGE,
    payload: time
  };
}
export function onVolumeChange(volume: number): types.PlayerActionTypes {
  return {
    type: types.ON_VOLUME_CHANGE,
    payload: volume
  };
}
export function setSeek(
  prctTime: number,
  time: number,
  waveSurferNum?: number
): types.PlayerActionTypes {
  return {
    type: types.SET_SEEK,
    payload: { prctTime, time, waveSurferNum }
  };
}
