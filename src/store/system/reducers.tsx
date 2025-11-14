/**
 * System Redux Reducer
 *
 * This module contains the reducer and initial state for the system store,
 * which manages application-level state including authentication, session,
 * and UI component dimensions.
 *
 * The reducer handles:
 * - Session state updates (login, user info, click tracking)
 * - Component dimension updates for responsive layout
 * - Application lifecycle events
 *
 * @module store/system/reducers
 */

import * as types from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Initial dimension value indicating component not yet measured
 */
const UNMEASURED_DIMENSION = -1;

// ============================================================================
// INITIAL STATE
// ============================================================================

/**
 * Initial clean state for the system store
 *
 * This represents a fresh, uninitialized state before user login or
 * component measurement:
 * - No active user session (logged out)
 * - Zero clicks tracked
 * - All component dimensions unmeasured (-1)
 *
 * Used for:
 * - Initial application load
 * - Post-logout state
 * - Hard app reset
 */
export const systemCleanStore: types.SystemState = {
  /**
   * No clicks tracked initially
   */
  clicks: 0,

  /**
   * User not logged in by default
   */
  loggedIn: false,

  /**
   * No active session
   */
  session: "",

  /**
   * No user logged in
   */
  userName: "",

  /**
   * All UI component dimensions start unmeasured
   * Components will update their dimensions on mount/resize
   */
  dimensions: {
    AppDetails: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
    AppPlayer: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
    AppDeeJay: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
    AppBody: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
    AnnotDiv: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
    FileList: {
      width: UNMEASURED_DIMENSION,
      height: UNMEASURED_DIMENSION,
    },
  },
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * System reducer function
 *
 * Handles all actions related to system state management, session updates,
 * and dimension tracking. Maintains immutability by always returning a
 * new state object.
 *
 * @param {SystemState} state - Current system state (defaults to clean store)
 * @param {SystemActionTypes} action - Action to process
 * @returns {SystemState} New state after applying the action
 */
export function systemReducer(
  state = systemCleanStore,
  action: types.SystemActionTypes,
): types.SystemState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // SESSION MANAGEMENT
    // -------------------------------------------------------------------------

    case types.UPDATE_SESSION: {
      // Merge new session state with current state
      // This allows partial updates to session data
      return {
        ...state,
        ...action.payload,
      };
    }

    // -------------------------------------------------------------------------
    // DIMENSION UPDATES
    // -------------------------------------------------------------------------

    case types.UPDATE_DIMENSIONS: {
      // Update dimensions for a specific UI component
      // Nested switch to handle different component targets
      switch (action.payload.target) {
        case "AppDetails": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppDetails: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        case "AppPlayer": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppPlayer: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        case "AppDeeJay": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppDeeJay: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        case "AppBody": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AppBody: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        case "AnnotDiv": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              AnnotDiv: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        case "FileList": {
          return {
            ...state,
            dimensions: {
              ...state.dimensions,
              FileList: {
                width: action.payload.width,
                height: action.payload.height,
              },
            },
          };
        }

        default: {
          // Unknown component target - return unchanged state
          return state;
        }
      }
    }

    // -------------------------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------------------------

    default: {
      return state;
    }
  }
}
