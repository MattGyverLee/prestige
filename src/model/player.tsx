import "../App.css";

import * as actions from "../store";

import React, { Component } from "react";
import {
  faExpandArrowsAlt,
  faPause,
  faPlay
} from "@fortawesome/free-solid-svg-icons";

import Duration from "./duration";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LooseObject } from "../store/annotations/types";
import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import repeat from "../assets/icons/player/repeat.png";

// import fullscreen from "../assets/icons/player/fullscreen.png";
// import pause from "../assets/icons/player/pause.png";
// import play from "../assets/icons/player/play.png";

interface StateProps {
  controls?: boolean;
  duration: any;
  loop: boolean;
  muted: boolean;
  parent?: any;
  pip: boolean;
  playbackRate: number;
  played: number;
  playing: boolean;
  seek: number;
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
  setSeek: typeof actions.setSeek;
  toggleMuted: typeof actions.toggleMuted;
  onSeekMouseDown: typeof actions.onSeekMouseDown;
  onSeekMouseUp: typeof actions.onSeekMouseUp;
  onSeekChange: typeof actions.onSeekChange;
  onVolumeChange: typeof actions.onVolumeChange;
}

interface PlayerProps extends StateProps, DispatchProps {}

class PlayerZone extends Component<PlayerProps> {
  private player!: ReactPlayer;

  private speeds: number[] = [0.2, 0.33, 0.5, 0.66, 0.8, 1, 1.25, 1.5, 2, 3, 5];
  private speedsIndex: number = 5;

  componentDidUpdate() {
    if (this.props.seek !== -1) {
      this.player.seekTo(this.props.seek);
      this.props.setSeek(-1, -1);
    }
  }

  pip = () => {
    // this.setState({ pip: !this.props.pip });
  };

  onVolumeChange = (e: any) => {
    this.props.onVolumeChange(parseFloat(e.target.value));
  };

  minusPlaybackRate = () => {
    if (this.speedsIndex > 0) {
      this.speedsIndex--;
      this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
    }
  };

  plusPlaybackRate = () => {
    if (this.speedsIndex < this.speeds.length - 1) {
      this.speedsIndex++;
      this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
    }
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
    this.props.setSeek(
      parseFloat(e.target.value),
      parseFloat(e.target.value) * this.props.duration,
      0
    );
  };

  onPlay = () => {
    this.props.onPlay();
  };

  loadNewFile(blobURL: string) {
    this.props.play();
    this.props.setURL(blobURL);
  }

  onDuration = (duration: number) => {
    console.log("onDuration", duration);
    this.props.setDuration(duration);
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
            height="70%"
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
          <div className="control-row">
            <div className="control-row-items">
              <button
                className="play-pause-button"
                onClick={this.props.playPause}
              >
                <FontAwesomeIcon
                  icon={this.props.playing ? faPause : faPlay}
                  color="black"
                ></FontAwesomeIcon>
              </button>
              <button
                className="loop-button"
                id="loop"
                onClick={this.props.toggleLoop}
              >
                <img width="20px" src={repeat} alt="Loop Icon"></img>
              </button>
              <button onClick={this.minusPlaybackRate}>-</button>
              <div className="playback-rate">{this.props.playbackRate}x</div>
              <button onClick={this.plusPlaybackRate}>+</button>
              <input
                className="seek-input"
                max={1}
                min={0}
                onChange={this.onSeekChange}
                onMouseDown={this.onSeekMouseDown}
                onMouseUp={this.onSeekMouseUp}
                step="any"
                type="range"
                value={this.props.played}
              />
              <div className="durations">
                <Duration
                  className="duration-elapsed"
                  seconds={this.props.duration * this.props.played}
                />
                <Duration
                  className="total-duration"
                  seconds={this.props.duration}
                />
              </div>
              <button
                className="fullscreen-button"
                onClick={this.onClickFullscreen}
              >
                <FontAwesomeIcon
                  icon={faExpandArrowsAlt}
                  color="black"
                ></FontAwesomeIcon>
              </button>
            </div>
          </div>
          <div className="current-transcription"></div>
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
  seek: state.player.seek,
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
      setSeek: actions.setSeek,
      toggleMuted: actions.toggleMuted,
      onSeekMouseDown: actions.onSeekMouseDown,
      onSeekMouseUp: actions.onSeekMouseUp,
      onSeekChange: actions.onSeekChange,
      onVolumeChange: actions.onVolumeChange
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayerZone);

/*
                <img
                  width="17px"
                  src={this.props.playing ? pause : play}
                  alt="Play/Pause Icon"
                ></img>

                <img width="18px" src={fullscreen} alt="Fullscreen Icon"></img>

*/
