import React, { Component } from "react";
import * as actions from "../../../../store";
import { bindActionCreators } from "redux";
import { LooseObject } from "../../../../store/annot/types";
import { roundIt } from "../../../globalFunctions";
import { connect } from "react-redux";

interface PassProps {
  index: number;
  getReady: any;
  getPlaybackRate: any;
}

interface StateProps {
  volumes: number[];
}

interface DispatchProps {
  closeSnackbar: typeof actions.closeSnackbar;
  enqueueSnackbar: typeof actions.enqueueSnackbar;
  setWSVolume: typeof actions.setWSVolume;
}

interface VolumeButtonProps extends StateProps, DispatchProps {}

export class VolumeButton extends Component<VolumeButtonProps & PassProps> {
  // Enqueues the Next Snackbar Mesage
  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) =>
    this.props.enqueueSnackbar({
      message: inMessage,
      options: {
        key: inKey || new Date().getTime() + Math.random(),
        variant: vType || "default",
        action: (key: LooseObject) => (
          <button onClick={() => this.props.closeSnackbar(key)}>Dismiss</button>
        ),
      },
    });
  getName = (index: number): string => {
    switch (index) {
      case 0:
        return "Source";
      case 1:
        return "Careful";
      case 2:
        return "Translation";
      default:
        return "";
    }
  };
  // Toggles the Volume Between Three Predetermined States
  toggleVol = () => {
    if (this.props.getReady()) {
      const name = `${
        !this.props.index
          ? "Original"
          : this.props.index === 1
          ? "Careful"
          : "Translation"
      } Audio Set to `;
      if (this.props.volumes[this.props.index] > 0.5 ** 0.25) {
        this.sendSnackbar(
          name + "50% (Background)",
          "vol" + this.props.index.toString()
        );
        this.props.setWSVolume(this.props.index, 0.5 ** 0.25);
      } else if (this.props.volumes[this.props.index] === 0) {
        this.sendSnackbar(
          name + "100% (Main)",
          "vol" + this.props.index.toString()
        );
        this.props.setWSVolume(this.props.index, 1);
      } else if (this.props.volumes[this.props.index] <= 0.5 ** 0.25) {
        this.sendSnackbar(
          name + "0% (Muted)",
          "vol" + this.props.index.toString()
        );
        this.props.setWSVolume(this.props.index, 0);
      }
    }
  };

  render(): JSX.Element {
    return (
      <td className="wave-table-enable">
        <div className="buttonWrapper">
          <div
            className="ThreeDimButton"
            onClick={this.toggleVol}
            onMouseDown={() => false}
          >
            <img
              className="black"
              width={50}
              height={50}
              alt=""
              src={require("../../../../assets/buttons/disabled50.png")}
            />
            <div className="overlay">
              <img
                className="green"
                width={50}
                height={50}
                alt=""
                style={{
                  opacity: roundIt(
                    this.props.getReady()
                      ? this.props.volumes[this.props.index]
                      : 0,
                    2
                  ),
                }}
                src={require("../../../../assets/buttons/enabled50.png")}
              />
            </div>
          </div>
        </div>
      </td>
    );
  }
}

/*
<div>
          {(!this.props.volumes && "Undefined") ||
            (this.props.volumes[this.props.index] > 0.5 ** 0.25 && "High") ||
            (this.props.volumes[this.props.index] === 0 && "Muted") ||
            "Low"}
        </div>

<br />
<div className="rowTitle">{this.getName(this.props.index)}</div>
        {roundIt(this.props.getPlaybackRate(), 2)}
*/

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  volumes: state.deeJay.volumes,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      closeSnackbar: actions.closeSnackbar,
      enqueueSnackbar: actions.enqueueSnackbar,
      setWSVolume: actions.setWSVolume,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(VolumeButton);
