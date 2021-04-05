import * as types from "./types";

export const speeds: number[] = [
  0.2,
  0.33,
  0.5,
  0.66,
  0.8,
  1,
  1.25,
  1.5,
  2,
  3,
  5,
];

export const playerCleanStore: types.MediaPlayerState = {
  controls: false,
  duration: 0,
  loaded: 0,
  loop: false,
  muted: true,
  playbackRate: 1.0,
  playbackMultiplier: 1.0,
  played: 0,
  playing: false,
  ready: false,
  seek: { time: -1, scale: "fraction" },
  seeking: false,
  speedsIndex: 5,
  url: "",
  volume: 0.8,
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
          url: action.payload.blobURL,
        };
      }
      return playerCleanStore;
    }
    case types.UPDATE_PLAYER_SESSION: {
      // I might Deprecate This Action
      return {
        ...state,
        ...action.payload,
      };
    }
    case types.SET_URL: {
      return {
        ...playerCleanStore,
        url: action.payload.blobURL,
      };
    }
    case types.TOGGLE_PLAY: {
      return {
        ...state,
        playing: action.payload !== undefined ? action.payload : !state.playing,
      };
    }
    case types.STOP_PLAYING: {
      return {
        ...state,
        playing: false,
        url: "none",
      };
    }
    case types.TOGGLE_LOOP: {
      return {
        ...state,
        loop: !state.loop,
      };
    }
    case types.ON_PLAY: {
      return {
        ...state,
        // playing: true
        // todo: this seems circular
      };
    }
    case types.ON_PAUSE: {
      return {
        ...state,
        // playing: false,
        // todo: this seems circular
      };
    }
    case types.ON_ENDED: {
      return {
        ...state,
        playing: state.loop,
      };
    }
    case types.ON_READY: {
      return {
        ...state,
        ready: action.payload,
      };
    }
    case types.ON_PROGRESS: {
      if (!state.seeking && action.payload !== undefined) {
        return {
          ...state,
          ...action.payload,
        };
      } else {
        return state;
      }
    }
    case types.SET_DURATION: {
      return {
        ...state,
        duration: action.payload,
      };
    }
    case types.SET_PLAYBACK_RATE: {
      return {
        ...state,
        playbackRate:
          action.payload >= 15
            ? 14.5
            : action.payload <= 0.2
            ? 0.2
            : action.payload,
      };
    }
    case types.SET_PLAYBACK_MULTIPLIER: {
      return {
        ...state,
        playbackMultiplier: action.payload,
      };
    }
    case types.TOGGLE_MUTED: {
      return {
        ...state,
        muted: !state.muted,
      };
    }
    case types.ON_SEEK_MOUSE_DOWN: {
      return {
        ...state,
        seeking: true,
      };
    }
    case types.ON_SEEK_MOUSE_UP: {
      return {
        ...state,
        seeking: false,
      };
    }
    case types.ON_SEEK_CHANGE: {
      return {
        ...state,
        played: action.payload,
      };
    }
    case types.ON_VOLUME_CHANGE: {
      return {
        ...state,
        volume: action.payload,
      };
    }
    case types.SET_SEEK: {
      return {
        ...state,
        seek: action.payload,
      };
    }
    case types.CHANGE_SPEEDS_INDEX: {
      const idx =
        action.payload === "+" ? state.speedsIndex + 1 : state.speedsIndex - 1;
      return {
        ...state,
        speedsIndex: idx,
        playbackMultiplier: speeds[idx],
      };
    }
    // this.setState({ url: null, playing: false })
    default:
      // console.log("Failed Player action", action);
      return state;
  }
}
