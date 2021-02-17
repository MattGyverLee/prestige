import React, { Component } from "react";
import VolumeButton from "./VolumeButton/VolumeButton";
import VolumeBar from "./VolumeBar/VolumeBar";
import Waveform from "./Waveform/Waveform";
import { connect } from "react-redux";

interface PassProps {
  getPlaybackRate: any;
  getReady: any;
  index: number;
  onClick: any;
}

export class WaveTableRow extends Component<PassProps> {
  render() {
    return (
      <tr key={this.props.index.toString()}>
        <VolumeButton
          index={this.props.index}
          getPlaybackRate={this.props.getPlaybackRate}
          getReady={this.props.getReady}
        />
        <VolumeBar index={this.props.index} getReady={this.props.getReady} />
        <Waveform index={this.props.index} onClick={this.props.onClick} />
      </tr>
    );
  }
}

export default connect(undefined, undefined)(WaveTableRow);
