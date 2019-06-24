import "../App.css";

import * as actions from "../store";

import React, { Component } from "react";

import Duration from "./duration";
import { LooseObject } from "../store/annotations/types";
import Paper from "@material-ui/core/Paper";
import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  controls?: boolean;
  duration: any;
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
  availableMedia: LooseObject[];
  vidPlayerRef: ReactPlayer;
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
}
interface PlayerProps extends StateProps, DispatchProps {
  // todo: do i need this?
}

class PlayerZone extends Component<PlayerProps> {
  componentDidMount() {
    // Runs on load
    actions.setVidPlayerRef(this.player);
  }
  private player!: ReactPlayer;
  // private audioPlayer!:WaveSurferInstance & WaveSurferRegions;

  pip = () => {
    // this.setState({ pip: !this.props.pip });
  };
  setVolume = (e: any) => {
    // this.setState({ volume: parseFloat(e.target.value) });
  };
  toggleMuted = () => {
    // this.setState({ muted: !this.props.muted });
  };
  setPlaybackRate = (e: any) => {
    // this.setState({ playbackRate: parseFloat(e.target.value) });
  };
  onPause = () => {
    // console.log("onPause");
    // this.setState({ playing: false });
  };
  onSeekMouseDown = (e: any) => {
    // this.setState({ seeking: true });
  };
  onSeekChange = (e: any) => {
    // this.setState({ played: parseFloat(e.target.value) });
  };
  onSeekMouseUp = (e: any) => {
    // this.setState({ seeking: false });
    this.player.seekTo(parseFloat(e.target.value));
  };
  seekToSec = (player: any, time: number) => {
    // todo: test this.
    player = this.props.player;
    const length = player.getDuration();
    const newTime = time / length;
    player.seekTo(newTime);
    actions.play();
  };
  loadNewFile(idx: number) {
    this.props.play();
    this.props.setURL(this.props.availableMedia[idx].blobURL);
    // todo: manage Index
  }
  sourceMedia() {
    return this.props.availableMedia.filter(file => !file.isAnnotation);
  }
  /* onProgress = (state: any) => {
    console.log('onProgress', state)
    // We only want to update time slider if we are not currently seeking
    if (!this.props.seeking) {
        this.setState(state)
    }
    } */
  onDuration = (duration: any) => {
    // console.log("onDuration", duration);
    actions.setDuration({ duration });
  };
  onClickFullscreen = () => {
    // screenfull.request(findDOMNode(this.player))
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
                <th>duration</th>
                <td>
                  <Duration
                    className="Total Duration"
                    seconds={this.props.duration.toFixed(3)}
                  />
                </td>
              </tr>
              <tr>
                <th>elapsed</th>
                <td>
                  <Duration
                    className="Duration-elapsed"
                    seconds={(this.props.duration * this.props.played).toFixed(
                      3
                    )}
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
              {this.sourceMedia().map((d, idx) => (
                <li
                  key={idx}
                  className="list-group-item flex-container"
                  onClick={() => this.loadNewFile(idx)}
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
  muted: state.player.muted,
  controls: state.player.controls,
  duration: state.player.duration,
  playing: state.player.playing,
  pip: state.player.pip,
  url: state.player.url,
  loop: state.player.loop,
  volume: state.player.volume,
  loaded: state.player.loaded,
  availableMedia: state.tree.availableMedia,
  vidPlayerRef: state.player.vidPlayerRef
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
      setDuration: actions.setDuration
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayerZone);
