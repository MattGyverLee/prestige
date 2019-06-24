import * as types from "./types";

export const playerCleanStore: types.MediaPlayerState = {
  controls: false,
  duration: 0,
  loaded: 0,
  loop: false,
  muted: false,
  pip: false,
  playbackRate: 1.0,
  played: false,
  playing: false,
  seeking: false,
  url: "",
  volume: 0.8,
  vidPlayerRef: undefined
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
      state = playerCleanStore;
      return state;
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
        muted: false,
        pip: false,
        playbackRate: 1.0,
        played: false,
        playing: true,
        seeking: false,
        volume: 0.8,
        url: action.payload
      };
    }
    case types.SET_VID_PLAYER_REF: {
      return {
        ...state,
        vidPlayerRef: action.payload
      };
    }
    case types.PLAY: {
      return {
        ...state,
        playing: true
      };
    }
    case types.PLAY_PAUSE: {
      return {
        ...state,
        playing: !state.playing
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
          ...action.payload,
          ...state
        };
      } else {
        return state;
      }
    }
    case types.SET_DURATION: {
      return {
        ...state
        // duration: action.payload
      };
    }
    // this.setState({ url: null, playing: false })
    default:
      // console.log("Failed Player action", action);
      return state;
  }
}
