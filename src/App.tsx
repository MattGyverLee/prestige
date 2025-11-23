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
            Dual View Mode:
            - Simple SayMore files (≤3 tiers): Show waveform column view (DeeJay)
            - Complex ELAN files (>3 tiers): Hide DeeJay, show grid view only
          */}
          {isSimpleSayMoreFile && (
            <ResizableDiv className="AppDeeJay">
              <DeeJay />
            </ResizableDiv>
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
