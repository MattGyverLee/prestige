import * as actions from "../store";

import React, { Component } from "react";
import { faLayerGroup, faVolumeUp } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { sourceAudio } from "./globalFunctions";

interface StateProps {
  timeline: any;
  sourceMedia: any;
  volumes: number[];
  waveSurfers: any;
  pos: number;
  playing: boolean;
}

interface DispatchProps {
  toggleWaveSurferPlay: typeof actions.toggleWaveSurferPlay;
  waveSurferPosChange: typeof actions.waveSurferPosChange;
  setWaveSurfer: typeof actions.setWaveSurfer;
  setWSVolume: typeof actions.setWSVolume;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  componentDidMount = () => {
    [0, 1, 2].forEach((idx: number) => {
      this.props.setWaveSurfer(
        WaveSurfer.create({
          container: "#waveform" + idx.toString(),
          height: 50,
          barWidth: 1,
          cursorWidth: 1,
          backend: "MediaElement",
          progressColor: "#4a74a5",
          cursorColor: "#4a74a5",
          responsive: true,
          waveColor: "#ccc",
          hideScrollbar: true
        }),
        idx
      );
    });
  };

  testLoad = () => {
    if (this.props.waveSurfers[0] !== null) {
      this.props.waveSurfers[0].load(
        sourceAudio(this.props.sourceMedia)[0].blobURL
      );
      this.props.waveSurfers[0].on("waveform-ready", () =>
        this.onSurferReady(0)
      );
      this.props.setWSVolume(0, this.props.volumes[0]);
    }
  };

  handleTogglePlay() {
    this.props.toggleWaveSurferPlay();
  }

  handlePosChange = (e: any) => {
    this.props.waveSurferPosChange(e.originalArgs[0]);
  };

  onSurferReady = (idx: number) => {
    this.props.waveSurfers[idx].play();
  };

  setVolume = (e: any) => {
    this.props.setWSVolume(parseInt(e.target.id), e.target.value);
  };

  render() {
    const waveTableRows = [0, 1, 2].map((idx: number) => {
      return (
        <tr>
          <td className="wave-table-play">
            <FontAwesomeIcon icon={faVolumeUp} />
          </td>
          <td className="wave-table-overlay">
            <FontAwesomeIcon icon={faLayerGroup} />
          </td>
          <td className="wave-table-volume">
            <input
              id={idx.toString()}
              type="range"
              min={0}
              max={1}
              step={0.2}
              onChange={this.setVolume}
              value={this.props.volumes[idx]}
            />
          </td>
          <td className="waveform" id={"waveform" + idx.toString()}></td>
        </tr>
      );
    });

    return (
      <div>
        <button onClick={this.testLoad}></button>
        <div className="wave-table-container">
          <table className="wave-table">{waveTableRows}</table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  pos: state.deeJay.pos,
  playing: state.deeJay.playing,
  timeline: state.annotations.timeline,
  waveSurfers: state.deeJay.waveSurfers,
  volumes: state.deeJay.volumes,
  sourceMedia: state.tree.sourceMedia
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      waveSurferPosChange: actions.waveSurferPosChange,
      toggleWaveSurferPlay: actions.toggleWaveSurferPlay,
      setWaveSurfer: actions.setWaveSurfer,
      setWSVolume: actions.setWSVolume
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
