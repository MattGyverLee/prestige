/**
 * useReactPlayer Hook
 *
 * Custom hook for managing ReactPlayer integration with Redux state.
 * Handles player ref, progress tracking, duration management, and seeking synchronization.
 *
 * @module features/player/hooks/useReactPlayer
 *
 * @example
 * ```typescript
 * function PlayerZone() {
 *   const {
 *     playerRef,
 *     handleProgress,
 *     handleDuration,
 *   } = useReactPlayer();
 *
 *   return (
 *     <ReactPlayer
 *       ref={playerRef}
 *       onProgress={handleProgress}
 *       onDuration={handleDuration}
 *       url={url}
 *     />
 *   );
 * }
 * ```
 */

import { useRef, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ReactPlayer from "react-player";
import * as actions from "../../../store";

/**
 * ReactPlayer hook return interface
 */
export interface UseReactPlayerReturn {
  /**
   * Ref object for the ReactPlayer instance
   * Use this with ReactPlayer's ref prop
   */
  playerRef: React.RefObject<ReactPlayer>;

  /**
   * Progress update handler for ReactPlayer
   * Pass to ReactPlayer's onProgress prop
   *
   * @param playState - Progress state from ReactPlayer
   */
  handleProgress: (playState: any) => void;

  /**
   * Duration update handler for ReactPlayer
   * Pass to ReactPlayer's onDuration prop
   *
   * @param duration - Media duration in seconds
   */
  handleDuration: (duration: number) => void;
}

/**
 * Custom hook for ReactPlayer integration
 *
 * Manages ReactPlayer instance and synchronizes with Redux state:
 * - Tracks player ref for programmatic control
 * - Dispatches progress updates to Redux
 * - Dispatches duration updates to Redux
 * - Syncs Redux seek commands to player
 * - Prevents infinite loops with proper dependency management
 *
 * @returns {UseReactPlayerReturn} Player ref and event handlers
 *
 * @remarks
 * This hook automatically handles bidirectional synchronization:
 * - When Redux seek state changes → ReactPlayer seeks to new position
 * - When ReactPlayer progresses → Redux state updates
 * - Resets seek state after seeking to prevent re-triggering
 *
 * @example
 * ```typescript
 * function PlayerComponent() {
 *   const { playerRef, handleProgress, handleDuration } = useReactPlayer();
 *
 *   return (
 *     <ReactPlayer
 *       ref={playerRef}
 *       onProgress={handleProgress}
 *       onDuration={handleDuration}
 *     />
 *   );
 * }
 * ```
 */
export function useReactPlayer(): UseReactPlayerReturn {
  // ReactPlayer instance ref
  const playerRef = useRef<ReactPlayer>(null);

  // Redux state and dispatch
  const dispatch = useDispatch();
  const seek = useSelector((state: actions.StateProps) => state.player.seek);

  // Store previous seek state to detect changes
  const prevSeekRef = useRef(seek);

  /**
   * Handle progress updates from ReactPlayer
   *
   * Called continuously during playback (every progressInterval ms).
   * Dispatches current playback position to Redux store.
   *
   * @param playState - Progress state object from ReactPlayer
   *   - played: Fraction of media played (0.0 to 1.0)
   *   - loaded: Fraction of media buffered (0.0 to 1.0)
   *   - playedSeconds: Current position in seconds
   *   - loadedSeconds: Buffered position in seconds
   */
  const handleProgress = useCallback(
    (playState: any) => {
      dispatch(actions.onProgress(playState));
    },
    [dispatch],
  );

  /**
   * Handle duration updates from ReactPlayer
   *
   * Called when media metadata is loaded and duration becomes available.
   * Dispatches total media duration to Redux store.
   *
   * @param duration - Total media duration in seconds
   */
  const handleDuration = useCallback(
    (duration: number) => {
      console.log("onDuration", duration);
      dispatch(actions.setDuration(duration));
    },
    [dispatch],
  );

  /**
   * Synchronize Redux seek state with ReactPlayer
   *
   * Effect that watches for seek state changes in Redux and applies them
   * to the ReactPlayer instance. This enables programmatic seeking from
   * anywhere in the application.
   *
   * Synchronization flow:
   * 1. Redux seek state changes (time !== -1)
   * 2. Effect detects change by comparing with previous state
   * 3. ReactPlayer.seekTo() is called with new position
   * 4. Seek state is reset to -1 to prevent re-triggering
   *
   * @remarks
   * - Only seeks if seek.time !== -1 (active seek command)
   * - Only seeks if time or scale actually changed (prevents loops)
   * - Resets seek to -1 after seeking (one-shot command pattern)
   * - Handles both "seconds" and "fraction" scale modes
   */
  useEffect(() => {
    // Only seek if there's an active seek command (time !== -1)
    // and the seek state actually changed
    if (
      seek.time !== -1 &&
      (seek.time !== prevSeekRef.current.time ||
        seek.scale !== prevSeekRef.current.scale)
    ) {
      // Seek the player to the new position
      if (playerRef.current) {
        if (seek.scale) {
          playerRef.current.seekTo(seek.time, seek.scale);
        } else {
          playerRef.current.seekTo(seek.time);
        }
      }

      // Reset seek state to prevent re-triggering
      // Note: This is a one-shot command pattern - seek is applied once then reset
      dispatch(actions.setSeek(-1, "fraction"));

      // Update previous seek reference
      prevSeekRef.current = seek;
    } else {
      // Update reference even when not seeking to track state changes
      prevSeekRef.current = seek;
    }
  }, [seek, dispatch]);

  return {
    playerRef,
    handleProgress,
    handleDuration,
  };
}
