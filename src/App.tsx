
import React from 'react';
//import electron from 'electron'
import { connect } from "react-redux";
import './App.css';
import { hot } from 'react-hot-loader'
import logo from './assets/icons/png/256x256.png';
import { AppState } from './store'
import { SystemState } from "./store/system/types";
import SelectFolderZone from "./model/folderSelection" 
import { updateSession} from "./store/system/actions";
import { ActiveFolderState, Folders, FileDesc } from "./store/tree/types";
import  {
  updateActiveFolder,
  updateTree,
  fileAdded,
  mediaAdded,
  fileChanged,
  mediaChanged,
  fileDeleted
} from "./store/tree/actions";
import { MediaPlayerState } from "./store/player/types";
//import * as annAc from "./store/annotations/actions";
import { 
  //addAnnotation,
  //enableAudcarefulMain,
  enableAudtranscMain,
  //removeAnnotation,
  resetAnnotationAction,
  wipeAnnotationAction
} from "./store/annotations/actions";
import { AnnotationState } from "./store/annotations/types";
 

import {
  onEnded,
  onPlay,
  onProgress,
  playPause,
  stopPlaying,
  toggleLoop,
  updatePlayerAction

} from "./store/player/actions";
import getDirectoryListing from "./model/testFs";
import PlayerZone from "./model/player";
const isElectron = process.env.REACT_APP_MODE === 'electron'
export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface AppProps {
  system: SystemState,
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

  annotation?: AnnotationState;
  enableAudtranscMain: typeof enableAudtranscMain;
  resetAnnotationAction: typeof resetAnnotationAction;
  wipeAnnotationAction: typeof wipeAnnotationAction;

  getDirectoryListing: typeof getDirectoryListing;
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
      })} else {
        this.props.updateTree({
          env: "web",
          folderName: "",
          folderPath: "",
          loaded: false,
          availableFiles: [],
          availableMedia: []
        })}
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Matthew",
      clicks: 0
    });
    let cleanStore = {
      annotations: {},
      annotationSet: {},
      audCareful_Main: false,
      audTransl_Main: false,
      fileInfo_Main: false,
      sayMoreMeta_Main: false,
      txtTransc_Main: false,
      txtTransc_Subtitle: false,
      txtTransl_Main: false,
      txtTransl_Subtitle: false
    }
    this.props.wipeAnnotationAction(cleanStore)

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
    })
    
    this.props.enableAudtranscMain()
  }


  
  
  // Player Features
  playPause = () => {
    this.props.playPause()
    console.log('onPlay/PauseApp')
  }
  stopPlaying = () => {
    this.props.stopPlaying()
    console.log('onStopApp')
  }
  toggleLoop = () => {
    this.props.toggleLoop()
    console.log('ToggleLoopApp')
  }
  onPlay = () => {
    this.props.onPlay()
    console.log('onPlayApp')
  }
  onEnded = () => {
    this.props.onEnded()
    console.log('onEndedApp')
  }
  onProgress = (playState: any) => {
    this.props.onProgress(playState)
    console.log('onProgressApp', playState)
    if (!this.props.player.seeking) {
      //this.setState({player: {played: playState.played}})
      //this.setState(playState)
  }
  }
  updateActiveFolder = (inputFolder: Folders) => {
    this.props.updateActiveFolder(inputFolder)
    //this.processFolderService(inputFolder.folderPath);
  } 
  fileAdded = (inputFile: FileDesc) => {
    this.props.fileAdded(inputFile)
  } 
  mediaAdded = (inputFile: FileDesc) => {
    this.props.mediaAdded(inputFile)
  } 

  
  render() {
    return (
      <div className="App">
        <header className="App-header">
        <p><img src={logo} className="App-logo" alt="logo"/> Hi {this.props.system.userName}. Welcome to <code>Prestige</code>.</p>
        </header>
        <div className="App-body">
          <div className="App-sidebar">
          <PlayerZone 
            url={this.props.player.url} 
            playing={this.props.player.playing}
            muted={this.props.player.muted}
            playbackRate={this.props.player.playbackRate}
            volume={this.props.player.volume}
            loop={this.props.player.loop}
            played={this.props.player.played}
            playPause={this.playPause}
            stopPlaying={this.stopPlaying}
            toggleLoop={this.toggleLoop}
            onPlay={this.onPlay}
            onEnded={this.onEnded}
            onProgress={this.onProgress}
          />
          </div>
          <div className="DetailsZone">
            <p>{process.env.REACT_APP_MODE}: {process.env.NODE_ENV}</p>
            <p><textarea cols={60} value={getDirectoryListing(this.props.tree.availableMedia)} readOnly rows={20} /></p>
          </div>
        </div>
        <p>{this.props.tree.loaded}</p>
        <div className="App-footer">
          <SelectFolderZone 
            env={this.props.tree.env} 
            folderPath={this.props.tree.folderPath}
            folderName={this.props.tree.folderName} 
            updateActiveFolder={this.props.updateActiveFolder}
            loaded={this.props.tree.loaded}
            availableFiles={this.props.tree.availableFiles}
            availableMedia={this.props.tree.availableMedia}
            fileAdded={this.props.fileAdded}
            mediaAdded={this.props.mediaAdded}
            fileChanged={this.props.fileChanged}
            mediaChanged={this.props.mediaChanged}
            fileDeleted={this.props.fileDeleted}
             />
        </div>
      </div>
    );
  }
};


const mapStateToProps = (state: AppState) => ({
  system: state.system,
  tree: state.tree,
  player: state.player,
  annotations: state.annotations
});


export default hot(module)(connect(
  mapStateToProps, 
  { 
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
    resetAnnotationAction, 
    stopPlaying, 
    toggleLoop, 
    updateActiveFolder, 
    updatePlayerAction, 
    updateSession, 
    updateTree, 
    wipeAnnotationAction 
  }
)(App));