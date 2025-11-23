/**
 * FileList Component
 *
 * Displays a list of source media files (video and audio) that users can
 * select to load into the player. Filters and sorts files automatically,
 * excluding annotation files and generated audio extracts.
 *
 * Features:
 * - Displays video and audio files from sourceMedia
 * - Filters out annotation files and StandardAudio extracts
 * - Memoizes filtered file list for performance
 * - Loads selected file into player with appropriate timeline
 * - Shows file type icons (video/audio)
 *
 * Performance:
 * - Uses useMemo to cache filtered file list
 * - Only recomputes when sourceMedia changes
 * - Prevents unnecessary re-renders during playback
 *
 * @module FileList
 */

import React, { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Paper from "@mui/material/Paper";

import * as actions from "../../../../store";
import {
  getSourceMedia,
  getTimelineIndex,
} from "../../../../components/globalFunctions";
import ResizableDiv from "../../../../components/resizableDiv";

/**
 * FileList functional component
 *
 * Renders a scrollable list of source media files with click-to-load behavior.
 * Automatically filters and sorts files using getSourceMedia utility.
 *
 * @returns {JSX.Element} Rendered file list component
 */
function FileList(): JSX.Element {
  // ============================================================================
  // REDUX STATE
  // ============================================================================

  const sourceMedia = useSelector(
    (state: actions.StateProps) => state.tree.sourceMedia,
  );
  const timeline = useSelector(
    (state: actions.StateProps) => state.annot.timeline,
  );

  const dispatch = useDispatch();

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  /**
   * Filtered and sorted list of source media files
   *
   * Uses getSourceMedia to filter out:
   * - Annotation files
   * - StandardAudio extracts
   * - Normalized MP3s
   * - Duplicate WAV files when MP3 exists
   *
   * Returns video files followed by audio files, both sorted alphabetically.
   *
   * Performance: Only recomputes when sourceMedia changes, preventing
   * unnecessary filtering during playback or other state updates.
   */
  const filteredFiles = useMemo(() => {
    return getSourceMedia(sourceMedia, false);
  }, [sourceMedia]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Load a new media file into the player
   *
   * Pauses playback, updates the URL, and switches to the appropriate timeline
   * for the selected file.
   *
   * @param {string} blobURL - Blob URL of the file to load
   */
  const loadNewFile = (blobURL: string): void => {
    dispatch(actions.togglePlay(true));
    dispatch(actions.setURL(blobURL, getTimelineIndex(timeline, blobURL)));
  };

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Log unmount event for debugging
   *
   * This matches the behavior of the original class component's
   * componentWillUnmount lifecycle method.
   */
  useEffect(() => {
    return () => {
      console.log("UnMounting FileList");
    };
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ResizableDiv className="FileList">
      <Paper>
        <ul data-testid="fileList.UL" className="list-group list-group-flush">
          {filteredFiles.map((d) => (
            <li
              key={d.blobURL}
              className="list-group-item flex-container"
              onClick={() => loadNewFile(d.blobURL)}
            >
              <div>
                {d.mimeType.startsWith("audio") ? "🔊 — " : "🎬 — "} {d.name}
              </div>
            </li>
          ))}
        </ul>
      </Paper>
    </ResizableDiv>
  );
}

export default FileList;
