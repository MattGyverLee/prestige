/**
 * DeeJay Redux Store Tests
 *
 * Tests focus on the public API contract (inputs → outputs):
 * - Action creators: Input parameters → Output action objects
 * - Reducer: (state, action) → new state
 *
 * These tests verify behavior without relying on implementation details,
 * so they remain valid even if the code is restructured.
 */

import { describe, it, expect } from "vitest";
import * as actions from "../actions";
import { deeJayReducer, deeJayCleanStore } from "../reducers";
import * as types from "../types";

// ============================================================================
// ACTION CREATOR TESTS
// ============================================================================

describe("DeeJay Action Creators", () => {
  describe("resetDeeJay", () => {
    it("should create a RESET_DEE_JAY action", () => {
      // Input: none
      // Output: action object with correct type
      const action = actions.resetDeeJay();

      expect(action).toEqual({
        type: types.RESET_DEE_JAY,
      });
    });
  });

  describe("setWSVolume", () => {
    it("should create a SET_WS_VOLUME action with provided index and volume", () => {
      // Input: idx=1, volume=0.5
      // Output: action object with correct type and payload
      const action = actions.setWSVolume(1, 0.5);

      expect(action).toEqual({
        type: types.SET_WS_VOLUME,
        payload: { idx: 1, volume: 0.5 },
      });
    });

    it("should handle volume of 0 (muted)", () => {
      // Input: idx=0, volume=0
      const action = actions.setWSVolume(0, 0);

      expect(action.payload).toEqual({ idx: 0, volume: 0 });
    });

    it("should handle volume of 1 (full volume)", () => {
      // Input: idx=2, volume=1
      const action = actions.setWSVolume(2, 1);

      expect(action.payload).toEqual({ idx: 2, volume: 1 });
    });

    it("should handle fractional volumes", () => {
      // Input: idx=1, volume=0.75
      const action = actions.setWSVolume(1, 0.75);

      expect(action.payload.volume).toBe(0.75);
    });
  });

  describe("setDispatch", () => {
    it("should create a SET_DISPATCH action with dispatch object", () => {
      // Input: dispatch object with dispatchType
      const dispatchData: types.DeeJayDispatch = {
        dispatchType: "PLAY",
      };

      const action = actions.setDispatch(dispatchData);

      expect(action).toEqual({
        type: types.SET_DISPATCH,
        payload: dispatchData,
      });
    });

    it("should handle dispatch with all optional fields", () => {
      // Input: dispatch object with all fields populated
      const dispatchData: types.DeeJayDispatch = {
        dispatchType: "PLAY_CLIP",
        wsNum: 1,
        wsNum2: 2,
        clipStart: 0,
        clipStop: 10,
        refStart: 5,
        refStop: 15,
        loop: 3,
      };

      const action = actions.setDispatch(dispatchData);

      expect(action.payload).toEqual(dispatchData);
    });

    it("should handle dispatch with partial optional fields", () => {
      // Input: dispatch object with some optional fields
      const dispatchData: types.DeeJayDispatch = {
        dispatchType: "SEEK",
        wsNum: 0,
        clipStart: 5.5,
        clipStop: 10.5,
      };

      const action = actions.setDispatch(dispatchData);

      expect(action.payload).toEqual(dispatchData);
      expect(action.payload.wsNum2).toBeUndefined();
      expect(action.payload.loop).toBeUndefined();
    });
  });

  describe("setSubtitle", () => {
    it("should create a SET_SUBTITLE action with provided subtitle", () => {
      // Input: subtitle string
      // Output: action object with correct type and payload
      const action = actions.setSubtitle("Test subtitle text");

      expect(action).toEqual({
        type: types.SET_SUBTITLE,
        payload: "Test subtitle text",
      });
    });

    it("should handle empty subtitle", () => {
      // Input: empty string
      const action = actions.setSubtitle("");

      expect(action.payload).toBe("");
    });

    it("should handle multi-line subtitle", () => {
      // Input: multi-line string
      const subtitle = "Line 1\nLine 2\nLine 3";
      const action = actions.setSubtitle(subtitle);

      expect(action.payload).toBe(subtitle);
    });
  });
});

// ============================================================================
// REDUCER TESTS
// ============================================================================

