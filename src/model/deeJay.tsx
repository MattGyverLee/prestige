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
  timelineChanged: boolean;
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
  private currBlob: string = "";

  componentDidMount = () => {
    [0, 1, 2].forEach((idx: number) => {
      this.loadQueue.push("");
      this.currentPlaying.push("");
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
    let currSync: string[] = [];
    if (this.props.currentTimeline !== -1) {
      currSync = this.props.timeline[this.props.currentTimeline].syncMedia;
    }
    [0, 1, 2].forEach((idx: number) => {
      console.log(
        idx.toString() +
          ": " +
          this.loadQueue[idx] +
          ", " +
          this.currentPlaying[idx]
      );
      // Reset if Timeline Changed
      if (currSync.filter((s: any) => s === this.currBlob).length !== 1) {
        // Reset DeeJay State
        this.props.resetDeeJay();

        // Fetch New CurrentTimeline SyncMedia Blob if Available
        if (this.props.currentTimeline !== -1)
          this.currBlob = currSync.filter((s: any) =>
            s.endsWith("_StandardAudio.wav")
          )[0];

        // Reset Local Variables and WS if LoadQueue or CurrentPlaying Not Empty
        if (this.loadQueue[idx] !== "" || this.currentPlaying[idx] !== "") {
          this.loadQueue[idx] = "";
          this.waveSurfers[idx].un("ready", () =>
            console.log("Reset WS: " + idx.toString())
          );
          this.waveSurfers[idx].load("");
          this.currentPlaying[idx] = "";
        }
      } else {
        // If Something is Playing in the Current WS, Allow Certain Actions
        // -> If LoadQueue Has Something in the Current WS, Check if it Can Load
        // -> Else, Re-Search
        if (this.currentPlaying[idx] !== "") {
          console.log(idx.toString() + ": Ready");
          // If the Wave Surfer is Ready, Allow Certain Actions
          if (this.waveSurfers[idx].isReady) {
            // Set Volume if Different from State
            if (this.waveSurfers[idx].getVolume() !== this.props.volumes[idx])
              this.waveSurfers[idx].setVolume(this.props.volumes[idx]);

            // Set Position if Directed by State and Reset State Pos to -1
            if (this.props.pos[idx] !== -1) {
              this.waveSurfers[idx].play(this.props.pos[idx]);
              this.props.waveSurferPosChange(idx, -1);
            }

            // Set Clip if Directed by State and Reset State Clip Start/Stop to -1
            if (this.props.clipStarts[idx] !== -1) {
              // If No Stop, Play from Start
              // -> Else, Play Only Clip
              if (this.props.clipStops[idx] === -1)
                this.waveSurfers[idx].play(this.props.clipStarts[idx]);
              else
                this.waveSurfers[idx].play(
                  this.props.clipStarts[idx],
                  this.props.clipStops[idx]
                );

              // Reset Clip Start/Stop
              this.props.waveSurferPlayClip(idx, -1, -1);
            }

            // Play/Pause Source Audio if Different from State
            if (
              idx === 0 &&
              this.waveSurfers[idx].isPlaying() !== this.props.playing[0]
            )
              this.waveSurfers[idx].playPause();
          }
        } else if (this.loadQueue[idx] !== "") {
          // If the LoadQueue File Can Be Loaded, Load It
          if (this.fileAllowed(this.loadQueue[idx])) {
            // Load the File, and Change CurrentPlaying and LoadQueue Accordingly
            this.currentPlaying[idx] = this.loadQueue[idx];
            this.waveSurfers[idx].load(this.loadQueue[idx]);
            this.loadQueue[idx] = "";

            // Set Event Watchers for Ready and Seeking
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
        } else {
          // Search for File According to WS Number
          let loadFile = "";
          let audio: LooseObject[] = [];
          switch (idx) {
            // If Source Audio WS, Find Normalized Standard Audio from SourceAudio
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

            // If Another WS, Find Associated Merged Audio from AnnotAudio
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

          // If The File Exists, Pass the Blob to LoadFile, Otherwise Empty String
          loadFile = audio.length === 1 ? audio[0].blobURL : "";

          // If the File is Allowed, Load It
          // -> Else, Add to LoadQueue
          if (this.fileAllowed(loadFile)) {
            // Load the File, and Change CurrentPlaying Accordingly
            this.waveSurfers[idx].load(loadFile);
            this.currentPlaying[idx] = loadFile;

            // Set Event Watchers for Ready and Seeking
            this.waveSurfers[idx].on("waveform-ready", () => {
              console.log("Ready: " + idx.toString());
              this.onSurferReady(idx);
            });
            this.waveSurfers[idx].on("seek", (seek: number) =>
              this.props.setSeek(seek, -1)
            );
          } else {
            // Add File to LoadQueue
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

  onSurferReady = (idx: number) => {
    this.waveSurfers[idx].setVolume(this.props.volumes[idx]);
    this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());
    this.waveSurfers[idx].play();
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
  url: state.player.url,
  timelineChanged: state.annotations.timelineChanged
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
