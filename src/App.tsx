
import * as React from 'react';
import { connect } from "react-redux";
import './App.css';
import { hot } from 'react-hot-loader'
import logo from './assets/icons/png/512x512.png';
import { AppState } from './store'
import { SystemState } from "./store/system/types";
import { updateSession } from "./store/system/actions";
import { ActiveFolderState } from "./store/tree/types";
import { updateActiveFolder } from "./store/tree/actions";
import { MediaPlayerState } from "./store/player/types";
import { updatePlayerAction } from "./store/player/actions";
import { playPause } from "./store/player/actions";
import { stopPlaying } from "./store/player/actions";
import TestFs from "./model/testFs";
import classes from './App.module.css';
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
}

class App extends React.Component<AppProps> {
  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "myName4",
      clicks: 0
    });
    this.props.updateActiveFolder({
      path: "bing",
      URI: "http.bing"
    });
    this.props.updatePlayerAction({
      parent: this,
      url: "https://www.youtube.com/watch?v=Hz63M3v11nE&t=7",
      playing: false,
      volume: 0.8,
      muted: false,
      controls: false,
      played: false,
      loaded: false,
      duration: -1,
      playbackRate: 1.0,
      loop: false,
    })

  }

  playPause = () => {
    this.props.playPause()
  }
  stopPlaying = () => {
    this.props.stopPlaying()
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to <code>Prestige</code>s.
          userName={this.props.system.userName}
        </p>
        <PlayerZone 
          url={this.props.player.url} 
          playing={this.props.player.playing}
          muted={this.props.player.muted}
          playbackRate={this.props.player.playbackRate}
          volume={this.props.player.volume}
          playPause={this.playPause}
          stopPlaying={this.stopPlaying}
        />
        <p>{process.env.REACT_APP_MODE}: {process.env.NODE_ENV}</p>
        <p><textarea className={classes.TextArea} value={TestFs.getDirectoryListing()} readOnly rows={20} /></p>
      </header>
    </div>
    );
  }
};


const mapStateToProps = (state: AppState) => ({
  system: state.system,
  tree: state.tree,
  player: state.player
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    // dispatching plain actions
    stopPlaying2: () => dispatch({ type: 'STOP_PLAYING' }),
  }
}

export default hot(module)(connect(
  mapStateToProps,
  { updateSession, updateActiveFolder, updatePlayerAction, playPause, stopPlaying }
)(App));