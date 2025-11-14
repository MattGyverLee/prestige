/**
 * Unit tests for player Redux store
 *
 * These tests verify the public API contract of the player store:
 * - Action creators: function inputs → action objects
 * - Reducer: (state, action) → new state
 *
 * Tests focus on inputs and outputs, not implementation details.
 */

import { describe, it, expect } from "vitest";
import * as actions from "../actions";
import * as types from "../types";
import { playerReducer, playerCleanStore, speeds } from "../reducers";

// ============================================================================
// ACTION CREATORS
// ============================================================================

describe("Player Action Creators", () => {
  describe("updatePlayerAction", () => {
    it("should create an UPDATE_PLAYER_SESSION action with new player state", () => {
      const newState: types.MediaPlayerState = {
        ...playerCleanStore,
        playing: true,
        volume: 0.5,
      };

      const action = actions.updatePlayerAction(newState);

      expect(action).toEqual({
        type: types.UPDATE_PLAYER_SESSION,
        payload: newState,
      });
    });
  });

  describe("setURL", () => {
    it("should create a SET_URL action with blobURL and timeline index", () => {
      const action = actions.setURL("blob:http://example.com/video", 3);

      expect(action).toEqual({
        type: types.SET_URL,
        payload: { blobURL: "blob:http://example.com/video", timelineIndex: 3 },
      });
    });

    it("should handle index 0", () => {
      const action = actions.setURL("blob:http://example.com/video", 0);

      expect(action.payload.timelineIndex).toBe(0);
    });
  });

  describe("togglePlay", () => {
    it("should create a TOGGLE_PLAY action without payload", () => {
      const action = actions.togglePlay();

      expect(action).toEqual({
        type: types.TOGGLE_PLAY,
        payload: undefined,
      });
    });

    it("should create a TOGGLE_PLAY action with explicit true", () => {
      const action = actions.togglePlay(true);

      expect(action).toEqual({
        type: types.TOGGLE_PLAY,
        payload: true,
      });
    });

    it("should create a TOGGLE_PLAY action with explicit false", () => {
      const action = actions.togglePlay(false);

      expect(action).toEqual({
        type: types.TOGGLE_PLAY,
        payload: false,
      });
    });
  });

  describe("stopPlaying", () => {
    it("should create a STOP_PLAYING action", () => {
      const action = actions.stopPlaying();

      expect(action).toEqual({
        type: types.STOP_PLAYING,
      });
    });
  });

  describe("toggleLoop", () => {
    it("should create a TOGGLE_LOOP action", () => {
      const action = actions.toggleLoop();

      expect(action).toEqual({
        type: types.TOGGLE_LOOP,
      });
    });
  });

  describe("onPlay", () => {
    it("should create an ON_PLAY action", () => {
      const action = actions.onPlay();

      expect(action).toEqual({
        type: types.ON_PLAY,
      });
    });
  });

  describe("onPause", () => {
    it("should create an ON_PAUSE action", () => {
      const action = actions.onPause();

      expect(action).toEqual({
        type: types.ON_PAUSE,
      });
    });
  });

  describe("onReady", () => {
    it("should create an ON_READY action with ready=true", () => {
      const action = actions.onReady(true);

      expect(action).toEqual({
        type: types.ON_READY,
        payload: true,
      });
    });

    it("should create an ON_READY action with ready=false", () => {
      const action = actions.onReady(false);

      expect(action).toEqual({
        type: types.ON_READY,
        payload: false,
      });
    });
  });

  describe("onEnded", () => {
    it("should create an ON_ENDED action", () => {
      const action = actions.onEnded();

      expect(action).toEqual({
        type: types.ON_ENDED,
      });
    });
  });

  describe("setDuration", () => {
    it("should create a SET_DURATION action with duration", () => {
      const action = actions.setDuration(120.5);

      expect(action).toEqual({
        type: types.SET_DURATION,
        payload: 120.5,
      });
    });

    it("should handle zero duration", () => {
      const action = actions.setDuration(0);

      expect(action.payload).toBe(0);
    });
  });

  describe("onProgress", () => {
    it("should create an ON_PROGRESS action with play state", () => {
      const playState = { played: 0.5, loaded: 0.8 };
      const action = actions.onProgress(playState);

      expect(action).toEqual({
        type: types.ON_PROGRESS,
        payload: playState,
      });
    });
  });

  describe("setPlaybackRate", () => {
    it("should create a SET_PLAYBACK_RATE action with speed", () => {
      const action = actions.setPlaybackRate(2.0);

      expect(action).toEqual({
        type: types.SET_PLAYBACK_RATE,
        payload: 2.0,
      });
    });
  });

  describe("setPlaybackMultiplier", () => {
    it("should create a SET_PLAYBACK_MULTIPLIER action with multiplier", () => {
      const action = actions.setPlaybackMultiplier(1.5);

      expect(action).toEqual({
        type: types.SET_PLAYBACK_MULTIPLIER,
        payload: 1.5,
      });
    });
  });

  describe("toggleMuted", () => {
    it("should create a TOGGLE_MUTED action", () => {
      const action = actions.toggleMuted();

      expect(action).toEqual({
        type: types.TOGGLE_MUTED,
      });
    });
  });

  describe("onSeekMouseDown", () => {
    it("should create an ON_SEEK_MOUSE_DOWN action", () => {
      const action = actions.onSeekMouseDown();

      expect(action).toEqual({
        type: types.ON_SEEK_MOUSE_DOWN,
      });
    });
  });

  describe("onSeekMouseUp", () => {
    it("should create an ON_SEEK_MOUSE_UP action", () => {
      const action = actions.onSeekMouseUp();

      expect(action).toEqual({
        type: types.ON_SEEK_MOUSE_UP,
      });
    });
  });

  describe("onSeekChange", () => {
    it("should create an ON_SEEK_CHANGE action with time", () => {
      const action = actions.onSeekChange(45.5);

      expect(action).toEqual({
        type: types.ON_SEEK_CHANGE,
        payload: 45.5,
      });
    });
  });

  describe("onVolumeChange", () => {
    it("should create an ON_VOLUME_CHANGE action with volume", () => {
      const action = actions.onVolumeChange(0.7);

      expect(action).toEqual({
        type: types.ON_VOLUME_CHANGE,
        payload: 0.7,
      });
    });
  });

  describe("setSeek", () => {
    it("should create a SET_SEEK action with time in seconds", () => {
      const action = actions.setSeek(30, "seconds");

      expect(action).toEqual({
        type: types.SET_SEEK,
        payload: { time: 30, scale: "seconds" },
      });
    });

    it("should create a SET_SEEK action with time in fraction", () => {
      const action = actions.setSeek(0.5, "fraction");

      expect(action).toEqual({
        type: types.SET_SEEK,
        payload: { time: 0.5, scale: "fraction" },
      });
    });

    it("should create a SET_SEEK action with undefined scale", () => {
      const action = actions.setSeek(15, undefined);

      expect(action.payload.scale).toBeUndefined();
    });
  });

  describe("changeSpeedsIndex", () => {
    it("should create a CHANGE_SPEEDS_INDEX action with + direction", () => {
      const action = actions.changeSpeedsIndex("+");

      expect(action).toEqual({
        type: types.CHANGE_SPEEDS_INDEX,
        payload: "+",
      });
    });

    it("should create a CHANGE_SPEEDS_INDEX action with - direction", () => {
      const action = actions.changeSpeedsIndex("-");

      expect(action).toEqual({
        type: types.CHANGE_SPEEDS_INDEX,
        payload: "-",
      });
    });
  });
});

