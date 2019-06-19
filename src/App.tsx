import "./App.css";

import * as actions from "./store";

import { IStateProps } from "./store";
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

const isElectron = process.env.REACT_APP_MODE === "electron";
export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface IDispatchProps {
  updateSession: typeof updateSession;

  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  getDirectoryListing: typeof getDirectoryListing;
  mediaAdded: typeof actions.mediaAdded;
  mediaChanged: typeof actions.mediaChanged;
  processEAF: typeof processEAF;
  updateActiveFolder: typeof actions.updateActiveFolder;
  updateTree: typeof actions.updateTree;

  onEnded: typeof actions.onEnded;
  onPlay: typeof actions.onPlay;
  onProgress: typeof actions.onProgress;
  playPause: typeof actions.playPause;
  stopPlaying: typeof actions.stopPlaying;
  toggleLoop: typeof actions.toggleLoop;
  updatePlayerAction: typeof actions.updatePlayerAction;

  addAnnotation: typeof actions.addAnnotation;
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  enableAudtranscMain: typeof actions.enableAudtranscMain;
  pushAnnotation: typeof actions.pushAnnotation;
  pushTimeline: typeof actions.pushTimeline;
  resetAnnotationAction: typeof actions.resetAnnotationAction;
  wipeAnnotationAction: typeof actions.wipeAnnotationAction;
}

interface AppProps extends IStateProps, IDispatchProps {
  //local state props go here
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    if (isElectron) {
      this.props.updateTree({
        availableFiles: [],
        availableMedia: [],
        env: "electron",
        folderName: "",
        folderPath: "",
        loaded: false
      });
    } else {
      this.props.updateTree({
        availableFiles: [],
        availableMedia: [],
        env: "web",
        folderName: "",
        folderPath: "",
        loaded: false
      });
    }
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Matthew",
      clicks: 0
    });
    let cleanStore = {
      annotations: [],
      annotationSet: [],
      audCareful_Main: false,
      audTransl_Main: false,
      categories: [],
      fileInfo_Main: false,
      sayMoreMeta_Main: false,
      timeline: [],
      txtTransc_Main: false,
      txtTransc_Subtitle: false,
      txtTransl_Main: false,
      txtTransl_Subtitle: false
    };
    this.props.wipeAnnotationAction(cleanStore);

    this.props.updatePlayerAction({
      controls: false,
      duration: -1,
      loaded: 0,
      loop: false,
      muted: false,
      pip: false,
      playbackRate: 1.0,
      played: false,
      playing: false,
      seeking: false,
      url: "http://www.youtube.com/watch?v=Fc1P-AEaEp8",
      //url: "https://www.youtube.com/watch?v=Hz63M3v11nE&t=7",
      volume: 0.8
    });

    this.props.enableAudtranscMain();
  }

  // Player Features

  onProgress = (playState: any) => {
    this.props.onProgress(playState);
    console.log("onProgressApp", playState);
    if (!this.props.player.seeking) {
      //this.setState({player: {played: playState.played}})
      //this.setState(playState)
    }
  };

  callProcessEAF = (inputFile: string) => {
    processEAF(inputFile, this.props);
    console.log(inputFile);
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
            <p>
              {process.env.REACT_APP_MODE}: {process.env.NODE_ENV}
            </p>
            <p>
              <textarea
                cols={60}
                value={getDirectoryListing(this.props.tree.availableMedia)}
                readOnly
                rows={20}
              />
            </p>
          </div>
        </div>
        <p>{this.props.tree.loaded}</p>
        <div className="App-footer">
          <SelectFolderZone callProcessEAF={this.callProcessEAF} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: IStateProps): IStateProps => ({
  system: state.system,
  tree: state.tree,
  player: state.player,
  annotations: state.annotations
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      addAnnotation: actions.addAnnotation,
      addOralAnnotation: actions.addOralAnnotation,
      addCategory: actions.addCategory,
      pushAnnotation: actions.pushAnnotation,
      enableAudtranscMain: actions.enableAudtranscMain,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      getDirectoryListing,
      mediaAdded: actions.mediaAdded,
      mediaChanged: actions.mediaChanged,
      onEnded: actions.onEnded,
      onPlay: actions.onPlay,
      onProgress: actions.onProgress,
      playPause: actions.playPause,
      pushTimeline: actions.pushTimeline,
      processEAF,
      resetAnnotationAction: actions.resetAnnotationAction,
      stopPlaying: actions.stopPlaying,
      toggleLoop: actions.toggleLoop,
      updateActiveFolder: actions.updateActiveFolder,
      updatePlayerAction: actions.updatePlayerAction,
      updateSession,
      updateTree: actions.updateTree,
      wipeAnnotationAction: actions.wipeAnnotationAction
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
