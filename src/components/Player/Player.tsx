import "../../App.css";

import * as actions from "../../store";

import React, { Component } from "react";

import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getTimelineIndex, roundIt } from "../globalFunctions";
import { LooseObject } from "../../store/annot/types";
import ResizableDiv from "../resizableDiv";
import ControlRow from "./ControlRow/ControlRow";

interface StateProps {
  duration: any;
  loop: boolean;
  muted: boolean;
  playbackMultiplier: number;
  playbackRate: number;
  playing: boolean;
  seek: { time: number; scale: "seconds" | "fraction"| undefined };
  timeline: any[];
  url: string;
  volume: number;
  ready: boolean;
  subtitle: string;
  dimensions: LooseObject;
}

interface DispatchProps {
  onEnded: typeof actions.onEnded;
  onPlay: typeof actions.onPlay;
  onPause: typeof actions.onPause;
  onReady: typeof actions.onReady;
  onProgress: typeof actions.onProgress;
  setDuration: typeof actions.setDuration;
  setSeek: typeof actions.setSeek;
  setURL: typeof actions.setURL;
  togglePlay: typeof actions.togglePlay;
}

interface PlayerProps extends StateProps, DispatchProps {}

class PlayerZone extends Component<PlayerProps> {
  private player!: ReactPlayer;

  componentDidUpdate() {
    if (this.props.seek.time !== -1) {
      if (this.props.seek.scale) {
        this.player.seekTo(this.props.seek.time, this.props.seek.scale);
      } else {
        this.player.seekTo(this.props.seek.time);
      }
      // TODO: Seek sends seconds, but clips send fraction. This is a hack.
      this.props.setSeek(-1, "fraction");
    }
  }

  onPause = () => {
    console.log("onPause");
    this.props.onPause();
  };

  onPlay = () => {
    this.props.onPlay();
  };

  onReady = () => {
    this.props.onReady(true);
  };

  loadNewFile(blobURL: string) {
    this.props.togglePlay(true);
    this.props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL));
  }

  onDuration = (duration: number) => {
    console.log("onDuration", duration);
    this.props.setDuration(duration);
  };

  ref = (player: any) => {
    this.player = player;
  };

  subMultiply = (dimensions: LooseObject): any => {
    let value = 14;
    if (
      dimensions &&
      dimensions.AppPlayer &&
      dimensions.AppPlayer.width &&
      dimensions.AppPlayer.width > -1
    ) {
      const currentwidth = dimensions.AppPlayer.width;
      value = roundIt(12 + 6 * (currentwidth / 800), 0);
    }
    return value + "px";
  };

  render() {
    return (
      <ResizableDiv className="AppPlayer">
        <div className="player-wrapper">
          <ReactPlayer
            className="react-player"
            height="70%"
            loop={this.props.loop}
            muted={this.props.muted}
            onBuffer={() => console.log("Player Buffer")}
            onDuration={this.onDuration}
            onEnded={this.props.onEnded}
            onError={(e) => console.log("Player Error: " + e)}
            onPause={this.onPause}
            onPlay={this.onPlay}
            onProgress={this.props.onProgress}
            onReady={this.onReady}
            onSeek={(e) => console.log("Player Seek: " + e)}
            onStart={() => console.log("Player Start")}
            playbackRate={
              this.props.playbackRate * this.props.playbackMultiplier >= 15
                ? 14.5
                : this.props.playbackRate * this.props.playbackMultiplier <= 0.2
                ? 0.2
                : this.props.playbackRate * this.props.playbackMultiplier
            }
            playing={this.props.playing}
            progressInterval={200}
            ref={this.ref}
            url={this.props.url}
            volume={this.props.volume}
            width="100%"
          />
        </div>
        <div>
          <ControlRow />
          <div
            className="current-transcription"
            style={{ fontSize: this.subMultiply(this.props.dimensions) }}
          >
            {this.props.subtitle ? (
              <span className="subReal">{this.props.subtitle}</span>
            ) : (
              <span className="subNone">(No Subtitles)</span>
            )}
          </div>
        </div>
      </ResizableDiv>
    );
  }
}
// <span className="subNone">(No Subtitles Loaded)</span>

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  duration: state.player.duration,
  dimensions: state.system.dimensions,
  subtitle: state.deeJay.subtitle,
  loop: state.player.loop,
  muted: state.player.muted,
  playbackMultiplier: state.player.playbackMultiplier,
  playbackRate: state.player.playbackRate,
  playing: state.player.playing,
  seek: state.player.seek,
  timeline: state.annot.timeline,
  url: state.player.url,
  volume: state.player.volume,
  ready: state.player.ready,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      onEnded: actions.onEnded,
      onPlay: actions.onPlay,
      onPause: actions.onPause,
      onReady: actions.onReady,
      onProgress: actions.onProgress,
      setDuration: actions.setDuration,
      setSeek: actions.setSeek,
      setURL: actions.setURL,
      togglePlay: actions.togglePlay,
    },
    dispatch
  ),
});
export default connect(mapStateToProps, mapDispatchToProps)(PlayerZone);