// ============================================================================
// REDUCER
// ============================================================================

describe("Player Reducer", () => {
  describe("Initial State", () => {
    it("should return the clean store as initial state", () => {
      const state = playerReducer(undefined, { type: "@@INIT" } as any);

      expect(state).toEqual(playerCleanStore);
      expect(state.playing).toBe(false);
      expect(state.muted).toBe(true);
      expect(state.volume).toBe(0.8);
      expect(state.speedsIndex).toBe(5);
      expect(state.playbackRate).toBe(1.0);
    });
  });

  describe("UPDATE_PLAYER_SESSION", () => {
    it("should merge new player state with current state", () => {
      const initialState = {
        ...playerCleanStore,
        volume: 0.5,
        playing: false,
      };

      const newPartialState: types.MediaPlayerState = {
        ...playerCleanStore,
        playing: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.UPDATE_PLAYER_SESSION,
        payload: newPartialState,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(true);
    });
  });

  describe("SET_URL", () => {
    it("should reset to clean store with new URL", () => {
      const initialState = {
        ...playerCleanStore,
        playing: true,
        volume: 0.5,
        duration: 120,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_URL,
        payload: { blobURL: "blob:http://example.com/video", timelineIndex: 1 },
      };

      const newState = playerReducer(initialState, action);

      expect(newState.url).toBe("blob:http://example.com/video");
      expect(newState.playing).toBe(false); // Reset to clean store
      expect(newState.volume).toBe(0.8); // Reset to clean store
      expect(newState.duration).toBe(0); // Reset to clean store
    });
  });

  describe("TOGGLE_PLAY", () => {
    it("should toggle playing from false to true when no payload", () => {
      const initialState = {
        ...playerCleanStore,
        playing: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_PLAY,
        payload: undefined,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(true);
    });

    it("should toggle playing from true to false when no payload", () => {
      const initialState = {
        ...playerCleanStore,
        playing: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_PLAY,
        payload: undefined,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(false);
    });

    it("should use payload value when provided", () => {
      const initialState = {
        ...playerCleanStore,
        playing: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_PLAY,
        payload: true,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(true);
    });
  });

  describe("STOP_PLAYING", () => {
    it("should stop playing and set URL to none", () => {
      const initialState = {
        ...playerCleanStore,
        playing: true,
        url: "blob:http://example.com/video",
      };

      const action: types.PlayerActionTypes = {
        type: types.STOP_PLAYING,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(false);
      expect(newState.url).toBe("none");
    });
  });

  describe("TOGGLE_LOOP", () => {
    it("should toggle loop from false to true", () => {
      const initialState = {
        ...playerCleanStore,
        loop: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_LOOP,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.loop).toBe(true);
    });

    it("should toggle loop from true to false", () => {
      const initialState = {
        ...playerCleanStore,
        loop: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_LOOP,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.loop).toBe(false);
    });
  });

  describe("ON_ENDED", () => {
    it("should set playing to false when loop is disabled", () => {
      const initialState = {
        ...playerCleanStore,
        playing: true,
        loop: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_ENDED,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(false);
    });

    it("should keep playing true when loop is enabled", () => {
      const initialState = {
        ...playerCleanStore,
        playing: true,
        loop: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_ENDED,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playing).toBe(true);
    });
  });

  describe("ON_READY", () => {
    it("should set ready to true", () => {
      const initialState = {
        ...playerCleanStore,
        ready: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_READY,
        payload: true,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.ready).toBe(true);
    });

    it("should set ready to false", () => {
      const initialState = {
        ...playerCleanStore,
        ready: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_READY,
        payload: false,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.ready).toBe(false);
    });
  });

  describe("ON_PROGRESS", () => {
    it("should update progress when not seeking", () => {
      const initialState = {
        ...playerCleanStore,
        seeking: false,
        played: 0,
        loaded: 0,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_PROGRESS,
        payload: { played: 0.5, loaded: 0.8 },
      };

      const newState = playerReducer(initialState, action);

      expect(newState.played).toBe(0.5);
      expect(newState.loaded).toBe(0.8);
    });

    it("should NOT update progress when seeking", () => {
      const initialState = {
        ...playerCleanStore,
        seeking: true,
        played: 0.3,
        loaded: 0.5,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_PROGRESS,
        payload: { played: 0.6, loaded: 0.9 },
      };

      const newState = playerReducer(initialState, action);

      // State should remain unchanged
      expect(newState.played).toBe(0.3);
      expect(newState.loaded).toBe(0.5);
    });

    it("should return unchanged state when payload is undefined", () => {
      const initialState = {
        ...playerCleanStore,
        played: 0.3,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_PROGRESS,
        payload: undefined,
      };

      const newState = playerReducer(initialState, action);

      expect(newState).toEqual(initialState);
    });
  });

  describe("SET_DURATION", () => {
    it("should update duration", () => {
      const initialState = {
        ...playerCleanStore,
        duration: 0,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_DURATION,
        payload: 120.5,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.duration).toBe(120.5);
    });
  });

  describe("SET_PLAYBACK_RATE", () => {
    it("should update playback rate within valid range", () => {
      const initialState = {
        ...playerCleanStore,
        playbackRate: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_PLAYBACK_RATE,
        payload: 2.0,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playbackRate).toBe(2.0);
    });

    it("should clamp playback rate to max 14.5", () => {
      const initialState = {
        ...playerCleanStore,
        playbackRate: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_PLAYBACK_RATE,
        payload: 20.0, // Above max
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playbackRate).toBe(14.5);
    });

    it("should clamp playback rate to min 0.2", () => {
      const initialState = {
        ...playerCleanStore,
        playbackRate: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_PLAYBACK_RATE,
        payload: 0.1, // Below min
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playbackRate).toBe(0.2);
    });
  });

  describe("SET_PLAYBACK_MULTIPLIER", () => {
    it("should update playback multiplier", () => {
      const initialState = {
        ...playerCleanStore,
        playbackMultiplier: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_PLAYBACK_MULTIPLIER,
        payload: 1.5,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.playbackMultiplier).toBe(1.5);
    });
  });

  describe("TOGGLE_MUTED", () => {
    it("should toggle muted from true to false", () => {
      const initialState = {
        ...playerCleanStore,
        muted: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_MUTED,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.muted).toBe(false);
    });

    it("should toggle muted from false to true", () => {
      const initialState = {
        ...playerCleanStore,
        muted: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.TOGGLE_MUTED,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.muted).toBe(true);
    });
  });

  describe("ON_SEEK_MOUSE_DOWN", () => {
    it("should set seeking to true", () => {
      const initialState = {
        ...playerCleanStore,
        seeking: false,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_SEEK_MOUSE_DOWN,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.seeking).toBe(true);
    });
  });

  describe("ON_SEEK_MOUSE_UP", () => {
    it("should set seeking to false", () => {
      const initialState = {
        ...playerCleanStore,
        seeking: true,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_SEEK_MOUSE_UP,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.seeking).toBe(false);
    });
  });

  describe("ON_SEEK_CHANGE", () => {
    it("should update played position", () => {
      const initialState = {
        ...playerCleanStore,
        played: 0,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_SEEK_CHANGE,
        payload: 0.5,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.played).toBe(0.5);
    });
  });

  describe("ON_VOLUME_CHANGE", () => {
    it("should update volume", () => {
      const initialState = {
        ...playerCleanStore,
        volume: 0.8,
      };

      const action: types.PlayerActionTypes = {
        type: types.ON_VOLUME_CHANGE,
        payload: 0.5,
      };

      const newState = playerReducer(initialState, action);

      expect(newState.volume).toBe(0.5);
    });
  });

  describe("SET_SEEK", () => {
    it("should update seek with seconds scale", () => {
      const initialState = {
        ...playerCleanStore,
        seek: { time: -1, scale: "fraction" },
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_SEEK,
        payload: { time: 30, scale: "seconds" },
      };

      const newState = playerReducer(initialState, action);

      expect(newState.seek).toEqual({ time: 30, scale: "seconds" });
    });

    it("should update seek with fraction scale", () => {
      const initialState = {
        ...playerCleanStore,
        seek: { time: -1, scale: "fraction" },
      };

      const action: types.PlayerActionTypes = {
        type: types.SET_SEEK,
        payload: { time: 0.5, scale: "fraction" },
      };

      const newState = playerReducer(initialState, action);

      expect(newState.seek).toEqual({ time: 0.5, scale: "fraction" });
    });
  });

  describe("CHANGE_SPEEDS_INDEX", () => {
    it("should increment speedsIndex and update playbackMultiplier", () => {
      const initialState = {
        ...playerCleanStore,
        speedsIndex: 5, // starts at 1.0 (speeds[5] = 1)
        playbackMultiplier: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.CHANGE_SPEEDS_INDEX,
        payload: "+",
      };

      const newState = playerReducer(initialState, action);

      expect(newState.speedsIndex).toBe(6);
      expect(newState.playbackMultiplier).toBe(speeds[6]); // 1.25
    });

    it("should decrement speedsIndex and update playbackMultiplier", () => {
      const initialState = {
        ...playerCleanStore,
        speedsIndex: 5, // starts at 1.0 (speeds[5] = 1)
        playbackMultiplier: 1.0,
      };

      const action: types.PlayerActionTypes = {
        type: types.CHANGE_SPEEDS_INDEX,
        payload: "-",
      };

      const newState = playerReducer(initialState, action);

      expect(newState.speedsIndex).toBe(4);
      expect(newState.playbackMultiplier).toBe(speeds[4]); // 0.8
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Player Store Integration", () => {
  it("should handle a complete playback workflow", () => {
    let state = playerCleanStore;

    // Load video URL
    state = playerReducer(
      state,
      actions.setURL("blob:http://example.com/video", 0),
    );
    expect(state.url).toBe("blob:http://example.com/video");
    expect(state.playing).toBe(false);

    // Mark as ready
    state = playerReducer(state, actions.onReady(true));
    expect(state.ready).toBe(true);

    // Start playback
    state = playerReducer(state, actions.togglePlay(true));
    expect(state.playing).toBe(true);

    // Adjust volume
    state = playerReducer(state, actions.onVolumeChange(0.6));
    expect(state.volume).toBe(0.6);

    // Speed up playback
    state = playerReducer(state, actions.changeSpeedsIndex("+"));
    expect(state.speedsIndex).toBe(6);
    expect(state.playbackMultiplier).toBe(1.25);

    // Stop playback
    state = playerReducer(state, actions.stopPlaying());
    expect(state.playing).toBe(false);
    expect(state.url).toBe("none");
  });

  it("should handle seeking workflow", () => {
    let state = playerCleanStore;

    // Start playing
    state = playerReducer(state, actions.togglePlay(true));
    expect(state.playing).toBe(true);

    // Start seeking
    state = playerReducer(state, actions.onSeekMouseDown());
    expect(state.seeking).toBe(true);

    // Try to update progress while seeking (should be ignored)
    const progressAction: types.PlayerActionTypes = {
      type: types.ON_PROGRESS,
      payload: { played: 0.9, loaded: 1.0 },
    };
    state = playerReducer(state, progressAction);
    expect(state.played).toBe(0); // Should not update while seeking

    // Update seek position
    state = playerReducer(state, actions.onSeekChange(0.5));
    expect(state.played).toBe(0.5);

    // Finish seeking
    state = playerReducer(state, actions.onSeekMouseUp());
    expect(state.seeking).toBe(false);

    // Now progress updates should work
    state = playerReducer(state, progressAction);
    expect(state.played).toBe(0.9);
  });

  it("should handle loop mode correctly", () => {
    let state = playerCleanStore;

    // Start playing without loop
    state = playerReducer(state, actions.togglePlay(true));
    expect(state.playing).toBe(true);
    expect(state.loop).toBe(false);

    // Video ends - should stop playing
    state = playerReducer(state, actions.onEnded());
    expect(state.playing).toBe(false);

    // Enable loop and play again
    state = playerReducer(state, actions.toggleLoop());
    state = playerReducer(state, actions.togglePlay(true));
    expect(state.loop).toBe(true);
    expect(state.playing).toBe(true);

    // Video ends with loop - should keep playing
    state = playerReducer(state, actions.onEnded());
    expect(state.playing).toBe(true);
  });

  it("should handle speed adjustments", () => {
    let state = playerCleanStore;

    // Start at default speed (index 5 = 1.0x)
    expect(state.speedsIndex).toBe(5);
    expect(state.playbackMultiplier).toBe(1.0);

    // Increase speed multiple times
    state = playerReducer(state, actions.changeSpeedsIndex("+"));
    state = playerReducer(state, actions.changeSpeedsIndex("+"));
    expect(state.speedsIndex).toBe(7);
    expect(state.playbackMultiplier).toBe(speeds[7]); // 1.5

    // Decrease speed
    state = playerReducer(state, actions.changeSpeedsIndex("-"));
    expect(state.speedsIndex).toBe(6);
    expect(state.playbackMultiplier).toBe(speeds[6]); // 1.25

    // Also test direct playback rate setting
    state = playerReducer(state, actions.setPlaybackRate(3.0));
    expect(state.playbackRate).toBe(3.0);
  });

  it("should maintain immutability through state transitions", () => {
    const initialState = playerCleanStore;

    // Apply multiple actions
    let state = playerReducer(
      initialState,
      actions.setURL("blob:http://example.com/video", 0),
    );
    state = playerReducer(state, actions.togglePlay(true));
    state = playerReducer(state, actions.onVolumeChange(0.5));
    state = playerReducer(state, actions.toggleMuted());

    // Verify original state unchanged
    expect(initialState.url).toBe("");
    expect(initialState.playing).toBe(false);
    expect(initialState.volume).toBe(0.8);
    expect(initialState.muted).toBe(true);

    // Verify new state has all changes
    expect(state.url).toBe("blob:http://example.com/video");
    expect(state.playing).toBe(true);
    expect(state.volume).toBe(0.5);
    expect(state.muted).toBe(false);
  });
});
