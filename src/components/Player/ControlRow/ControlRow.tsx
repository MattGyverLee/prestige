import React, { Component } from "react";
import Duration from "./Duration";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import repeat from "../../../assets/icons/player/repeat.png";
import { speeds } from "../../../store/player/reducers";
import {
  faExpandArrowsAlt,
  faPause,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import * as actions from "../../../store";
import { roundIt } from "../../globalFunctions";

interface StateProps {
  playbackMultiplier: number;
  playerDuration: number;
  playerRate: number;
  playerPlayed: number;
  playerPlaying: boolean;
  speedsIndex: number;
}

interface DispatchProps {
  changeSpeedsIndex: typeof actions.changeSpeedsIndex;
  onSeekChange: typeof actions.onSeekChange;
  onSeekMouseDown: typeof actions.onSeekMouseDown;
  onSeekMouseUp: typeof actions.onSeekMouseUp;
  resetDeeJay: typeof actions.resetDeeJay;
  setDispatch: typeof actions.setDispatch;
  toggleLoop: typeof actions.toggleLoop;
}

interface ControlRowProps extends StateProps, DispatchProps {}

export class ControlRow extends Component<ControlRowProps> {
  onClickFullscreen = (): void => {
    // screenfull.request(findDOMNode(this.player))
  };

  render(): JSX.Element {
    return (
      <div className="control-row">
        <div className="control-row-items">
          <button
            className="play-pause-button"
            onClick={() => {
              this.props.setDispatch({
                dispatchType: "PlayPause",
                wsNum: -1,
              });
            }}
          >
            <FontAwesomeIcon
              icon={this.props.playerPlaying ? faPause : faPlay}
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
          <button
            onClick={() => {
              if (this.props.speedsIndex > 0) {
                this.props.changeSpeedsIndex("-");
              }
            }}
          >
            -
          </button>
          <div className="playback-rate">
            {roundIt(this.props.playbackMultiplier, 2)}x
          </div>
          <button
            onClick={() => {
              if (this.props.speedsIndex < speeds.length - 1) {
                this.props.changeSpeedsIndex("+");
              }
            }}
          >
            +
          </button>
          <input
            className="seek-input"
            max={1}
            min={0}
            onChange={(e) =>
              this.props.onSeekChange(parseFloat(e.target.value))
            }
            onMouseDown={this.props.onSeekMouseDown}
            onMouseUp={(e) => {
              this.props.onSeekMouseUp();
              this.props.setDispatch({
                dispatchType: "PlayerSeek",
                wsNum: -1,
                refStart:
                  parseFloat((e.target as HTMLInputElement).value) *
                  this.props.playerDuration,
              });
            }}
            step="any"
            type="range"
            value={this.props.playerPlayed}
          />
          <div className="durations">
            <Duration
              className="duration-elapsed"
              seconds={this.props.playerDuration * this.props.playerPlayed}
            />
            <Duration
              className="total-duration"
              seconds={this.props.playerDuration}
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
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  playbackMultiplier: state.player.playbackMultiplier,
  playerDuration: state.player.duration,
  playerRate: state.player.playbackRate,
  playerPlayed: state.player.played,
  playerPlaying: state.player.playing,
  speedsIndex: state.player.speedsIndex,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      changeSpeedsIndex: actions.changeSpeedsIndex,
      onSeekChange: actions.onSeekChange,
      onSeekMouseDown: actions.onSeekMouseDown,
      onSeekMouseUp: actions.onSeekMouseUp,
      resetDeeJay: actions.resetDeeJay,
      setDispatch: actions.setDispatch,
      toggleLoop: actions.toggleLoop,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ControlRow);
