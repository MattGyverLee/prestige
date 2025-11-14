/**
 * System Redux Store Tests
 *
 * Comprehensive test suite for the system store, which manages:
 * - Application-level state (login, session)
 * - UI component dimensions for responsive layout
 * - User information
 *
 * Test coverage:
 * - Initial state
 * - Action creators
 * - Reducer state transitions
 * - Dimension updates for all components
 * - Session management
 * - Integration scenarios
 */

import { describe, it, expect } from "vitest";
import * as actions from "../actions";
import * as types from "../types";
import { systemReducer, systemCleanStore } from "../reducers";

// ============================================================================
// INITIAL STATE TESTS
// ============================================================================

describe("System Store Initial State", () => {
  it("should have correct initial clean store structure", () => {
    expect(systemCleanStore).toEqual({
      clicks: 0,
      loggedIn: false,
      session: "",
      userName: "",
      dimensions: {
        AppDetails: { width: -1, height: -1 },
        AppPlayer: { width: -1, height: -1 },
        AppDeeJay: { width: -1, height: -1 },
        AppBody: { width: -1, height: -1 },
        AnnotDiv: { width: -1, height: -1 },
        FileList: { width: -1, height: -1 },
      },
    });
  });

  it("should initialize with logged out state", () => {
    expect(systemCleanStore.loggedIn).toBe(false);
    expect(systemCleanStore.userName).toBe("");
    expect(systemCleanStore.session).toBe("");
  });

  it("should initialize with zero clicks", () => {
    expect(systemCleanStore.clicks).toBe(0);
  });

  it("should initialize all dimensions to -1", () => {
    const dims = systemCleanStore.dimensions;
    Object.values(dims).forEach((dim) => {
      expect(dim.width).toBe(-1);
      expect(dim.height).toBe(-1);
    });
  });

  it("should have all expected dimension keys", () => {
    const expectedKeys = [
      "AppDetails",
      "AppPlayer",
      "AppDeeJay",
      "AppBody",
      "AnnotDiv",
      "FileList",
    ];
    expect(Object.keys(systemCleanStore.dimensions)).toEqual(expectedKeys);
  });
});

// ============================================================================
// ACTION CREATOR TESTS
// ============================================================================

describe("System Action Creators", () => {
  describe("updateDimensions", () => {
    it("should create UPDATE_DIMENSIONS action for AppDetails", () => {
      const payload: types.DimensionObject = {
        width: 1920,
        height: 1080,
        target: "AppDetails",
      };
      const action = actions.updateDimensions(payload);

      expect(action).toEqual({
        type: types.UPDATE_DIMENSIONS,
        payload,
      });
    });

    it("should create UPDATE_DIMENSIONS action for AppPlayer", () => {
      const payload: types.DimensionObject = {
        width: 800,
        height: 600,
        target: "AppPlayer",
      };
      const action = actions.updateDimensions(payload);

      expect(action.type).toBe(types.UPDATE_DIMENSIONS);
      expect(action.payload).toEqual(payload);
    });

    it("should create UPDATE_DIMENSIONS action for AppDeeJay", () => {
      const action = actions.updateDimensions({
        width: 1200,
        height: 400,
        target: "AppDeeJay",
      });

      expect(action.type).toBe(types.UPDATE_DIMENSIONS);
      expect(action.payload.target).toBe("AppDeeJay");
    });

    it("should create UPDATE_DIMENSIONS action for all component types", () => {
      const components = [
        "AppDetails",
        "AppPlayer",
        "AppDeeJay",
        "AppBody",
        "AnnotDiv",
        "FileList",
      ];

      components.forEach((component) => {
        const action = actions.updateDimensions({
          width: 100,
          height: 200,
          target: component,
        });

        expect(action.type).toBe(types.UPDATE_DIMENSIONS);
        expect(action.payload.target).toBe(component);
      });
    });
  });

  describe("sysHardResetApp", () => {
    it("should create HARD_RESET_APP action", () => {
      const action = actions.sysHardResetApp("test reset");

      expect(action).toEqual({
        type: types.HARD_RESET_APP,
        payload: "test reset",
      });
    });

    it("should accept any string payload", () => {
      const action = actions.sysHardResetApp("close_project");
      expect(action.payload).toBe("close_project");
    });
  });

  describe("updateSession", () => {
    it("should create UPDATE_SESSION action with full state", () => {
      const newState: types.SystemState = {
        clicks: 5,
        loggedIn: true,
        session: "abc123",
        userName: "testuser",
        dimensions: systemCleanStore.dimensions,
      };
      const action = actions.updateSession(newState);

      expect(action).toEqual({
        type: types.UPDATE_SESSION,
        payload: newState,
      });
    });

    it("should create UPDATE_SESSION action with partial state", () => {
      const newState: types.SystemState = {
        ...systemCleanStore,
        userName: "john_doe",
        loggedIn: true,
      };
      const action = actions.updateSession(newState);

      expect(action.type).toBe(types.UPDATE_SESSION);
      expect(action.payload.userName).toBe("john_doe");
      expect(action.payload.loggedIn).toBe(true);
    });
  });
});

