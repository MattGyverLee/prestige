/**
 * System Redux Action Creators
 *
 * This module provides action creators for the system store, which manages:
 * - User authentication and session state
 * - UI component dimensions for responsive layout
 * - Global application state
 *
 * Action groups:
 * - Session Management: Login, session updates
 * - Dimension Updates: Component resize tracking
 * - App Lifecycle: Hard reset
 *
 * @module store/system/actions
 */

import * as types from "./types";

// ============================================================================
// DIMENSION MANAGEMENT
// ============================================================================

/**
 * Update dimensions for a specific UI component
 *
 * Updates the width and height of a UI component for responsive layout
 * calculations. This is typically called on window resize or component mount.
 *
 * Valid component targets:
 * - AppDetails: Details panel
 * - AppPlayer: ReactPlayer component
 * - AppDeeJay: WaveSurfer DJ panel
 * - AppBody: Main application body
 * - AnnotDiv: Annotation panel
 * - FileList: File list sidebar
 *
 * @param {DimensionObject} payload - Dimension update object with width, height, and target
 * @returns {SystemActionTypes} Dimension update action
 *
 * @example
 * // Update AppPlayer dimensions on resize
 * dispatch(updateDimensions({
 *   width: 1920,
 *   height: 1080,
 *   target: "AppPlayer"
 * }));
 *
 * @example
 * // Update AppDeeJay dimensions
 * dispatch(updateDimensions({
 *   width: 1200,
 *   height: 400,
 *   target: "AppDeeJay"
 * }));
 */
export const updateDimensions = (payload: types.DimensionObject) => ({
  type: types.UPDATE_DIMENSIONS,
  payload,
});

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Update entire session state
 *
 * Merges a new session state object with the current state. This is useful
 * for bulk updates to user session, login state, or global application settings.
 *
 * @param {SystemState} newSession - New session state to merge
 * @returns {SystemActionTypes} Update session action
 *
 * @example
 * // User logs in
 * dispatch(updateSession({
 *   ...currentState,
 *   userName: "alice",
 *   loggedIn: true,
 *   session: "abc123"
 * }));
 *
 * @example
 * // Update click counter
 * dispatch(updateSession({
 *   ...currentState,
 *   clicks: currentState.clicks + 1
 * }));
 *
 * @example
 * // User logs out
 * dispatch(updateSession({
 *   ...currentState,
 *   userName: "",
 *   loggedIn: false,
 *   session: ""
 * }));
 */
export function updateSession(
  newSession: types.SystemState,
): types.SystemActionTypes {
  return {
    type: types.UPDATE_SESSION,
    payload: newSession,
  };
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

/**
 * Hard reset entire application
 *
 * Triggers a complete application reset, clearing all state across all stores.
 * This is typically called when starting a new session or closing a project.
 *
 * @param {string} inString - Reset identifier or reason
 * @returns {SystemActionTypes} Hard reset action
 *
 * @example
 * // Reset application when closing project
 * dispatch(sysHardResetApp("close_project"));
 *
 * @example
 * // Reset on new folder
 * dispatch(sysHardResetApp("new_folder"));
 */
export function sysHardResetApp(inString: string): types.SystemActionTypes {
  return {
    type: types.HARD_RESET_APP,
    payload: inString,
  };
}