describe("DeeJay Reducer", () => {
  describe("Initial State", () => {
    it("should return the initial state when called with undefined", () => {
      // Input: undefined state, unknown action
      // Output: clean initial state
      const action = { type: "UNKNOWN_ACTION" } as any;
      const state = deeJayReducer(undefined, action);

      expect(state).toEqual(deeJayCleanStore);
      expect(state).toEqual({
        volumes: [1, 0, 0],
        dispatch: { dispatchType: "" },
        subtitle: "",
      });
    });
  });

  describe("RESET_DEE_JAY", () => {
    it("should reset state to clean store from any state", () => {
      // Input: modified state + RESET action
      // Output: clean initial state
      const modifiedState: types.DeeJayState = {
        volumes: [0.5, 0.7, 0.3],
        dispatch: { dispatchType: "PLAY", wsNum: 1 },
        subtitle: "Some subtitle",
      };

      const action = actions.resetDeeJay();
      const newState = deeJayReducer(modifiedState, action);

      expect(newState).toEqual(deeJayCleanStore);
      expect(newState).toEqual({
        volumes: [1, 0, 0],
        dispatch: { dispatchType: "" },
        subtitle: "",
      });
    });

    it("should not mutate the original state object", () => {
      // Input: state object
      // Output: new state object (immutability check)
      const originalState = { ...deeJayCleanStore };
      const action = actions.resetDeeJay();
      const newState = deeJayReducer(originalState, action);

      expect(newState).not.toBe(originalState); // Different reference
      expect(newState).toEqual(originalState); // Same values
    });
  });

  describe("SET_WS_VOLUME", () => {
    it("should update volume at specified index", () => {
      // Input: clean state + SET_WS_VOLUME action for index 1
      // Output: state with volume[1] updated
      const action = actions.setWSVolume(1, 0.7);
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.volumes).toEqual([1, 0.7, 0]);
    });

    it("should update volume at index 0", () => {
      // Input: SET_WS_VOLUME action for index 0
      const action = actions.setWSVolume(0, 0.5);
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.volumes).toEqual([0.5, 0, 0]);
    });

    it("should update volume at index 2", () => {
      // Input: SET_WS_VOLUME action for index 2
      const action = actions.setWSVolume(2, 0.3);
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.volumes).toEqual([1, 0, 0.3]);
    });

    it("should only update the specified index, leaving others unchanged", () => {
      // Input: state with custom volumes + SET_WS_VOLUME for middle index
      const startState: types.DeeJayState = {
        volumes: [0.8, 0.5, 0.2],
        dispatch: { dispatchType: "" },
        subtitle: "",
      };

      const action = actions.setWSVolume(1, 0.9);
      const newState = deeJayReducer(startState, action);

      expect(newState.volumes[0]).toBe(0.8); // Unchanged
      expect(newState.volumes[1]).toBe(0.9); // Updated
      expect(newState.volumes[2]).toBe(0.2); // Unchanged
    });

    it("should preserve other state properties", () => {
      // Input: state with dispatch and subtitle set
      const startState: types.DeeJayState = {
        volumes: [1, 0, 0],
        dispatch: { dispatchType: "PLAY", wsNum: 1 },
        subtitle: "Test subtitle",
      };

      const action = actions.setWSVolume(0, 0.5);
      const newState = deeJayReducer(startState, action);

      expect(newState.dispatch).toEqual(startState.dispatch);
      expect(newState.subtitle).toBe(startState.subtitle);
    });

    it("should not mutate the original state", () => {
      // Input: state object
      // Output: new state object (immutability check)
      const originalState = { ...deeJayCleanStore };
      const action = actions.setWSVolume(1, 0.5);
      const newState = deeJayReducer(originalState, action);

      expect(newState).not.toBe(originalState);
      expect(originalState.volumes).toEqual([1, 0, 0]); // Original unchanged
    });
  });

  describe("SET_DISPATCH", () => {
    it("should update dispatch with new dispatch object", () => {
      // Input: clean state + SET_DISPATCH action
      // Output: state with updated dispatch
      const newDispatch: types.DeeJayDispatch = {
        dispatchType: "PLAY",
        wsNum: 1,
      };

      const action = actions.setDispatch(newDispatch);
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.dispatch).toEqual(newDispatch);
    });

    it("should handle complex dispatch objects", () => {
      // Input: dispatch with all fields populated
      const newDispatch: types.DeeJayDispatch = {
        dispatchType: "PLAY_CLIP",
        wsNum: 0,
        wsNum2: 1,
        clipStart: 5.5,
        clipStop: 10.8,
        refStart: 3.2,
        refStop: 12.1,
        loop: 5,
      };

      const action = actions.setDispatch(newDispatch);
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.dispatch).toEqual(newDispatch);
    });

    it("should replace previous dispatch completely", () => {
      // Input: state with existing dispatch + new dispatch
      const startState: types.DeeJayState = {
        volumes: [1, 0, 0],
        dispatch: {
          dispatchType: "PAUSE",
          wsNum: 2,
          clipStart: 1,
          clipStop: 5,
        },
        subtitle: "",
      };

      const newDispatch: types.DeeJayDispatch = {
        dispatchType: "STOP",
      };

      const action = actions.setDispatch(newDispatch);
      const newState = deeJayReducer(startState, action);

      expect(newState.dispatch).toEqual(newDispatch);
      expect(newState.dispatch.wsNum).toBeUndefined();
      expect(newState.dispatch.clipStart).toBeUndefined();
    });

    it("should preserve other state properties", () => {
      // Input: state with volumes and subtitle set
      const startState: types.DeeJayState = {
        volumes: [0.5, 0.7, 0.3],
        dispatch: { dispatchType: "" },
        subtitle: "Test subtitle",
      };

      const newDispatch: types.DeeJayDispatch = {
        dispatchType: "PLAY",
      };

      const action = actions.setDispatch(newDispatch);
      const newState = deeJayReducer(startState, action);

      expect(newState.volumes).toEqual(startState.volumes);
      expect(newState.subtitle).toBe(startState.subtitle);
    });
  });

  describe("SET_SUBTITLE", () => {
    it("should update subtitle with new text", () => {
      // Input: clean state + SET_SUBTITLE action
      // Output: state with updated subtitle
      const action = actions.setSubtitle("New subtitle text");
      const newState = deeJayReducer(deeJayCleanStore, action);

      expect(newState.subtitle).toBe("New subtitle text");
    });

    it("should replace existing subtitle", () => {
      // Input: state with existing subtitle + new subtitle
      const startState: types.DeeJayState = {
        volumes: [1, 0, 0],
        dispatch: { dispatchType: "" },
        subtitle: "Old subtitle",
      };

      const action = actions.setSubtitle("New subtitle");
      const newState = deeJayReducer(startState, action);

      expect(newState.subtitle).toBe("New subtitle");
    });

    it("should handle empty string subtitle", () => {
      // Input: SET_SUBTITLE with empty string
      const startState: types.DeeJayState = {
        volumes: [1, 0, 0],
        dispatch: { dispatchType: "" },
        subtitle: "Some text",
      };

      const action = actions.setSubtitle("");
      const newState = deeJayReducer(startState, action);

      expect(newState.subtitle).toBe("");
    });

    it("should preserve other state properties", () => {
      // Input: state with volumes and dispatch set
      const startState: types.DeeJayState = {
        volumes: [0.5, 0.7, 0.3],
        dispatch: { dispatchType: "PLAY", wsNum: 1 },
        subtitle: "",
      };

      const action = actions.setSubtitle("Test");
      const newState = deeJayReducer(startState, action);

      expect(newState.volumes).toEqual(startState.volumes);
      expect(newState.dispatch).toEqual(startState.dispatch);
    });
  });

  describe("Unknown Actions", () => {
    it("should return the same state for unknown action types", () => {
      // Input: state + unknown action
      // Output: same state unchanged
      const startState: types.DeeJayState = {
        volumes: [0.5, 0.7, 0.3],
        dispatch: { dispatchType: "PLAY" },
        subtitle: "Test",
      };

      const unknownAction = { type: "UNKNOWN_ACTION_TYPE" } as any;
      const newState = deeJayReducer(startState, unknownAction);

      expect(newState).toEqual(startState);
    });
  });

  describe("State Transitions (Integration)", () => {
    it("should handle multiple actions in sequence", () => {
      // Input: sequence of actions
      // Output: final state after all transformations
      let state = deeJayCleanStore;

      // Set volume for index 1
      state = deeJayReducer(state, actions.setWSVolume(1, 0.7));
      expect(state.volumes).toEqual([1, 0.7, 0]);

      // Set subtitle
      state = deeJayReducer(state, actions.setSubtitle("Test subtitle"));
      expect(state.subtitle).toBe("Test subtitle");

      // Set dispatch
      const dispatch: types.DeeJayDispatch = {
        dispatchType: "PLAY",
        wsNum: 1,
      };
      state = deeJayReducer(state, actions.setDispatch(dispatch));
      expect(state.dispatch).toEqual(dispatch);

      // Verify all changes persisted
      expect(state).toEqual({
        volumes: [1, 0.7, 0],
        dispatch: { dispatchType: "PLAY", wsNum: 1 },
        subtitle: "Test subtitle",
      });
    });

    it("should reset to clean state after modifications", () => {
      // Input: sequence ending with reset
      // Output: clean state
      let state = deeJayCleanStore;

      state = deeJayReducer(state, actions.setWSVolume(0, 0.5));
      state = deeJayReducer(state, actions.setWSVolume(1, 0.7));
      state = deeJayReducer(state, actions.setWSVolume(2, 0.3));
      state = deeJayReducer(state, actions.setSubtitle("Test"));
      state = deeJayReducer(
        state,
        actions.setDispatch({ dispatchType: "PLAY" }),
      );

      // Now reset
      state = deeJayReducer(state, actions.resetDeeJay());

      expect(state).toEqual(deeJayCleanStore);
    });
  });
});
