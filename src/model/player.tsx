import "../App.css";

import * as actions from "../store";

import React, { Component } from "react";

import Duration from "./duration";
import { LooseObject } from "../store/annotations/types";
import Paper from "@material-ui/core/Paper";
import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { sourceMedia } from "./globalFunctions";

interface StateProps {
  controls?: boolean;
  duration: any;
  loop: boolean;
  muted: boolean;
  parent?: any;
  pip: boolean;
  playbackRate: number;
  played: number;
  player: any;
  playing: boolean;
  seeking?: boolean;
  state?: any;
  url: string;
  volume: number;
  loaded: number;
  sourceMedia: LooseObject[];
  annotMedia: LooseObject[];
}

interface DispatchProps {
  playPause: typeof actions.playPause;
  stopPlaying: typeof actions.stopPlaying;
  toggleLoop: typeof actions.toggleLoop;
  onPlay: typeof actions.onPlay;
  onEnded: typeof actions.onEnded;
  onProgress: typeof actions.onProgress;
  play: typeof actions.play;
  setURL: typeof actions.setURL;
  setDuration: typeof actions.setDuration;
  setPlaybackRate: typeof actions.setPlaybackRate;
  toggleMuted: typeof actions.toggleMuted;
  onSeekMouseDown: typeof actions.onSeekMouseDown;
  onSeekMouseUp: typeof actions.onSeekMouseUp;
  onSeekChange: typeof actions.onSeekChange;
  onVolumeChange: typeof actions.onVolumeChange;
  setPlayer: typeof actions.setPlayer;
}
interface PlayerProps extends StateProps, DispatchProps {
  // todo: do i need this?
}

class PlayerZone extends Component<PlayerProps> {
  private player!: ReactPlayer;
  // private audioPlayer!:WaveSurferInstance & WaveSurferRegions;

  pip = () => {
    // this.setState({ pip: !this.props.pip });
  };
  onVolumeChange = (e: any) => {
    this.props.onVolumeChange(parseFloat(e.target.value));
  };
  setPlaybackRate = (e: any) => {
    this.props.setPlaybackRate(parseFloat(e.target.value));
  };
  onPause = () => {
    console.log("onPause");
  };
  onSeekMouseDown = (e: any) => {
    this.props.onSeekMouseDown();
  };
  onSeekChange = (e: any) => {
    this.props.onSeekChange(parseFloat(e.target.value));
  };
  onSeekMouseUp = (e: any) => {
    this.props.onSeekMouseUp();
    this.player.seekTo(parseFloat(e.target.value));
  };
  onPlay = () => {
    this.props.onPlay();
    this.props.setPlayer(this.player);
  }
  loadNewFile(blobURL: string) {
    this.props.play();
    this.props.setURL(blobURL);
    // todo: manage Index
  }
  onDuration = (duration: number) => {
    console.log("onDuration", duration);
    this.props.setDuration(duration);
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
            onPlay={this.onPlay}
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
                    onChange={this.onVolumeChange}
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
                    onChange={this.props.toggleMuted}
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
                <th>duration</th>
                <td>
                  <Duration
                    className="Total Duration"
                    seconds={this.props.duration}
                  />
                </td>
              </tr>
              <tr>
                <th>elapsed</th>
                <td>
                  <Duration
                    className="Duration-elapsed"
                    seconds={(this.props.duration * this.props.played)}
                  />
                </td>
              </tr>
              <tr>
                <th>remaining</th>
                <td>
                  <Duration
                    className="Duration-Remaining"
                    seconds={(
                      this.props.duration *
                      (1 - this.props.played)
                    ).toFixed(3)}
                  />
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
        <div>
          <Paper>
            <ul className="list-group list-group-flush">
              {" "}
              {sourceMedia(this.props.sourceMedia).map(d => (
                <li
                  key={d.blobURL}
                  className="list-group-item flex-container"
                  onClick={() => this.loadNewFile(d.blobURL)}
                >
                  <div> {d.name} </div>
                </li>
              ))}{" "}
            </ul>
          </Paper>
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state: actions.StateProps): StateProps => ({
  playbackRate: state.player.playbackRate,
  played: state.player.played,
  player: state.player.player,
  muted: state.player.muted,
  controls: state.player.controls,
  duration: state.player.duration,
  playing: state.player.playing,
  pip: state.player.pip,
  url: state.player.url,
  loop: state.player.loop,
  volume: state.player.volume,
  loaded: state.player.loaded,
  sourceMedia: state.tree.sourceMedia,
  annotMedia: state.tree.annotMedia
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      play: actions.play,
      setURL: actions.setURL,
      playPause: actions.playPause,
      stopPlaying: actions.stopPlaying,
      toggleLoop: actions.toggleLoop,
      onPlay: actions.onPlay,
      onEnded: actions.onEnded,
      onProgress: actions.onProgress,
      setDuration: actions.setDuration,
      setPlaybackRate: actions.setPlaybackRate,
      toggleMuted: actions.toggleMuted,
      onSeekMouseDown: actions.onSeekMouseDown,
      onSeekMouseUp: actions.onSeekMouseUp,
      onSeekChange: actions.onSeekChange,
      onVolumeChange: actions.onVolumeChange,
      setPlayer: actions.setPlayer
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayerZone);
