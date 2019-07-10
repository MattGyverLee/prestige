import * as actions from "../store";

import React, { Component } from "react";
import { annotAudio, sourceAudio } from "./globalFunctions";
import { faLayerGroup, faVolumeUp } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LooseObject } from "../store/annotations/types";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  annotMedia: any;
  clipStarts: number[];
  clipStops: number[];
  currentTimeline: number;
  durations: number[];
  playing: boolean[];
  pos: number[];
  sourceMedia: any;
  timeline: any;
  url: string;
  volumes: number[];
}

interface DispatchProps {
  waveSurferPlayClip: typeof actions.waveSurferPlayClip;
  waveSurferPosChange: typeof actions.waveSurferPosChange;
  setWSVolume: typeof actions.setWSVolume;
  setWSDuration: typeof actions.setWSDuration;
  setSeek: typeof actions.setSeek;
  resetDeeJay: typeof actions.resetDeeJay;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  private waveSurfers: WaveSurfer[] = [];
  private loadQueue: string[] = [];
  private currentPlaying: string[] = [];
  private searched: boolean[] = [];

  componentDidMount = () => {
    [0, 1, 2].forEach((idx: number) => {
      this.loadQueue.push("");
      this.currentPlaying.push("");
      this.searched.push(false);
      this.waveSurfers.push(
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
        })
      );
    });
  };

  componentDidUpdate() {
    [0, 1, 2].forEach((idx: number) => {
      if (this.props.currentTimeline === -1) {
        this.props.resetDeeJay();
        if (this.loadQueue[idx] !== "" || this.currentPlaying[idx] !== "") {
          this.loadQueue[idx] = "";
          this.waveSurfers[idx].un("ready", () =>
            console.log("Reset WS: " + idx.toString())
          );
          this.waveSurfers[idx].load("");
          this.currentPlaying[idx] = "";
        }
        this.searched[idx] = false;
      } else {
        if (this.currentPlaying[idx] !== "") {
          if (this.waveSurfers[idx].isReady) {
            if (this.waveSurfers[idx].getVolume() !== this.props.volumes[idx]) {
              this.waveSurfers[idx].setVolume(this.props.volumes[idx]);
            }
            if (this.props.pos[idx] !== -1) {
              this.waveSurfers[idx].play(this.props.pos[idx]);
              this.props.waveSurferPosChange(idx, -1);
            }
            if (this.props.clipStarts[idx] !== -1) {
              if (this.props.clipStops[idx] === -1) {
                this.waveSurfers[idx].play(this.props.clipStarts[idx]);
              } else {
                this.waveSurfers[idx].play(
                  this.props.clipStarts[idx],
                  this.props.clipStops[idx]
                );
              }
              this.props.waveSurferPlayClip(idx, -1, -1);
            }
          }
          if (
            idx === 0 &&
            this.waveSurfers[idx].isPlaying() !== this.props.playing[0]
          ) {
            this.waveSurfers[idx].playPause();
          }
        } else if (this.loadQueue[idx] !== "") {
          if (this.fileAllowed(this.loadQueue[idx])) {
            this.waveSurfers[idx].load(this.loadQueue[idx]);
            this.currentPlaying[idx] = this.loadQueue[idx];
            this.loadQueue[idx] = "";
            this.waveSurfers[idx].on("waveform-ready", () => {
              console.log("Ready: " + idx.toString());
              this.onSurferReady(idx);
            });
            this.waveSurfers[idx].on("seek", (seek: number) =>
              this.props.setSeek(
                seek,
                seek * this.waveSurfers[idx].getDuration()
              )
            );
          }
        } else if (
          this.loadQueue[idx] === "" &&
          this.currentPlaying[idx] === "" &&
          !this.searched[idx]
        ) {
          this.searched[idx] = true;
          let currSync = this.props.timeline[this.props.currentTimeline]
            .syncMedia;
          let loadFile = "";
          let audio: LooseObject[] = [];
          switch (idx) {
            case 0:
              audio = sourceAudio(this.props.sourceMedia, true).filter(
                (sa: LooseObject) => {
                  return (
                    sa.blobURL.includes("_StandardAudio_Normalized.mp3") &&
                    currSync.indexOf(
                      sa.blobURL.substring(
                        0,
                        sa.blobURL.indexOf("_Normalized.mp3")
                      ) + ".wav"
                    ) !== -1
                  );
                }
              );
              break;
            default:
              audio = annotAudio(
                this.props.annotMedia,
                true,
                this.props.currentTimeline,
                this.props.timeline
              ).filter((aa: LooseObject) => {
                return aa.blobURL.includes(
                  (idx - 1 ? "Translation" : "Careful") + "_Merged.mp3"
                );
              });
              break;
          }
          loadFile = audio.length === 1 ? audio[0].blobURL : "";
          if (this.fileAllowed(loadFile)) {
            this.waveSurfers[idx].load(loadFile);
            this.currentPlaying[idx] = loadFile;
            this.waveSurfers[idx].on("waveform-ready", () => {
              console.log("Ready: " + idx.toString());
              this.onSurferReady(idx);
            });
            this.waveSurfers[idx].on("seek", (seek: number) =>
              this.props.setSeek(seek, -1)
            );
          } else {
            this.loadQueue[idx] = loadFile;
          }
        }
      }
    });
  }

  fileAllowed = (blobURL: string) => {
    if (blobURL === "") return false;
    let tempSrc = this.props.sourceMedia.filter(
      (m: any) => m.blobURL === blobURL
    );
    let tempAnnot = this.props.annotMedia.filter(
      (m: any) => m.blobURL === blobURL
    );
    let srcBool = tempSrc.length === 1 && tempSrc[0].wsAllowed;
    let srcAnnot = tempAnnot.length === 1 && tempAnnot[0].wsAllowed;
    return srcBool || srcAnnot;
  };

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onSurferReady = (idx: number) => {
    this.waveSurfers[idx].play();
    this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());
    this.props.setWSVolume(idx, this.props.volumes[idx]);
  };

  setVolume = (e: any) => {
    this.props.setWSVolume(parseInt(e.target.id), e.target.value);
  };

  render() {
    const waveTableRows = [0, 1, 2].map((idx: number) => {
      return (
        <tr key={idx.toString()}>
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
        <div className="wave-table-container">
          <table className="wave-table">
            <tbody>{waveTableRows}</tbody>
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  durations: state.deeJay.durations,
  pos: state.deeJay.pos,
  playing: state.deeJay.playing,
  clipStarts: state.deeJay.clipStarts,
  clipStops: state.deeJay.clipStops,
  timeline: state.annotations.timeline,
  volumes: state.deeJay.volumes,
  sourceMedia: state.tree.sourceMedia,
  annotMedia: state.tree.annotMedia,
  currentTimeline: state.annotations.currentTimeline,
  url: state.player.url
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      waveSurferPlayClip: actions.waveSurferPlayClip,
      waveSurferPosChange: actions.waveSurferPosChange,
      setWSVolume: actions.setWSVolume,
      setWSDuration: actions.setWSDuration,
      setSeek: actions.setSeek,
      resetDeeJay: actions.resetDeeJay
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
