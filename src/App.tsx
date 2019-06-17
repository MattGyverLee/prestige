import "./App.css";

import { ActiveFolderState, FileDesc, Folders } from "./store/tree/types";
import {
  AnnotationState,
  LooseObject,
  Milestone
} from "./store/annotations/types";
import {
  addAnnotation,
  addCategory,
  addOralAnnotation,
  enableAudtranscMain,
  pushAnnotation,
  pushTimeline,
  resetAnnotationAction,
  wipeAnnotationAction
} from "./store/annotations/actions";
import {
  fileAdded,
  fileChanged,
  fileDeleted,
  mediaAdded,
  mediaChanged,
  updateActiveFolder,
  updateTree
} from "./store/tree/actions";
import {
  onEnded,
  onPlay,
  onProgress,
  playPause,
  stopPlaying,
  toggleLoop,
  updatePlayerAction
} from "./store/player/actions";

import { AppState } from "./store";
import { MediaPlayerState } from "./store/player/types";
import PlayerZone from "./model/player";
import React from "react";
import SelectFolderZone from "./model/folderSelection";
import { SystemState } from "./store/system/types";
import { connect } from "react-redux";
import getDirectoryListing from "./model/testFs";
import { hot } from "react-hot-loader";
import logo from "./assets/icons/png/256x256.png";
import processEAF from "./model/processEAF";
import { updateSession } from "./store/system/actions";

const isElectron = process.env.REACT_APP_MODE === "electron";
export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface AppProps {
  system: SystemState;
  updateSession: typeof updateSession;

  tree: ActiveFolderState;
  fileAdded: typeof fileAdded;
  mediaAdded: typeof mediaAdded;
  fileChanged: typeof fileChanged;
  mediaChanged: typeof mediaChanged;
  fileDeleted: typeof fileDeleted;
  updateActiveFolder: typeof updateActiveFolder;
  updateTree: typeof updateTree;

  player: MediaPlayerState;
  onEnded: typeof onEnded;
  onPlay: typeof onPlay;
  onProgress: typeof onProgress;
  playPause: typeof playPause;
  stopPlaying: typeof stopPlaying;
  toggleLoop: typeof toggleLoop;
  updatePlayerAction: typeof updatePlayerAction;

  annotation: AnnotationState;
  addCategory: typeof addCategory;
  addAnnotation: typeof addAnnotation;
  addOralAnnotation: typeof addOralAnnotation;
  pushAnnotation: typeof pushAnnotation;
  pushTimeline: typeof pushTimeline;
  enableAudtranscMain: typeof enableAudtranscMain;
  resetAnnotationAction: typeof resetAnnotationAction;
  wipeAnnotationAction: typeof wipeAnnotationAction;

  getDirectoryListing: typeof getDirectoryListing;
  processEAF: typeof processEAF;
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    if (isElectron) {
      this.props.updateTree({
        env: "electron",
        folderName: "",
        folderPath: "",
        loaded: false,
        availableFiles: [],
        availableMedia: []
      });
    } else {
      this.props.updateTree({
        env: "web",
        folderName: "",
        folderPath: "",
        loaded: false,
        availableFiles: [],
        availableMedia: []
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
      loaded: false,
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
  playPause = () => {
    this.props.playPause();
    console.log("onPlay/PauseApp");
  };
  stopPlaying = () => {
    this.props.stopPlaying();
    console.log("onStopApp");
  };
  toggleLoop = () => {
    this.props.toggleLoop();
    console.log("ToggleLoopApp");
  };
  onPlay = () => {
    this.props.onPlay();
    console.log("onPlayApp");
  };
  onEnded = () => {
    this.props.onEnded();
    console.log("onEndedApp");
  };
  onProgress = (playState: any) => {
    this.props.onProgress(playState);
    console.log("onProgressApp", playState);
    if (!this.props.player.seeking) {
      //this.setState({player: {played: playState.played}})
      //this.setState(playState)
    }
  };
  updateActiveFolder = (inputFolder: Folders) => {
    this.props.updateActiveFolder(inputFolder);
    //this.processFolderService(inputFolder.folderPath);
  };
  fileAdded = (inputFile: FileDesc) => {
    this.props.fileAdded(inputFile);
  };
  mediaAdded = (inputFile: FileDesc) => {
    this.props.mediaAdded(inputFile);
  };
  pushAnnotation = (inMilestones: Array<Milestone>) => {
    console.log("onPushAnnotation");
    this.props.pushAnnotation(inMilestones);
  };
  pushTimeline = (inTimeline: LooseObject) => {
    console.log("onPushTimeline");
    this.props.pushTimeline(inTimeline);
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
            <PlayerZone
              loop={this.props.player.loop}
              muted={this.props.player.muted}
              onEnded={this.onEnded}
              onPlay={this.onPlay}
              onProgress={this.onProgress}
              playbackRate={this.props.player.playbackRate}
              played={this.props.player.played}
              playing={this.props.player.playing}
              playPause={this.playPause}
              stopPlaying={this.stopPlaying}
              toggleLoop={this.toggleLoop}
              url={this.props.player.url}
              volume={this.props.player.volume}
            />
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
          <SelectFolderZone
            addAnnotation={this.props.addAnnotation}
            addCategory={this.props.addCategory}
            addOralAnnotation={this.props.addOralAnnotation}
            annotations={this.props.annotation.annotations}
            availableFiles={this.props.tree.availableFiles}
            availableMedia={this.props.tree.availableMedia}
            callProcessEAF={this.callProcessEAF}
            categories={this.props.annotation.categories}
            env={this.props.tree.env}
            fileAdded={this.props.fileAdded}
            fileChanged={this.props.fileChanged}
            fileDeleted={this.props.fileDeleted}
            folderName={this.props.tree.folderName}
            folderPath={this.props.tree.folderPath}
            loaded={this.props.tree.loaded}
            mediaAdded={this.props.mediaAdded}
            mediaChanged={this.props.mediaChanged}
            pushAnnotation={this.pushAnnotation}
            pushTimeline={this.props.pushTimeline}
            updateActiveFolder={this.props.updateActiveFolder}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  system: state.system,
  tree: state.tree,
  player: state.player,
  annotation: state.annotations
});

export default hot(module)(
  connect(
    mapStateToProps,
    {
      addAnnotation,
      addOralAnnotation,
      addCategory,
      pushAnnotation,
      enableAudtranscMain,
      fileAdded,
      fileChanged,
      fileDeleted,
      getDirectoryListing,
      mediaAdded,
      mediaChanged,
      onEnded,
      onPlay,
      onProgress,
      playPause,
      pushTimeline,
      processEAF,
      resetAnnotationAction,
      stopPlaying,
      toggleLoop,
      updateActiveFolder,
      updatePlayerAction,
      updateSession,
      updateTree,
      wipeAnnotationAction
    }
  )(App)
);
