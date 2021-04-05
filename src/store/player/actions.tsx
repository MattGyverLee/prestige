import * as types from "./types";

export function updatePlayerAction(
  newPlayerState: types.MediaPlayerState
): types.PlayerActionTypes {
  return {
    type: types.UPDATE_PLAYER_SESSION,
    payload: newPlayerState,
  };
}

export function setURL(
  blobURL: string,
  timelineIndex: number
): types.PlayerActionTypes {
  return {
    type: types.SET_URL,
    payload: { blobURL, timelineIndex },
  };
}

export function togglePlay(playPause?: boolean): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_PLAY,
    payload: playPause,
  };
}

export function stopPlaying(): types.PlayerActionTypes {
  return {
    type: types.STOP_PLAYING,
  };
}

export function toggleLoop(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_LOOP,
  };
}

export function onPlay(): types.PlayerActionTypes {
  return {
    type: types.ON_PLAY,
  };
}

export function onPause(): types.PlayerActionTypes {
  return {
    type: types.ON_PAUSE,
  };
}

export function onReady(ready: boolean): types.PlayerActionTypes {
  return {
    type: types.ON_READY,
    payload: ready,
  };
}

export function onEnded(): types.PlayerActionTypes {
  return {
    type: types.ON_ENDED,
  };
}

export function setDuration(duration: number): types.PlayerActionTypes {
  return {
    type: types.SET_DURATION,
    payload: duration,
  };
}

export function onProgress(playState: any): types.PlayerActionTypes {
  return {
    type: types.ON_PROGRESS,
    payload: playState,
  };
}

export function setPlaybackRate(speed: number): types.PlayerActionTypes {
  return {
    type: types.SET_PLAYBACK_RATE,
    payload: speed,
  };
}

export function setPlaybackMultiplier(
  multiplier: number
): types.PlayerActionTypes {
  return {
    type: types.SET_PLAYBACK_MULTIPLIER,
    payload: multiplier,
  };
}

export function toggleMuted(): types.PlayerActionTypes {
  return {
    type: types.TOGGLE_MUTED,
  };
}

export function onSeekMouseDown(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_DOWN,
  };
}

export function onSeekMouseUp(): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_MOUSE_UP,
  };
}

export function onSeekChange(time: number): types.PlayerActionTypes {
  return {
    type: types.ON_SEEK_CHANGE,
    payload: time,
  };
}

export function onVolumeChange(volume: number): types.PlayerActionTypes {
  return {
    type: types.ON_VOLUME_CHANGE,
    payload: volume,
  };
}

export function setSeek(
  inTime: number,
  inScale: "seconds" | "fraction" | undefined
): types.PlayerActionTypes {
  return {
    type: types.SET_SEEK,
    payload: { time: inTime, scale: inScale },
  };
}

export function changeSpeedsIndex(manner: string): types.PlayerActionTypes {
  return {
    type: types.CHANGE_SPEEDS_INDEX,
    payload: manner,
  };
}
