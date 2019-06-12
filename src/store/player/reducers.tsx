// src/store/tree/reducers.ts
import { UPDATE_PLAYER_SESSION, PLAY_PAUSE, STOP_PLAYING, MediaPlayerState, PlayerActionTypes } from "./types";

const initialState: MediaPlayerState = {
    url: "",
    playing: false,
    volume: 0.8,
    muted: false,
    controls: true,
    played: false,
    loaded: false,
    duration: -1,
    playbackRate: 1.0,
    loop: false,
    pip: false,
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
      }
    }
    case STOP_PLAYING: {
      return {
        ...state,
        playing: false,
        url: "none"
      }
    }
    //this.setState({ url: null, playing: false })
    default:
      return state;
  }
}