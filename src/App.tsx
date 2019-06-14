
import * as React from 'react';
import { connect } from "react-redux";
import './App.css';
import { hot } from 'react-hot-loader'
import logo from './assets/icons/png/256x256.png';
import { AppState } from './store'
import { SystemState } from "./store/system/types";
import { updateSession } from "./store/system/actions";
import { ActiveFolderState } from "./store/tree/types";
import { updateActiveFolder } from "./store/tree/actions";
import { MediaPlayerState } from "./store/player/types";
import * as annAc from "./store/annotations/actions";
import { wipeAnnotationAction, resetAnnotationAction, enableAudtranscMain } from "./store/annotations/actions";
import { AnnotationState } from "./store/annotations/types";
import { 
  playPause, 
  stopPlaying, 
  updatePlayerAction, 
  toggleLoop, 
  onPlay, 
  onEnded,
  onProgress} from "./store/player/actions";
import TestFs from "./model/testFs";
import PlayerZone from "./model/player";

export type UpdatePlayerParam = React.SyntheticEvent<{ value: string }>;

interface AppProps {
  system: SystemState,
  updateSession: typeof updateSession;
  
  tree?: ActiveFolderState;
  updateActiveFolder: typeof updateActiveFolder;
  
  player: MediaPlayerState;
  updatePlayerAction: typeof updatePlayerAction;
  playPause: typeof playPause;
  stopPlaying: typeof stopPlaying;
  toggleLoop: typeof toggleLoop;
  onPlay: typeof onPlay;
  onEnded: typeof onEnded;
  onProgress: typeof onProgress;

  annotation?: AnnotationState;
  wipeAnnotationAction: typeof wipeAnnotationAction;
  resetAnnotationAction: typeof resetAnnotationAction;
  enableAudtranscMain: typeof enableAudtranscMain;
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "Matthew",
      clicks: 0
    });
    this.props.updateActiveFolder({
      path: "bing",
      URI: "http.bing"
    });
    this.props.updatePlayerAction({
      url: "http://www.youtube.com/watch?v=Fc1P-AEaEp8",
      //url: "https://www.youtube.com/watch?v=Hz63M3v11nE&t=7",
      playing: false,
      volume: 0.8,
      muted: false,
      playbackRate: 1.0,
      controls: false,
      played: false,
      pip: false,
      loaded: false,
      duration: -1,
      loop: false,
      seeking: false
    })
    let cleanStore = {
      annotations: {},
      annotationSet: {},
      audCareful_Main: false,
      audTransl_Main: false,
      txtTransc_Main: false,
      txtTransc_Subtitle: false,
      txtTransl_Main: false,
      txtTransl_Subtitle: false,
      SayMoreMeta_Main: false,
      fileInfo_Main: false,
    }
    
    this.props.wipeAnnotationAction(cleanStore)
    this.props.enableAudtranscMain()
  }

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
            <p><textarea value={TestFs.getDirectoryListing()} readOnly rows={20} /></p>
          </div>
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

/* const mapDispatchToProps = (dispatch: any) => {
  return {
    // dispatching plain actions
    stopPlaying2: () => dispatch({ type: 'STOP_PLAYING' }),
  }
} */

export default hot(module)(connect(
  mapStateToProps,
  { updateSession, updateActiveFolder, updatePlayerAction, wipeAnnotationAction, resetAnnotationAction, playPause, stopPlaying, toggleLoop, onPlay, onEnded, onProgress, enableAudtranscMain }
)(App));