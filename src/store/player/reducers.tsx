// src/store/tree/reducers.ts

import {
  MediaPlayerState,
  ON_ENDED,
  ON_PLAY,
  ON_PROGRESS,
  PLAY_PAUSE,
  PlayerActionTypes,
  STOP_PLAYING,
  TOGGLE_LOOP,
  UPDATE_PLAYER_SESSION
} from "./types";

const initialState: MediaPlayerState = {
  controls: false,
  duration: -1,
  loaded: false,
  loop: false,
  muted: false,
  pip: false,
  playbackRate: 1.0,
  played: false,
  playing: false,
  url: "",
  volume: 0.8
};

export function playerReducer(
  state = initialState,
  action: PlayerActionTypes
): MediaPlayerState {
  switch (action.type) {
    case UPDATE_PLAYER_SESSION: {
      return {
        ...state,
        ...action.payload
      };
    }
    case PLAY_PAUSE: {
      return {
        ...state,
        playing: !state.playing
      };
    }
    case STOP_PLAYING: {
      return {
        ...state,
        playing: false,
        url: "none"
      };
    }
    case TOGGLE_LOOP: {
      return {
        ...state,
        loop: !state.loop
      };
    }
    case ON_PLAY: {
      return {
        ...state,
        playing: true
      };
    }
    case ON_ENDED: {
      return {
        ...state,
        playing: state.loop
      };
    }
    case ON_PROGRESS: {
      return {
        ...state,
        played: action.payload
      };
    }
    //this.setState({ url: null, playing: false })
    default:
      return state;
  }
}
