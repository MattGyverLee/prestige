/**
 * System Redux Type Definitions
 *
 * This module defines the types for the system store, which manages:
 * - Application-level state (login, session, user info)
 * - UI component dimensions for responsive layout
 * - Click tracking
 *
 * The system store coordinates:
 * - User authentication and session management
 * - Component resize tracking for layout calculations
 * - Global application state
 *
 * @module store/system/types
 */

import { DimensionsMap } from "../annot/types";

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * System State
 *
 * Represents global application state including user session, authentication,
 * and UI component dimensions for responsive layout management.
 */
export interface SystemState {
  /**
   * Click counter (may be used for analytics or debugging)
   */
  clicks: number;

  /**
   * Whether user is currently logged in
   */
  loggedIn: boolean;

  /**
   * Active session identifier
   * Empty string when no active session
   */
  session: string;

  /**
   * Current user's username
   * Empty string when not logged in
   */
  userName: string;

  /**
   * Map of UI component dimensions for layout calculations
   * Keys: AppDetails, AppPlayer, AppDeeJay, AppBody, AnnotDiv, FileList
   * Values: {width, height} in pixels
   */
  dimensions: DimensionsMap;
}

/**
 * Dimension Object
 *
 * Represents a dimension update for a specific UI component.
 * Used to track component sizes for responsive layout.
 */
export interface DimensionObject {
  /** Component width in pixels */
  width: number;

  /** Component height in pixels */
  height: number;

  /**
   * Target component identifier
   * Valid targets: AppDetails, AppPlayer, AppDeeJay, AppBody, AnnotDiv, FileList
   */
  target: string;
}

// ============================================================================
// ACTION TYPE CONSTANTS
// ============================================================================

/**
 * Hard reset entire application state
 */
export const HARD_RESET_APP = "HARD_RESET_APP";

/**
 * Open new folder (may not be used in system reducer)
 */
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";

/**
 * Update session with new system state
 */
export const UPDATE_SESSION = "UPDATE_SESSION";

/**
 * Update dimensions for a specific UI component
 */
export const UPDATE_DIMENSIONS = "UPDATE_DIMENSIONS";

// ============================================================================
// ACTION INTERFACES
// ============================================================================

/**
 * Hard reset application
 */
interface SysHardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

/**
 * Update UI component dimensions
 */
interface UpdateDimensions {
  type: typeof UPDATE_DIMENSIONS;
  payload: DimensionObject;
}

/**
 * Open new folder
 */
interface SysOnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}

/**
 * Update entire session state
 */
interface UpdateSessionAction {
  type: typeof UPDATE_SESSION;
  payload: SystemState;
}

// ============================================================================
// ACTION UNION TYPE
// ============================================================================

/**
 * Union of all system action types
 *
 * This type ensures type safety across all system-related actions,
 * allowing TypeScript to infer the correct payload type based on
 * the action type in reducers and middleware.
 */
export type SystemActionTypes =
  | UpdateSessionAction
  | SysHardResetApp
  | SysOnNewFolder
  | UpdateDimensions;
