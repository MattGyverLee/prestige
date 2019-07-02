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
import processEAF from "./model/processEAF";
import { updateSession } from "./store/system/actions";

export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface DispatchProps {
  updateSession: typeof updateSession;

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
  setSourceMediaAnnotRef: typeof actions.setSourceMediaAnnotRef;
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
}

interface AppProps extends actions.StateProps, DispatchProps {
  // local state props go here
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Matthew",
      clicks: 0
    });

    this.props.onNewFolder("");
  }

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
            {this.props.system.userName}. Welcome to <code>Prestige</code>.
          </p>
        </header>
        <div className="App-body">
          <div className="App-sidebar">
            <PlayerZone />
          </div>
          <div className="DetailsZone">
            <AnnotationTable />
            <FileList />
          </div>
        </div>
        <p>{this.props.tree.loaded}</p>
        <div className="App-footer">
          <SelectFolderZone callProcessEAF={this.callProcessEAF} />
          <p>
            {process.env.REACT_APP_MODE}: {process.env.NODE_ENV}
          </p>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): actions.StateProps => ({
  system: state.system,
  tree: state.tree,
  player: state.player,
  annotations: state.annotations,
  deeJay: state.deeJay
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      addOralAnnotation: actions.addOralAnnotation,
      addCategory: actions.addCategory,
      pushAnnotation: actions.pushAnnotation,
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
      updateSession,
      updateTree: actions.updateTree,
      hardResetApp: actions.hardResetApp,
      setSourceMediaAnnotRef: actions.setSourceMediaAnnotRef,
      onNewFolder: actions.onNewFolder
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
