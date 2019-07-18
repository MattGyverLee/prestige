import * as types from "./types";

export const playerCleanStore: types.MediaPlayerState = {
  controls: false,
  duration: 0,
  loaded: 0,
  loop: false,
  muted: true,
  playbackRate: 1.0,
  played: 0,
  playing: false,
  seek: -1,
  seeking: false,
  url: "",
  volume: 0.8
};

export function playerReducer(
  state = playerCleanStore,
  action: types.PlayerActionTypes
): types.MediaPlayerState {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = playerCleanStore;
      return state;
    }
    case types.ON_NEW_FOLDER: {
      if (action.payload.blobURL !== undefined) {
        return {
          ...playerCleanStore,
          url: action.payload.blobURL
        };
      }
      return { ...playerCleanStore };
    }
    case types.UPDATE_PLAYER_SESSION: {
      // I might Deprecate This Action
      return {
        ...state,
        ...action.payload
      };
    }
    case types.SET_URL: {
      return {
        ...state,
        controls: false,
        duration: 0,
        loaded: 0,
        loop: false,
        muted: true,
        playbackRate: 1.0,
        played: 0,
        playing: false,
        seeking: false,
        volume: 0.8,
        url: action.payload
      };
    }
    case types.TOGGLE_PLAY: {
      return {
        ...state,
        playing: action.payload !== undefined ? action.payload : !state.playing
      };
    }
    case types.STOP_PLAYING: {
      return {
        ...state,
        playing: false,
        url: "none"
      };
    }
    case types.TOGGLE_LOOP: {
      return {
        ...state,
        loop: !state.loop
      };
    }
    case types.ON_PLAY: {
      return {
        ...state
        // playing: true
        // this seems circular
      };
    }
    case types.ON_ENDED: {
      return {
        ...state,
        playing: state.loop
      };
    }
    case types.ON_PROGRESS: {
      if (!state.seeking && action.payload !== undefined) {
        return {
          ...state,
          ...action.payload
        };
      } else {
        return state;
      }
    }
    case types.SET_DURATION: {
      return {
        ...state,
        duration: action.payload
      };
    }
    case types.SET_PLAYBACK_RATE: {
      return {
        ...state,
        playbackRate: action.payload
      };
    }
    case types.TOGGLE_MUTED: {
      return {
        ...state,
        muted: !state.muted
      };
    }
    case types.ON_SEEK_MOUSE_DOWN: {
      return {
        ...state,
        seeking: true
      };
    }
    case types.ON_SEEK_MOUSE_UP: {
      return {
        ...state,
        seeking: false
      };
    }
    case types.ON_SEEK_CHANGE: {
      return {
        ...state,
        played: action.payload
      };
    }
    case types.ON_VOLUME_CHANGE: {
      return {
        ...state,
        volume: action.payload
      };
    }
    case types.SET_SEEK: {
      return {
        ...state,
        seek: action.payload
      };
    }
    // this.setState({ url: null, playing: false })
    default:
      // console.log("Failed Player action", action);
      return state;
  }
}
