import React, { Component } from "react";
import { connect } from "react-redux";

interface PassProps {
  index: number;
  onClick: any;
}

export class Waveform extends Component<PassProps> {
  render() {
    return (
      <td
        className="waveform"
        id={"waveform" + this.props.index.toString()}
        onClick={this.props.onClick}
      ></td>
    );
  }
}

export default connect(undefined, undefined)(Waveform);
