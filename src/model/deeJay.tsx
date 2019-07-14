import * as actions from "../store";

import React, { Component } from "react";
import { annotAudio, roundIt, sourceAudio } from "./globalFunctions";

import { DeeJayDispatch } from "../store/deeJay/types";
import { LooseObject } from "../store/annot/types";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  annotMedia: any;
  currentTimeline: number;
  playerDuration: number;
  durations: number[];
  dispatch: DeeJayDispatch;
  playerPlayed: number;
  playing: boolean[];
  sourceMedia: any;
  timeline: any;
  timelineChanged: boolean;
  url: string;
  volumes: number[];
}

interface DispatchProps {
  dispatchSnackbar: typeof actions.dispatchSnackbar;
  setWSVolume: typeof actions.setWSVolume;
  setWSDuration: typeof actions.setWSDuration;
  setSeek: typeof actions.setSeek;
  resetDeeJay: typeof actions.resetDeeJay;
  setDispatch: typeof actions.setDispatch;
  playerPlay: typeof actions.play;
  waveformAdded: typeof actions.waveformAdded;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  private waveSurfers: WaveSurfer[] = [];
  private loadQueue: string[] = [];
  private currentPlaying: string[] = [];
  private currBlob: string = "";

  componentDidMount = () => {
    let regionsPlugin = require("../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
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
          hideScrollbar: true,
          plugins: [regionsPlugin.create()]
        })
      );
      this.waveSurfers[idx].on("region-out", () => {
        console.log("Out");
        this.regionOut(idx);
      });
      this.waveSurfers[idx].on("region-click", (region: any) =>
        this.regionClick(idx, region)
      );
      this.waveSurfers[idx].on("region-removed", () => {
        console.log("Removed");
      });
      /*
      this.waveSurfers[idx].on("seek", (seek: number) => {
        this.props.setDispatch({
          dispatchType: "Seek",
          wsNum: idx,
          refStart: roundIt(seek * this.waveSurfers[idx].getDuration(), 3)
        });
      });
      */
    });
    this.waveSurfers[0].on("play", this.props.playerPlay);
  };

  componentDidUpdate() {
    let currSync: string[] = [];
    if (this.props.currentTimeline !== -1) {
      currSync = this.props.timeline[this.props.currentTimeline].syncMedia;
    }
    [0, 1, 2].forEach((idx: number) => {
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
          this.waveSurfers[idx].load("");
          this.currentPlaying[idx] = "";
        }
      } else {
        // If Something is Playing in the Current WS, Allow Certain Actions
        // -> If LoadQueue Has Something in the Current WS, Check if it Can Load
        // -> Else, Re-Search
        if (this.currentPlaying[idx] !== "") {
          // If the Wave Surfer is Ready, Allow Certain Actions
          if (this.waveSurfers[idx].isReady) {
            // Set Volume if Different from State
            if (this.waveSurfers[idx].getVolume() !== this.props.volumes[idx])
              this.waveSurfers[idx].setVolume(
                this.props.volumes[idx] * this.props.volumes[idx]
              );

            // Set Clip if Directed by State and Reset State Clip Start/Stop to -1
            if (
              this.props.dispatch.dispatchType !== "" &&
              this.props.dispatch.wsNum === idx
            ) {
              const dispatch = { ...this.props.dispatch };
              this.props.setDispatch({ dispatchType: "" });
              this.dispatchDJ(dispatch);
            }

            // Play/Pause Source Audio if Different from State
            /*
            if (
              idx === 0 &&
              this.waveSurfers[idx].isPlaying() !== this.props.playing[0]
            )
              this.waveSurfers[idx].playPause();
            */
          }
        } else if (this.loadQueue[idx] !== "") {
          // If the LoadQueue File Can Be Loaded, Load It
          if (this.fileAllowed(this.loadQueue[idx])) {
            // Load the File, and Change CurrentPlaying and LoadQueue Accordingly
            this.currentPlaying[idx] = this.loadQueue[idx];
            this.waveSurfers[idx].load(this.loadQueue[idx]);
            this.loadQueue[idx] = "";

            // Set Event Watchers for Ready and Seeking
            let waveformReady = () => {
              this.onSurferReady(idx);
              this.waveSurfers[idx].un("waveform-ready", waveformReady);
            };
            this.waveSurfers[idx].on("waveform-ready", waveformReady);
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
            let waveformReady = () => {
              this.onSurferReady(idx);
              this.waveSurfers[idx].un("waveform-ready", waveformReady);
            };
            this.waveSurfers[idx].on("waveform-ready", waveformReady);
          } else {
            // Add File to LoadQueue
            this.loadQueue[idx] = loadFile;
          }
        }
      }
    });
  }

  // Creates Region
  regionOut = (idx: any) => {
    // Remove the Specified WS's Region, if it Exists, and Redraw
    if (this.waveSurfers[idx].regions.list.temp !== undefined) {
      this.waveSurfers[idx].regions.list.temp.remove();
    }
  };

  // Processes Mouse Input on Region
  regionClick = (idx: number, region: any) => {
    // Seek to Specified Region Time and Redraw
    this.waveSurfers[idx].seekTo(region.start);
  };

  //
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
    const sourceAnnot = idx > 0 ? true : false;
    const cp = this.currentPlaying[idx];
    const waveform = this.waveSurfers[idx].exportPCM(500, 1000, true);
    const waveIn = {
      ref: cp,
      sourceAnnot,
      // True: Source
      wavedata: waveform
    };
    this.props.waveformAdded(waveIn);
    this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());
    if (idx === 0) {
      this.waveSurfers[idx].play();
    }
  };

  setVolume = (e: any) => {
    this.props.setWSVolume(
      parseInt(e.target.id),
      roundIt(e.target.value * e.target.value, 2)
    );
  };

  solo = (wsNum: number) => {
    [0, 1, 2].forEach((idx: number) => {
      this.props.setWSVolume(idx, +(idx === wsNum));
      if (idx !== wsNum) this.waveSurfers[idx].stop();
    });
  };

  dispatchDJ = (dispatch: DeeJayDispatch) => {
    const regionCreated = (region: any) => {
      console.log("Created");
      if (region.id === "temp") {
        this.waveSurfers[wsNum].play(region.start, region.end);
      }
      this.waveSurfers[wsNum].un("region-created", regionCreated);
    };
    const wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;

    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].regions.list.temp !== undefined)
        this.waveSurfers[idx].regions.list.temp.remove();
    });

    switch (dispatch.dispatchType) {
      case "Clip":
        this.props.dispatchSnackbar("Playing Clip");
        this.solo(wsNum);
        this.waveSurfers[wsNum].on("region-created", regionCreated);
        this.waveSurfers[wsNum].addRegion({
          id: "temp",
          color: "rgba(153,170,255,0.3)",
          start: dispatch.clipStart,
          end: dispatch.clipStop,
          drag: false,
          resize: false
        });
        break;
      case "Seek":
        if (
          this.props.currentTimeline !== -1 &&
          dispatch.refStart !== undefined
        ) {
          const ms = this.props.timeline[this.props.currentTimeline].milestones;
          const actives = [0, 1, 2].filter(
            (n: number) => this.props.volumes[n] > 0
          );
          if (actives.length === 1) {
            let currWS = this.waveSurfers[actives[0]];
            this.props.dispatchSnackbar("Seeking");
            if (actives[0] === 0) {
              const thisM = ms.filter(
                (m: any) =>
                  dispatch.refStart !== undefined &&
                  m.startTime <= dispatch.refStart &&
                  dispatch.refStart < m.stopTime
              )[0];

              currWS.play(dispatch.refStart, thisM.stopTime);

              // On Pause Function for the WS
              let nextClip = () => {
                let filtered = ms.filter(
                  (m: any) =>
                    m.startTime <= currWS.getCurrentTime() &&
                    currWS.getCurrentTime() < m.stopTime
                );
                if (filtered.length === 1) {
                  let nextM = filtered[0];
                  // TODO: Console Log for Video Delay
                  currWS.play(nextM.startTime, nextM.stopTime);
                  this.props.setSeek(
                    roundIt(nextM.startTime / this.props.playerDuration, 3)
                  );
                } else {
                  currWS.un("pause", nextClip);
                }
              };

              currWS.on("pause", nextClip);
              this.props.setSeek(
                roundIt(dispatch.refStart / this.props.playerDuration, 3)
              );
              this.props.setWSVolume(actives[0], 1);
            } else if (actives[0] === 1) {
              const filtered = ms.filter(
                (m: any) =>
                  m.data.filter(
                    (me: any) =>
                      m.channel === "CarefulMerged" &&
                      dispatch.refStart !== undefined &&
                      m.clipStart <= dispatch.refStart &&
                      dispatch.refStart < m.clipStop
                  ).length === 1
              );
              if (filtered.length !== 1) {
                console.log("No Careful Annotation");
                break;
              }
            } else {
              const filtered = ms.filter(
                (m: any) =>
                  m.data.filter(
                    (me: any) =>
                      m.channel === "TranslationMerged" &&
                      dispatch.refStart !== undefined &&
                      m.clipStart <= dispatch.refStart &&
                      dispatch.refStart < m.clipStop
                  ).length === 1
              );
              if (filtered.length !== 1) {
                console.log("No Translation Annotation");
                break;
              }
            }
          }
        }
        break;
      case "Step":
        this.props.dispatchSnackbar("Stepping");
        break;
      case "PlayThrough":
        this.props.dispatchSnackbar("Playing Through");
        break;
      case "ClipPlus":
        this.props.dispatchSnackbar("Playing Clip");
        this.solo(wsNum);
        this.waveSurfers[wsNum].addRegion({
          id: "temp",
          color: "rgba(153,170,255,0.3)",
          start: dispatch.clipStart,
          end: dispatch.clipStop,
          drag: false,
          resize: false
        });
        // this.waveSurfers[wsNum].play(this.props.clipStarts[wsNum]);
        this.waveSurfers[wsNum].play(
          this.waveSurfers[wsNum].regions.list.temp.start
        );
        break;
    }

    // this.props.dispatchSnackbar("🎵 DJ Activated 🎵");
  };

  toggleVol = (idx: number) => {
    if (this.waveSurfers[idx] !== undefined && this.waveSurfers[idx].isReady) {
      let name = "";
      switch (idx) {
        case 0:
          name = "Original Audio set to ";
          break;
        case 1:
          name = "Careful Audio set to ";
          break;
        case 2:
          name = "Translation Audio set to ";
          break;
      }
      if (this.props.volumes[idx] > 0.25) {
        this.props.dispatchSnackbar(name + "25% (Background)");
        this.props.setWSVolume(idx, 0.25);
      } else if (this.props.volumes[idx] === 0) {
        this.props.dispatchSnackbar(name + "100% (Main)");
        this.props.setWSVolume(idx, 1);
      } else if (this.props.volumes[idx] <= 0.25) {
        this.props.dispatchSnackbar(name + "0% (Muted)");
        this.props.setWSVolume(idx, 0);
      }
    }
  };

  render() {
    const waveTableRows = [0, 1, 2].map((idx: number) => {
      return (
        <tr key={idx.toString()}>
          <td className="wave-table-enable">
            <div className="buttonWrapper">
              <div
                className="ThreeDimButton"
                onClick={() => this.toggleVol(idx)}
                onMouseDown={() => false}
              >
                <img
                  className="black"
                  width={50}
                  height={50}
                  alt=""
                  src={require("../assets/buttons/disabled50.png")}
                />
                <div className="overlay">
                  <div className="overlay">
                    <img
                      className="green"
                      width={50}
                      height={50}
                      alt=""
                      style={{
                        opacity: roundIt(
                          this.waveSurfers[idx] !== undefined &&
                            this.waveSurfers[idx].isReady
                            ? this.props.volumes[idx]
                            : 0,
                          2
                        )
                      }}
                      src={require("../assets/buttons/enabled50.png")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </td>
          <td className="wave-table-volume">
            <input
              id={idx.toString()}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={roundIt(
                this.props.volumes[idx] !== 0
                  ? Math.sqrt(this.props.volumes[idx])
                  : 0,
                2
              )}
              onChange={this.setVolume}
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
  playing: state.deeJay.playing,
  timeline: state.annot.timeline,
  volumes: state.deeJay.volumes,
  sourceMedia: state.tree.sourceMedia,
  annotMedia: state.tree.annotMedia,
  currentTimeline: state.annot.currentTimeline,
  url: state.player.url,
  timelineChanged: state.annot.timelineChanged,
  dispatch: state.deeJay.dispatch,
  playerDuration: state.player.duration,
  playerPlayed: state.player.played
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      dispatchSnackbar: actions.dispatchSnackbar,
      setWSVolume: actions.setWSVolume,
      setWSDuration: actions.setWSDuration,
      setSeek: actions.setSeek,
      resetDeeJay: actions.resetDeeJay,
      setDispatch: actions.setDispatch,
      playerPlay: actions.play,
      waveformAdded: actions.waveformAdded
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
