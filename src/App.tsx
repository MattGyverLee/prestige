import "./App.css";

import * as actions from "./store";

import AnnotationTable from "./model/annotTable";
import DeeJay from "./model/deeJay";
import FileList from "./model/fileList";
import PlayerZone from "./model/player";
import React from "react";
import SelectFolderZone from "./model/folderSelection";
import { Snackbar } from "./model/snackbars";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import getDirectoryListing from "./model/testFs";
import { hot } from "react-hot-loader";
import logo from "./assets/icons/png/256x256.png";
import processEAF from "./model/processEAF";

export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface StateProps {
  snackbarIsActive: boolean;
  snackbarText: string[];
  url: string;
  loaded: boolean;
  userName: string;
  annot: any;
}

interface DispatchProps {
  updateSession: typeof actions.updateSession;
  dispatchSnackbar: typeof actions.dispatchSnackbar;
  completeSnackbar: typeof actions.completeSnackbar;

  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  getDirectoryListing: typeof getDirectoryListing;
  sourceMediaAdded: typeof actions.sourceMediaAdded;
  annotMediaAdded: typeof actions.annotMediaAdded;
  sourceMediaChanged: typeof actions.sourceMediaChanged;
  annotMediaChanged: typeof actions.annotMediaChanged;
  processEAF: typeof processEAF;
  // updateActiveFolder: typeof actions.updateActiveFolder;
  updateTree: typeof actions.updateTree;
  onNewFolder: typeof actions.onNewFolder;

  onEnded: typeof actions.onEnded;
  onPlay: typeof actions.onPlay;
  onProgress: typeof actions.onProgress;
  playPause: typeof actions.playPause;
  stopPlaying: typeof actions.stopPlaying;
  toggleLoop: typeof actions.toggleLoop;
  updatePlayerAction: typeof actions.updatePlayerAction;

  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  enableAudtranscMain: typeof actions.enableAudtranscMain;
  pushAnnotation: typeof actions.pushAnnotation;
  pushTimeline: typeof actions.pushTimeline;
  hardResetApp: typeof actions.hardResetApp;
  snackbarToggleActive: typeof actions.snackbarToggleActive;
}

interface AppProps extends StateProps, DispatchProps {
  // local state props go here
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Matthew",
      clicks: 0,
      snackbarText: [],
      snackbarIsActive: false
    });

    this.props.onNewFolder("");
  }

  snackbarRef: any = React.createRef();

  componentDidUpdate() {
    if (this.props.snackbarText.length > 0) {
      if (!this.props.snackbarIsActive) {
        this.snackbarRef.current.openSnackBar(this.props.snackbarText[0]);
        this.props.completeSnackbar(this.props.snackbarText[0]);
      }
    }
  }

  _showSnackbarHandler = (e: any) => {
    e.preventDefault();
    this.snackbarRef.current.openSnackBar(this.props.snackbarText);
  };
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

  callProcessEAF = (inputFile: string) => {
    processEAF(inputFile, this.props);
    console.log("#Scanning EAF", inputFile);
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
          <SelectFolderZone callProcessEAF={this.callProcessEAF} />
          <div className="SnackBar">
            <button onClick={() => this.props.dispatchSnackbar(this.props.url)}>
              Click To Open Snackbar
            </button>
            <Snackbar
              ref={this.snackbarRef}
              isActive={this.props.snackbarIsActive}
              snackbarToggleActive={this.props.snackbarToggleActive}
            />
          </div>
          <p>
            {process.env.REACT_APP_MODE}: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  snackbarIsActive: state.system.snackbarIsActive,
  snackbarText: state.system.snackbarText,
  url: state.player.url,
  loaded: state.tree.loaded,
  userName: state.system.userName,
  annot: state.annot
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      addOralAnnotation: actions.addOralAnnotation,
      addCategory: actions.addCategory,
      completeSnackbar: actions.completeSnackbar,
      pushAnnotation: actions.pushAnnotation,
      dispatchSnackbar: actions.dispatchSnackbar,
      enableAudtranscMain: actions.enableAudtranscMain,
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
      playPause: actions.playPause,
      pushTimeline: actions.pushTimeline,
      processEAF,
      stopPlaying: actions.stopPlaying,
      toggleLoop: actions.toggleLoop,
      // updateActiveFolder: actions.updateActiveFolder,
      updatePlayerAction: actions.updatePlayerAction,
      updateSession: actions.updateSession,
      updateTree: actions.updateTree,
      hardResetApp: actions.hardResetApp,
      onNewFolder: actions.onNewFolder,
      snackbarToggleActive: actions.snackbarToggleActive
    },
    dispatch
  )
});

export default hot(module)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App)
);
