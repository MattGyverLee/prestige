export default true;

import React, { Component } from "react";

import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  timeline: any;
  waveSurfer1: any;
  pos: number;
  playing: boolean;
  //  waveSurfer2: any;
  //  waveSurfer3: any;
}

interface DispatchProps {
  toggleWaveSurferPlay: typeof actions.toggleWaveSurferPlay;
  waveSurferPosChange: typeof actions.waveSurferPosChange;
  setWaveSurfer1: typeof actions.setWaveSurfer1;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  handleTogglePlay() {
    this.props.toggleWaveSurferPlay();
  }

  handlePosChange = (e: any) => {
    this.props.waveSurferPosChange(e.originalArgs[0]);
  };

  componentDidMount = () => {
    this.props.setWaveSurfer1(
      WaveSurfer.create({
        container: "#waveform",
        height: 100,
        barWidth: 1,
        cursorWidth: 1,
        backend: "MediaElement",
        progressColor: "#4a74a5",
        cursorColor: "#4a74a5",
        responsive: true,
        waveColor: "#ccc"
      })
    );
    //    this.props.waveSurfer1.load(
    //      "https://reelcrafter-east.s3.amazonaws.com/aux/test.m4a"
    //    );
    //    this.props.waveSurfer1.play();
  };

  onSurfer1Ready = () => {
    this.props.waveSurfer1.play();
  };

  componentDidUpdate = () => {
    console.log(this.props);
    if (this.props.waveSurfer1 !== null) {
      this.props.waveSurfer1.load(
        "https://reelcrafter-east.s3.amazonaws.com/aux/test.m4a"
      );
      this.props.waveSurfer1.on("waveform-ready", this.onSurfer1Ready);
    }
  };

  render() {
    return (
      <div>
        <div id="waveform"></div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  pos: state.deeJay.pos,
  playing: state.deeJay.playing,
  timeline: state.annotations.timeline,
  waveSurfer1: state.deeJay.waveSurfer1
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      waveSurferPosChange: actions.waveSurferPosChange,
      toggleWaveSurferPlay: actions.toggleWaveSurferPlay,
      setWaveSurfer1: actions.setWaveSurfer1
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeeJay);

/*        
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
                <th>Played</th>
                <td>
                  <progress max={1} value={this.props.played} />
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
*/
