/**
 * PlayerZone Component
 *
 * Main media player component that integrates ReactPlayer with the application.
 * Provides video/audio playback, progress tracking, seeking, and playback controls.
 *
 * @module features/player/components/PlayerZone
 */

import "../../../../App.css";
import React, { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import ReactPlayer from "react-player";

import * as actions from "../../../../store";
import { roundIt } from "../../../../components/globalFunctions";
import { LooseObject } from "../../../../store/annot/types";
import ResizableDiv from "../../../../components/resizableDiv";
import ControlRow from "../../../../components/Player/ControlRow/ControlRow";
import { useReactPlayer } from "../../hooks/useReactPlayer";

/**
 * PlayerZone Component
 *
 * Renders the main media player with:
 * - ReactPlayer for media playback
 * - Progress tracking and seeking
 * - Playback controls (play/pause/volume/speed)
 * - Real-time subtitle display
 * - Responsive sizing with ResizableDiv
 *
 * @returns {JSX.Element} The player zone component
 *
 * @remarks
 * This component is the migration of the class-based Player component to
 * a function component using hooks. It maintains the same API and behavior
 * while leveraging modern React patterns.
 *
 * Key features:
 * - Bidirectional sync between Redux and ReactPlayer
 * - Progress updates dispatched to Redux
 * - Seek commands from Redux applied to player
 * - Dynamic subtitle sizing based on player dimensions
 * - Playback rate clamping (0.2x - 14.5x)
 *
 * @example
 * ```typescript
 * <PlayerZone />
 * ```
 */
export function PlayerZone(): JSX.Element {
  // Redux state
  const loop = useSelector((state: actions.StateProps) => state.player.loop);
  const muted = useSelector((state: actions.StateProps) => state.player.muted);
  const playbackMultiplier = useSelector(
    (state: actions.StateProps) => state.player.playbackMultiplier,
  );
  const playbackRate = useSelector(
    (state: actions.StateProps) => state.player.playbackRate,
  );
  const playing = useSelector(
    (state: actions.StateProps) => state.player.playing,
  );
  const url = useSelector((state: actions.StateProps) => state.player.url);
  const volume = useSelector(
    (state: actions.StateProps) => state.player.volume,
  );
  const subtitle = useSelector(
    (state: actions.StateProps) => state.deeJay.subtitle,
  );
  const dimensions = useSelector(
    (state: actions.StateProps) => state.system.dimensions,
  );

  // Redux dispatch
  const dispatch = useDispatch();

  // ReactPlayer hook for player management
  const { playerRef, handleProgress, handleDuration } = useReactPlayer();

  /**
   * Handle pause event from ReactPlayer
   *
   * Called when ReactPlayer pauses playback (user clicked pause,
   * reached end of media, etc.). Dispatches pause action to Redux.
   */
  const onPause = useCallback(() => {
    console.log("onPause");
    dispatch(actions.onPause());
  }, [dispatch]);

  /**
   * Handle play event from ReactPlayer
   *
   * Called when ReactPlayer starts playback. Dispatches play action
   * to Redux to update application state.
   */
  const onPlay = useCallback(() => {
    dispatch(actions.onPlay());
  }, [dispatch]);

  /**
   * Handle ready event from ReactPlayer
   *
   * Called when ReactPlayer has loaded media and is ready for playback.
   * Dispatches ready action to Redux.
   */
  const onReady = useCallback(() => {
    dispatch(actions.onReady(true));
  }, [dispatch]);

  /**
   * Handle ended event from ReactPlayer
   *
   * Called when media playback reaches the end. Dispatches ended action
   * to Redux. Behavior depends on loop setting.
   */
  const onEnded = useCallback(() => {
    dispatch(actions.onEnded());
  }, [dispatch]);

  /**
   * Calculate dynamic subtitle font size
   *
   * Computes subtitle font size based on player width for responsive text.
   * Scales from 12px to 18px based on width ratio (800px reference).
   *
   * @param dimensions - Dimension state from Redux
   * @returns Font size string (e.g., "14px")
   *
   * @remarks
   * Formula: fontSize = 12 + 6 * (width / 800)
   * - At 400px width: 15px
   * - At 800px width: 18px
   * - Default (no dimensions): 14px
   */
  const subMultiply = useCallback((dimensions: LooseObject): string => {
    let value = 14;
    if (
      dimensions &&
      dimensions.AppPlayer &&
      dimensions.AppPlayer.width &&
      dimensions.AppPlayer.width > -1
    ) {
      const currentwidth = dimensions.AppPlayer.width;
      value = roundIt(12 + 6 * (currentwidth / 800), 0);
    }
    return value + "px";
  }, []);

  /**
   * Calculate effective playback rate
   *
   * Computes the actual playback rate by multiplying base rate and multiplier,
   * then clamping to ReactPlayer's supported range (0.2 - 14.5).
   *
   * @returns Clamped playback rate
   */
  const effectivePlaybackRate = useMemo(() => {
    const rate = playbackRate * playbackMultiplier;
    if (rate >= 15) return 14.5;
    if (rate <= 0.2) return 0.2;
    return rate;
  }, [playbackRate, playbackMultiplier]);

  /**
   * Calculate subtitle font size
   *
   * Memoized computation of subtitle font size based on current dimensions.
   * Only recalculates when dimensions change.
   */
  const subtitleFontSize = useMemo(
    () => subMultiply(dimensions),
    [dimensions, subMultiply],
  );

  return (
    <ResizableDiv className="AppPlayer">
      <div className="player-wrapper">
        <ReactPlayer
          className="react-player"
          height="70%"
          loop={loop}
          muted={muted}
          onBuffer={() => console.log("Player Buffer")}
          onDuration={handleDuration}
          onEnded={onEnded}
          onError={(e) => console.log("Player Error: " + e)}
          onPause={onPause}
          onPlay={onPlay}
          onProgress={handleProgress}
          onReady={onReady}
          onSeek={(e) => console.log("Player Seek: " + e)}
          onStart={() => console.log("Player Start")}
          playbackRate={effectivePlaybackRate}
          playing={playing}
          progressInterval={200}
          ref={playerRef}
          url={url}
          volume={volume}
          width="100%"
        />
      </div>
      <div>
        <ControlRow />
        <div
          className="current-transcription"
          style={{ fontSize: subtitleFontSize }}
        >
          {subtitle ? (
            <span className="subReal">{subtitle}</span>
          ) : (
            <span className="subNone">(No Subtitles)</span>
          )}
        </div>
      </div>
    </ResizableDiv>
  );
}

export default PlayerZone;
