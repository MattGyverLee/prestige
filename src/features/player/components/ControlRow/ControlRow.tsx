/**
 * ControlRow Component
 *
 * Media player control bar providing playback controls, seeking, speed adjustment,
 * and time display. Migrated from class component to function component using the
 * usePlayerControls custom hook.
 *
 * Features:
 * - Play/pause button with dynamic icon
 * - Loop toggle
 * - Speed control (increment/decrement through presets)
 * - Seek bar with drag support
 * - Time display (elapsed/total duration)
 * - Fullscreen button
 *
 * @module features/player/components/ControlRow
 */

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExpandArrowsAlt,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { speeds } from "@/store/player/reducers";
import { roundIt } from "@/components/globalFunctions";
import { usePlayerControls } from "../../hooks/usePlayerControls";
import Duration from "./Duration";
import repeat from "@/assets/icons/player/repeat.png";

/**
 * ControlRow Component
 *
 * Renders the main player control bar with all playback controls.
 * Uses the usePlayerControls hook to manage player state and actions.
 *
 * The component includes:
 * - Play/Pause toggle button
 * - Loop mode toggle
 * - Speed control buttons (- / current speed / +)
 * - Seek bar for navigation
 * - Duration displays (elapsed and total)
 * - Fullscreen toggle button
 *
 * @returns {JSX.Element} The rendered control row
 *
 * @example
 * ```tsx
 * function PlayerControls() {
 *   return (
 *     <div className="player-container">
 *       <ControlRow />
 *     </div>
 *   );
 * }
 * ```
 */
export function ControlRow(): JSX.Element {
  // ============================================================================
  // HOOKS - Get player state and control methods
  // ============================================================================

  const {
    isPlaying,
    currentTime,
    duration,
    speed,
    speedsIndex,
    incrementSpeed,
    decrementSpeed,
    toggleLoop,
    onSeekMouseDown,
    onSeekMouseUp,
    onSeekChange,
    dispatchPlayerAction,
  } = usePlayerControls();

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle play/pause button click
   *
   * Dispatches a PlayPause action to toggle playback state.
   * Uses the DeeJay dispatch system for coordinated playback control.
   */
  const handlePlayPause = (): void => {
    dispatchPlayerAction({
      dispatchType: "PlayPause",
      wsNum: -1,
    });
  };

  /**
   * Handle seek bar mouse up event
   *
   * Called when user releases the seek bar after dragging.
   * Dispatches both the mouse up event and the PlayerSeek action
   * to update the player's current time.
   *
   * @param e - Mouse event from the seek bar input
   */
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>): void => {
    onSeekMouseUp();
    const seekValue = parseFloat((e.target as HTMLInputElement).value);
    dispatchPlayerAction({
      dispatchType: "PlayerSeek",
      wsNum: -1,
      refStart: seekValue * duration,
    });
  };

  /**
   * Handle fullscreen button click
   *
   * Currently not implemented (placeholder for future fullscreen functionality).
   * Originally intended to use screenfull library to request fullscreen mode.
   */
  const handleFullscreen = (): void => {
    // TODO: Implement fullscreen functionality
    // screenfull.request(playerElement)
  };

  /**
   * Handle speed decrement button click
   *
   * Decreases playback speed to the previous preset if not already at minimum.
   */
  const handleSpeedDecrement = (): void => {
    if (speedsIndex > 0) {
      decrementSpeed();
    }
  };

  /**
   * Handle speed increment button click
   *
   * Increases playback speed to the next preset if not already at maximum.
   */
  const handleSpeedIncrement = (): void => {
    if (speedsIndex < speeds.length - 1) {
      incrementSpeed();
    }
  };

  /**
   * Handle seek bar value change
   *
   * Called continuously while user drags the seek bar.
   * Updates the visual position without actually seeking yet.
   *
   * @param e - Change event from the seek bar input
   */
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSeekChange(parseFloat(e.target.value));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="control-row">
      <div className="control-row-items">
        {/* Play/Pause Button */}
        <button
          className="play-pause-button"
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} color="black" />
        </button>

        {/* Loop Toggle Button */}
        <button
          className="loop-button"
          id="loop"
          onClick={toggleLoop}
          aria-label="Toggle loop"
        >
          <img width="20px" src={repeat} alt="Loop Icon" />
        </button>

        {/* Speed Decrement Button */}
        <button
          onClick={handleSpeedDecrement}
          disabled={speedsIndex <= 0}
          aria-label="Decrease speed"
        >
          -
        </button>

        {/* Current Speed Display */}
        <div className="playback-rate">{roundIt(speed, 2)}x</div>

        {/* Speed Increment Button */}
        <button
          onClick={handleSpeedIncrement}
          disabled={speedsIndex >= speeds.length - 1}
          aria-label="Increase speed"
        >
          +
        </button>

        {/* Seek Bar */}
        <input
          className="seek-input"
          type="range"
          min={0}
          max={1}
          step="any"
          value={currentTime}
          onChange={handleSeekChange}
          onMouseDown={onSeekMouseDown}
          onMouseUp={handleSeekMouseUp}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={currentTime}
        />

        {/* Duration Displays */}
        <div className="durations">
          {/* Elapsed Time */}
          <Duration
            className="duration-elapsed"
            seconds={duration * currentTime}
          />
          {/* Total Duration */}
          <Duration className="total-duration" seconds={duration} />
        </div>

        {/* Fullscreen Button */}
        <button
          className="fullscreen-button"
          onClick={handleFullscreen}
          aria-label="Toggle fullscreen"
        >
          <FontAwesomeIcon icon={faExpandArrowsAlt} color="black" />
        </button>
      </div>
    </div>
  );
}

export default ControlRow;
