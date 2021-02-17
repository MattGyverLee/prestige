import React, { Component } from "react";
import * as actions from "../../../../store";
import { roundIt } from "../../../globalFunctions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface PassProps {
  index: number;
  getReady: any;
}

interface StateProps {
  volumes: number[];
}

interface DispatchProps {
  setWSVolume: typeof actions.setWSVolume;
}

interface VolumeBarProps extends StateProps, DispatchProps {}

export class VolumeBar extends Component<VolumeBarProps & PassProps> {
  render() {
    return (
      <td className="wave-table-volume">
        <input
          id={this.props.index.toString()}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={roundIt(this.props.volumes[this.props.index] ** 4, 2)}
          onChange={(e) =>
            this.props.setWSVolume(
              parseInt(e.target.id),
              parseFloat(e.target.value) ** 0.25
            )
          }
          disabled={!this.props.getReady()}
        />
      </td>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  volumes: state.deeJay.volumes,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      setWSVolume: actions.setWSVolume,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(VolumeBar);
