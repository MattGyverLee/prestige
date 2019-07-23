import "./App.css";

import * as actions from "./store";

import AnnotationTable from "./model/annotTable";
import DeeJay from "./model/deeJay";
import FileList from "./model/fileList";
import PlayerZone from "./model/player";
import React from "react";
import SelectFolderZone from "./model/folderSelection";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import getDirectoryListing from "./model/testFs";
import { hot } from "react-hot-loader";
import logo from "./assets/icons/png/256x256.png";
import Notifier from "./model/notifier";

export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

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
  getDirectoryListing: typeof getDirectoryListing;
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
  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Blaine",
      clicks: 0,
      notifications: []
    });

    this.props.onNewFolder("");
  }

  componentDidUpdate() {}

  // Player Features

  hardResetApp = (inString: string) => {
    this.props.hardResetApp(inString);
    this.hardResetHelper(document.querySelector("[id=selectFolder]"));
  };

  hardResetHelper = (input: any) => {
    if (input !== null) {
      input.value = "";
    }
  };

  onProgress = (playState: any) => {
    this.props.onProgress(playState);
    console.log("onProgressApp", playState);
  };

  clearLocalStorage = () => {
    for (let l in localStorage)
      if (l.startsWith("Prestige")) localStorage.removeItem(l);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>
            <img src={logo} className="App-logo" alt="logo" /> Hi{" "}
            {this.props.userName}. Welcome to <code>Prestige</code>.
          </p>
        </header>
        <div className="App-body">
          <div className="App-sidebar">
            <PlayerZone />
            <DeeJay />
          </div>
          <div className="DetailsZone">
            <AnnotationTable />
            <FileList />
          </div>
        </div>
        <p>{this.props.loaded}</p>
        <div className="App-footer">
          <Notifier />
          <SelectFolderZone />
          <div className="SnackBar">
            <button onClick={this.clearLocalStorage}>
              Click To Clear Local Storage
            </button>
          </div>
          <p>
            updated {process.env.REACT_APP_MODE}: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  url: state.player.url,
  loaded: state.tree.loaded,
  userName: state.system.userName
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
      getDirectoryListing,
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
      onNewFolder: actions.onNewFolder
    },
    dispatch
  )
});

const withSnackbar = require("notistack").withSnackbar;

export default hot(module)(
  withSnackbar(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(App)
  )
);
