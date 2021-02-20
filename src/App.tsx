import "./App.css";

import * as actions from "./store";
import withSplashScreen from "./components/withSplashScreen";
import AnnotationTable from "./components/AnnotTable/AnnotTable";
import DeeJay from "./components/DeeJay/DeeJay";
import FileList from "./components/FileList/FileList";
import PlayerZone from "./components/Player/Player";
import React from "react";
import SelectFolderZone from "./components/FolderSelection/FolderSelection";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Notifier from "./components/notifier";
import ResizableDiv from "./components/resizableDiv";

export type UpdatePlayerParam = React.SyntheticEvent<{
  value: string;
}>;

interface StateProps {
  url: string;
  loaded: boolean;
  userName: string;
}

interface DispatchProps {
  updateSession: typeof actions.updateSession;
  enqueueSnackbar: typeof actions.enqueueSnackbar;
  closeSnackbar: typeof actions.closeSnackbar;

  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  sourceMediaAdded: typeof actions.sourceMediaAdded;
  annotMediaAdded: typeof actions.annotMediaAdded;
  sourceMediaChanged: typeof actions.sourceMediaChanged;
  annotMediaChanged: typeof actions.annotMediaChanged;
  // updateActiveFolder: typeof actions.updateActiveFolder;
  updateTree: typeof actions.updateTree;
  onNewFolder: typeof actions.onNewFolder;

  onEnded: typeof actions.onEnded;
  onPlay: typeof actions.onPlay;
  onProgress: typeof actions.onProgress;
  togglePlay: typeof actions.togglePlay;
  stopPlaying: typeof actions.stopPlaying;
  toggleLoop: typeof actions.toggleLoop;
  updatePlayerAction: typeof actions.updatePlayerAction;

  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  toggleAudtranscMain: typeof actions.toggleAudtranscMain;
  pushAnnotation: typeof actions.pushAnnotation;
  pushTimeline: typeof actions.pushTimeline;
  hardResetApp: typeof actions.hardResetApp;
}

interface AppProps extends StateProps, DispatchProps {
  // local state props go here
}

export class App extends React.Component<AppProps> {
  componentDidMount(): void {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Class",
      clicks: 0,
      notifications: [],
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
    });

    this.props.onNewFolder("");
  }

  // componentDidUpdate() {}

  // Player Features

  hardResetApp = (inString: string): void => {
    this.props.hardResetApp(inString);
    this.hardResetHelper(document.querySelector("[id=selectFolder]"));
  };

  hardResetHelper = (input: any): void => {
    if (input !== null) {
      input.value = "";
    }
  };

  onProgress = (playState: any): void => {
    this.props.onProgress(playState);
    console.log("onProgressApp", playState);
  };

  clearLocalStorage = (): void => {
    for (const l in localStorage)
      if (l.startsWith("Prestige")) localStorage.removeItem(l);
  };

  render(): JSX.Element {
    return (
      <div className="App">
        <ResizableDiv className="AppBody">
          <Notifier />
          <div className="AppSidebar">
            <PlayerZone />
            <ResizableDiv className="AppDeeJay">
              <DeeJay />
            </ResizableDiv>
          </div>
          <ResizableDiv className="AppDetails">
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
}
/* <button onClick={this.clearLocalStorage}>
Clear Local Storage
</button> {process.env.REACT_APP_MODE}:{" "}
          {process.env.NODE_ENV} */

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  url: state.player.url,
  loaded: state.tree.loaded,
  userName: state.system.userName,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      addOralAnnotation: actions.addOralAnnotation,
      addCategory: actions.addCategory,
      closeSnackbar: actions.closeSnackbar,
      pushAnnotation: actions.pushAnnotation,
      toggleAudtranscMain: actions.toggleAudtranscMain,
      enqueueSnackbar: actions.enqueueSnackbar,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      sourceMediaAdded: actions.sourceMediaAdded,
      annotMediaAdded: actions.annotMediaAdded,
      sourceMediaChanged: actions.sourceMediaChanged,
      annotMediaChanged: actions.annotMediaChanged,
      onEnded: actions.onEnded,
      onPlay: actions.onPlay,
      onProgress: actions.onProgress,
      togglePlay: actions.togglePlay,
      pushTimeline: actions.pushTimeline,
      stopPlaying: actions.stopPlaying,
      toggleLoop: actions.toggleLoop,
      // updateActiveFolder: actions.updateActiveFolder,
      updatePlayerAction: actions.updatePlayerAction,
      updateSession: actions.updateSession,
      updateTree: actions.updateTree,
      hardResetApp: actions.hardResetApp,
      onNewFolder: actions.onNewFolder,
    },
    dispatch
  ),
});
// Todo: Try to import notistack
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withSnackbar = require("notistack").withSnackbar;

export default withSplashScreen(
  withSnackbar(connect(mapStateToProps, mapDispatchToProps)(App))
);
