import "../../App.css";

import * as actions from "../../store";

import React, { Component } from "react";

import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getTimelineIndex } from "../globalFunctions";
import ResizableDiv from "../resizableDiv";
import ControlRow from "./ControlRow/ControlRow";

interface StateProps {
  duration: any;
  loop: boolean;
  muted: boolean;
  playbackMultiplier: number;
  playbackRate: number;
  playing: boolean;
  seek: number;
  timeline: any[];
  url: string;
  volume: number;
}

interface DispatchProps {
  onEnded: typeof actions.onEnded;
  onPlay: typeof actions.onPlay;
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
    if (this.props.seek !== -1) {
      this.player.seekTo(this.props.seek);
      this.props.setSeek(-1);
    }
  }

  onPause = () => {
    console.log("onPause");
  };

  onPlay = () => {
    this.props.onPlay();
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
            onReady={() => console.log("Player Ready")}
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
          <div className="current-transcription"></div>
        </div>
      </ResizableDiv>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  duration: state.player.duration,
  loop: state.player.loop,
  muted: state.player.muted,
  playbackMultiplier: state.player.playbackMultiplier,
  playbackRate: state.player.playbackRate,
  playing: state.player.playing,
  seek: state.player.seek,
  timeline: state.annot.timeline,
  url: state.player.url,
  volume: state.player.volume,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      onEnded: actions.onEnded,
      onPlay: actions.onPlay,
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