// ============================================================================
// REDUCER TESTS - UPDATE_SESSION
// ============================================================================

describe("System Reducer - UPDATE_SESSION", () => {
  it("should merge new session state", () => {
    const newState: types.SystemState = {
      ...systemCleanStore,
      userName: "alice",
      loggedIn: true,
      session: "session_123",
    };
    const action = actions.updateSession(newState);
    const state = systemReducer(systemCleanStore, action);

    expect(state.userName).toBe("alice");
    expect(state.loggedIn).toBe(true);
    expect(state.session).toBe("session_123");
  });

  it("should update click count", () => {
    const newState: types.SystemState = {
      ...systemCleanStore,
      clicks: 42,
    };
    const action = actions.updateSession(newState);
    const state = systemReducer(systemCleanStore, action);

    expect(state.clicks).toBe(42);
  });

  it("should preserve dimensions when not changed", () => {
    const newState: types.SystemState = {
      ...systemCleanStore,
      userName: "bob",
    };
    const action = actions.updateSession(newState);
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions).toEqual(systemCleanStore.dimensions);
  });

  it("should update dimensions when provided", () => {
    const newDimensions = {
      ...systemCleanStore.dimensions,
      AppPlayer: { width: 1024, height: 768 },
    };
    const newState: types.SystemState = {
      ...systemCleanStore,
      dimensions: newDimensions,
    };
    const action = actions.updateSession(newState);
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppPlayer).toEqual({ width: 1024, height: 768 });
  });
});

// ============================================================================
// REDUCER TESTS - UPDATE_DIMENSIONS
// ============================================================================

