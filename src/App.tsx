import "./App.css";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "./store";
import withSplashScreen from "./components/withSplashScreen";

// Feature-based imports
import { AnnotationTable, DeeJay } from "@features/annotations";
import { FileList, SelectFolderZone } from "@features/fileSystem";
import { PlayerZone } from "@features/player";
import { ResizableDiv } from "@shared/components";

export type UpdatePlayerParam = React.SyntheticEvent<{
  value: string;
}>;

export function App(): JSX.Element {
  const dispatch = useDispatch();

  // Get view mode from Redux state
  const isSimpleSayMoreFile = useSelector(
    (state: actions.StateProps) => state.annot.isSimpleSayMoreFile,
  );
  const hasAudioAnnotations = useSelector(
    (state: actions.StateProps) => state.annot.hasAudioAnnotations,
  );
  const showWaveforms = useSelector(
    (state: actions.StateProps) => state.annot.showWaveforms,
  );

  // Determine if waveforms should be shown
  // Show if: (simple file OR has audio annotations) AND user toggle is ON
  const shouldShowWaveforms =
    (isSimpleSayMoreFile || hasAudioAnnotations) && showWaveforms;

  // Toggle waveform view
  const handleToggleWaveforms = () => {
    dispatch(actions.toggleWaveforms());
  };

  // componentDidMount → useEffect
  useEffect(() => {
    dispatch(
      actions.updateSession({
        loggedIn: true,
        session: "my_session",
        userName: "Class",
        clicks: 0,
        dimensions: {
          AppDetails: {
            width: -1,
            height: -1,
          },
          AppPlayer: {
            width: -1,
            height: -1,
          },
          AppDeeJay: {
            width: -1,
            height: -1,
          },
          AppBody: {
            width: -1,
            height: -1,
          },
          FileList: {
            width: -1,
            height: -1,
          },
          AnnotDiv: {
            width: -1,
            height: -1,
          },
        },
      }),
    );

    dispatch(actions.onNewFolder(""));
  }, [dispatch]);

  return (
    <div className="App">
      <ResizableDiv className="AppBody">
        <div className="AppSidebar">
          <PlayerZone />
          {/*
            Enhanced Dual View Mode:
            - Simple SayMore files (≤3 tiers): Show waveforms by default
            - Complex ELAN files with audio annotations: Waveforms available, user can toggle
            - Complex ELAN files without audio: No waveforms (grid view only)
            - User toggle: Switch between waveform and grid-only views when waveforms available
          */}
          {shouldShowWaveforms && (
            <ResizableDiv className="AppDeeJay">
              <DeeJay />
            </ResizableDiv>
          )}
          {/* Toggle button (shown when audio annotations are available) */}
          {(isSimpleSayMoreFile || hasAudioAnnotations) && (
            <div
              style={{
                padding: "8px",
                textAlign: "center",
                borderTop: "1px solid #ccc",
              }}
            >
              <button
                onClick={handleToggleWaveforms}
                style={{
                  padding: "4px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
                title={
                  showWaveforms
                    ? "Hide waveforms (show grid only)"
                    : "Show waveforms"
                }
              >
                {showWaveforms ? "📊 Grid Only" : "🎵 Show Waveforms"}
              </button>
            </div>
          )}
        </div>
        <ResizableDiv className="AppDetails">
          {/* AnnotationTable shown for both simple and complex files */}
          <AnnotationTable />
          <FileList />
        </ResizableDiv>
      </ResizableDiv>
      <div className="AppFooter">
        <SelectFolderZone />
      </div>
    </div>
  );
}

/* <button onClick={this.clearLocalStorage}>
Clear Local Storage
</button> {process.env.REACT_APP_MODE}:{" "}
          {process.env.NODE_ENV} */

export default withSplashScreen(App);
