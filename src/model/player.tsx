import "../App.css";

import * as actions from "../store";

import React, { Component } from "react";

import ReactPlayer from "react-player";
import { UpdatePlayerParam } from "../App";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

//updatePlayerAction,
interface IStateProps {
  controls?: boolean;
  duration?: number;
  loop: boolean;
  muted: boolean;
  parent?: any;
  pip: boolean;
  playbackRate: number;
  played: number;
  player?: any;
  playing: boolean;
  seeking?: boolean;
  state?: any;
  url: string;
  volume: number;
  loaded: number;
}

interface IDispatchProps {
  playPause: typeof actions.playPause;
  stopPlaying: typeof actions.stopPlaying;
  toggleLoop: typeof actions.toggleLoop;
  onPlay: typeof actions.onPlay;
  onEnded: typeof actions.onEnded;
  onProgress: typeof actions.onProgress;
}
interface PlayerProps extends IStateProps, IDispatchProps {
  //todo: do i need this?
  refreshApp?: (event: UpdatePlayerParam) => void;
}

class PlayerZone extends Component<PlayerProps> {
  private player!: ReactPlayer;
  //private audioPlayer!:WaveSurferInstance & WaveSurferRegions;

  pip = () => {
    this.setState({ pip: !this.props.pip });
  };
  setVolume = (e: any) => {
    this.setState({ volume: parseFloat(e.target.value) });
  };
  toggleMuted = () => {
    this.setState({ muted: !this.props.muted });
  };
  setPlaybackRate = (e: any) => {
    this.setState({ playbackRate: parseFloat(e.target.value) });
  };
  onPause = () => {
    console.log("onPause");
    this.setState({ playing: false });
  };
  onSeekMouseDown = (e: any) => {
    this.setState({ seeking: true });
  };
  onSeekChange = (e: any) => {
    this.setState({ played: parseFloat(e.target.value) });
  };
  onSeekMouseUp = (e: any) => {
    this.setState({ seeking: false });
    this.player.seekTo(parseFloat(e.target.value));
  };
  /* onProgress = (state: any) => {
    console.log('onProgress', state)
    // We only want to update time slider if we are not currently seeking
    if (!this.props.seeking) {
        this.setState(state)
    }
    } */
  onDuration = (duration: any) => {
    console.log("onDuration", duration);
    this.setState({ duration });
  };
  onClickFullscreen = () => {
    //screenfull.request(findDOMNode(this.player))
  };

  ref = (player: any) => {
    this.player = player;
  };

  render() {
    return (
      <div>
        <div className="player-wrapper">
          <ReactPlayer
            className="react-player"
            height="100%"
            loop={this.props.loop}
            muted={this.props.muted}
            onBuffer={() => console.log("onBuffer")}
            onDuration={this.onDuration}
            onEnded={this.props.onEnded}
            onError={e => console.log("onError", e)}
            onPause={this.onPause}
            onPlay={this.props.onPlay}
            onProgress={this.props.onProgress}
            onReady={() => console.log("onReady")}
            onSeek={e => console.log("onSeek", e)}
            onStart={() => console.log("onStart")}
            pip={this.props.pip}
            playbackRate={this.props.playbackRate}
            playing={this.props.playing}
            ref={this.ref}
            url={this.props.url}
            volume={this.props.volume}
            width="100%"
          />
        </div>
        <div className="audio-Layers">
          <div>
            <input
              id="contactChoice1"
              name="contact"
              type="radio"
              value="email"
            />
            <label htmlFor="contactChoice1">Translation</label>
            <input
              id="contactChoice2"
              name="contact"
              type="radio"
              value="phone"
            />
            <label htmlFor="contactChoice2">Original</label>
            <input
              id="contactChoice3"
              name="contact"
              type="radio"
              value="mail"
            />
            <label htmlFor="contactChoice3">Careful</label>
          </div>
        </div>
        <div className="mediaControls">
          <table>
            <tbody>
              <tr>
                <th>Controls</th>
                <td>
                  <button onClick={this.props.stopPlaying}>Stop</button>
                  <button onClick={this.props.playPause}>
                    {this.props.playing ? "Pause" : "Play"}
                  </button>
                  <button onClick={this.onClickFullscreen}>Fullscreen</button>
                </td>
              </tr>
              <tr>
                <th>Speed</th>
                <td>
                  <button onClick={this.setPlaybackRate} value={1}>
                    1x
                  </button>
                  <button onClick={this.setPlaybackRate} value={1.5}>
                    1.5x
                  </button>
                  <button onClick={this.setPlaybackRate} value={2}>
                    2x
                  </button>
                </td>
              </tr>
              <tr>
                <th>Seek</th>
                <td>
                  <input
                    max={1}
                    min={0}
                    onChange={this.onSeekChange}
                    onMouseDown={this.onSeekMouseDown}
                    onMouseUp={this.onSeekMouseUp}
                    step="any"
                    type="range"
                    value={this.props.played}
                  />
                </td>
              </tr>
              <tr>
                <th>Volume</th>
                <td>
                  <input
                    max={1}
                    min={0}
                    onChange={this.setVolume}
                    step="any"
                    type="range"
                    value={this.props.volume}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor="muted">Muted</label>
                </th>
                <td>
                  <input
                    checked={this.props.muted}
                    id="muted"
                    onChange={this.toggleMuted}
                    type="checkbox"
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor="loop">Loop</label>
                </th>
                <td>
                  <input
                    checked={this.props.loop}
                    id="loop"
                    onChange={this.props.toggleLoop}
                    type="checkbox"
                  />
                </td>
              </tr>
              <tr>
                <th>Played</th>
                <td>
                  <progress max={1} value={this.props.played} />
                </td>
              </tr>
              <tr>
                <th>Loaded</th>
                <td>
                  <progress max={1} value={this.props.loaded} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state: actions.IStateProps): IStateProps => ({
  playbackRate: state.player.playbackRate,
  played: state.player.played,
  muted: state.player.muted,
  controls: state.player.controls,
  duration: state.player.duration,
  playing: state.player.playing,
  pip: state.player.pip,
  url: state.player.url,
  loop: state.player.loop,
  volume: state.player.volume,
  loaded: state.player.loaded
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      playPause: actions.playPause,
      stopPlaying: actions.stopPlaying,
      toggleLoop: actions.toggleLoop,
      onPlay: actions.onPlay,
      onEnded: actions.onEnded,
      onProgress: actions.onProgress
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayerZone);