describe("System Reducer - UPDATE_DIMENSIONS", () => {
  it("should update AppDetails dimensions", () => {
    const action = actions.updateDimensions({
      width: 1920,
      height: 1080,
      target: "AppDetails",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppDetails).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("should update AppPlayer dimensions", () => {
    const action = actions.updateDimensions({
      width: 800,
      height: 600,
      target: "AppPlayer",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppPlayer).toEqual({ width: 800, height: 600 });
  });

  it("should update AppDeeJay dimensions", () => {
    const action = actions.updateDimensions({
      width: 1200,
      height: 400,
      target: "AppDeeJay",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppDeeJay).toEqual({ width: 1200, height: 400 });
  });

  it("should update AppBody dimensions", () => {
    const action = actions.updateDimensions({
      width: 1600,
      height: 900,
      target: "AppBody",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppBody).toEqual({ width: 1600, height: 900 });
  });

  it("should update AnnotDiv dimensions", () => {
    const action = actions.updateDimensions({
      width: 400,
      height: 300,
      target: "AnnotDiv",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AnnotDiv).toEqual({ width: 400, height: 300 });
  });

  it("should update FileList dimensions", () => {
    const action = actions.updateDimensions({
      width: 300,
      height: 500,
      target: "FileList",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.FileList).toEqual({ width: 300, height: 500 });
  });

  it("should preserve other dimensions when updating one", () => {
    const action = actions.updateDimensions({
      width: 1920,
      height: 1080,
      target: "AppPlayer",
    });
    const state = systemReducer(systemCleanStore, action);

    expect(state.dimensions.AppDetails).toEqual({ width: -1, height: -1 });
    expect(state.dimensions.AppDeeJay).toEqual({ width: -1, height: -1 });
    expect(state.dimensions.AppBody).toEqual({ width: -1, height: -1 });
  });

  it("should preserve user session when updating dimensions", () => {
    const initialState: types.SystemState = {
      ...systemCleanStore,
      userName: "alice",
      loggedIn: true,
      session: "test_session",
    };
    const action = actions.updateDimensions({
      width: 1024,
      height: 768,
      target: "AppPlayer",
    });
    const state = systemReducer(initialState, action);

    expect(state.userName).toBe("alice");
    expect(state.loggedIn).toBe(true);
    expect(state.session).toBe("test_session");
  });

  it("should handle unknown dimension target gracefully", () => {
    const action = actions.updateDimensions({
      width: 500,
      height: 500,
      target: "UnknownComponent",
    });
    const state = systemReducer(systemCleanStore, action);

    // Should return unchanged state for unknown target
    expect(state).toEqual(systemCleanStore);
  });
});

// ============================================================================
// REDUCER TESTS - DEFAULT CASE
// ============================================================================

describe("System Reducer - Default Case", () => {
  it("should return unchanged state for unknown action", () => {
    const unknownAction = { type: "UNKNOWN_ACTION" } as any;
    const state = systemReducer(systemCleanStore, unknownAction);

    expect(state).toEqual(systemCleanStore);
  });

  it("should use clean store as default state", () => {
    const action = actions.updateDimensions({
      width: 100,
      height: 100,
      target: "AppPlayer",
    });
    const state = systemReducer(undefined, action);

    expect(state.userName).toBe("");
    expect(state.loggedIn).toBe(false);
    expect(state.clicks).toBe(0);
  });
});

// ============================================================================
// IMMUTABILITY TESTS
// ============================================================================

describe("System Store Immutability", () => {
  it("should not mutate original state on UPDATE_SESSION", () => {
    const originalState = { ...systemCleanStore };
    const action = actions.updateSession({
      ...systemCleanStore,
      userName: "test",
    });

    systemReducer(systemCleanStore, action);

    expect(systemCleanStore).toEqual(originalState);
  });

  it("should not mutate original state on UPDATE_DIMENSIONS", () => {
    const originalState = { ...systemCleanStore };
    const action = actions.updateDimensions({
      width: 1920,
      height: 1080,
      target: "AppPlayer",
    });

    systemReducer(systemCleanStore, action);

    expect(systemCleanStore).toEqual(originalState);
  });

  it("should create new state object on each update", () => {
    const action1 = actions.updateDimensions({
      width: 800,
      height: 600,
      target: "AppPlayer",
    });
    const state1 = systemReducer(systemCleanStore, action1);

    const action2 = actions.updateDimensions({
      width: 1024,
      height: 768,
      target: "AppDeeJay",
    });
    const state2 = systemReducer(state1, action2);

    expect(state2).not.toBe(state1);
    expect(state2.dimensions).not.toBe(state1.dimensions);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("System Store Integration", () => {
  it("should handle complete session workflow", () => {
    let state = systemCleanStore;

    // User logs in
    state = systemReducer(
      state,
      actions.updateSession({
        ...state,
        userName: "alice",
        loggedIn: true,
        session: "abc123",
      }),
    );
    expect(state.loggedIn).toBe(true);
    expect(state.userName).toBe("alice");

    // Update dimensions
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1920,
        height: 1080,
        target: "AppPlayer",
      }),
    );
    expect(state.dimensions.AppPlayer).toEqual({ width: 1920, height: 1080 });

    // Still logged in after dimension update
    expect(state.loggedIn).toBe(true);
    expect(state.userName).toBe("alice");
  });

  it("should handle multiple dimension updates", () => {
    let state = systemCleanStore;

    // Update AppPlayer
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 800,
        height: 600,
        target: "AppPlayer",
      }),
    );

    // Update AppDeeJay
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1200,
        height: 400,
        target: "AppDeeJay",
      }),
    );

    // Update AppBody
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1600,
        height: 900,
        target: "AppBody",
      }),
    );

    expect(state.dimensions.AppPlayer).toEqual({ width: 800, height: 600 });
    expect(state.dimensions.AppDeeJay).toEqual({ width: 1200, height: 400 });
    expect(state.dimensions.AppBody).toEqual({ width: 1600, height: 900 });
    // Unchanged dimensions should still be -1
    expect(state.dimensions.AppDetails).toEqual({ width: -1, height: -1 });
  });

  it("should maintain state through mixed updates", () => {
    let state = systemCleanStore;

    // Session update
    state = systemReducer(
      state,
      actions.updateSession({
        ...state,
        userName: "bob",
        clicks: 5,
      }),
    );

    // Dimension update
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1024,
        height: 768,
        target: "AnnotDiv",
      }),
    );

    // Another session update
    state = systemReducer(
      state,
      actions.updateSession({
        ...state,
        clicks: 10,
        loggedIn: true,
      }),
    );

    expect(state.userName).toBe("bob");
    expect(state.clicks).toBe(10);
    expect(state.loggedIn).toBe(true);
    expect(state.dimensions.AnnotDiv).toEqual({ width: 1024, height: 768 });
  });

  it("should handle responsive window resize scenario", () => {
    let state = systemCleanStore;

    // Initial layout
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1920,
        height: 1080,
        target: "AppBody",
      }),
    );
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 800,
        height: 600,
        target: "AppPlayer",
      }),
    );
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1200,
        height: 400,
        target: "AppDeeJay",
      }),
    );

    // Window resized
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 1440,
        height: 900,
        target: "AppBody",
      }),
    );
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 600,
        height: 450,
        target: "AppPlayer",
      }),
    );
    state = systemReducer(
      state,
      actions.updateDimensions({
        width: 900,
        height: 300,
        target: "AppDeeJay",
      }),
    );

    expect(state.dimensions.AppBody).toEqual({ width: 1440, height: 900 });
    expect(state.dimensions.AppPlayer).toEqual({ width: 600, height: 450 });
    expect(state.dimensions.AppDeeJay).toEqual({ width: 900, height: 300 });
  });
});
