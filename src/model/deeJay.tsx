import * as actions from "../store";

import React, { Component } from "react";
import { annotAudio, roundIt, sourceAudio } from "./globalFunctions";
import {
  faExpandArrowsAlt,
  faPause,
  faPlay
} from "@fortawesome/free-solid-svg-icons";

import { DeeJayDispatch } from "../store/deeJay/types";
import Duration from "./duration";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LooseObject } from "../store/annot/types";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import repeat from "../assets/icons/player/repeat.png";

interface StateProps {
  annotMedia: any;
  currentTimeline: number;
  dispatch: DeeJayDispatch;
  playerDuration: number;
  playerPlaybackRate: number;
  playerPlayed: number;
  playerPlaying: boolean;
  sourceMedia: any;
  timeline: any;
  timelineChanged: boolean;
  url: string;
  volumes: number[];
}

interface DispatchProps {
  dispatchSnackbar: typeof actions.dispatchSnackbar;
  onSeekChange: typeof actions.onSeekChange;
  onSeekMouseDown: typeof actions.onSeekMouseDown;
  onSeekMouseUp: typeof actions.onSeekMouseUp;
  resetDeeJay: typeof actions.resetDeeJay;
  setDispatch: typeof actions.setDispatch;
  setPlaybackRate: typeof actions.setPlaybackRate;
  setSeek: typeof actions.setSeek;
  setWSDuration: typeof actions.setWSDuration;
  setWSVolume: typeof actions.setWSVolume;
  toggleLoop: typeof actions.toggleLoop;
  togglePlay: typeof actions.togglePlay;
  waveformAdded: typeof actions.waveformAdded;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  private waveSurfers: WaveSurfer[] = [];
  private loadQueue: string[] = [];
  private currentPlaying: string[] = [];
  private clicked: boolean[] = [];
  private currBlob: string = "";
  private speeds: number[] = [0.2, 0.33, 0.5, 0.66, 0.8, 1, 1.25, 1.5, 2, 3, 5];
  private speedsIndex: number = 5;

  componentDidMount = () => {
    let regionsPlugin = require("../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
    [0, 1, 2].forEach((idx: number) => {
      // Build Starting Arrays
      this.loadQueue.push("");
      this.clicked.push(false);
      this.currentPlaying.push("");
      this.waveSurfers.push(
        WaveSurfer.create({
          container: "#waveform" + idx.toString(),
          barWidth: 1,
          cursorWidth: 2,
          backend: "MediaElement",
          progressColor: "#4a74a5",
          cursorColor: "#4a74a5",
          responsive: true,
          waveColor: "#ccc",
          hideScrollbar: true,
          plugins: [regionsPlugin.create()]
        })
      );

      // Log and Process Region Out
      this.waveSurfers[idx].on("region-out", () => {
        console.log(`${idx} Region Out`);
        this.regionOut(idx);
      });

      // Log and Process Region Click
      this.waveSurfers[idx].on("region-click", (region: any) => {
        console.log(`${idx} Region Click`);
        this.regionClick(idx, region);
      });

      // Log and Process Region Created
      this.waveSurfers[idx].on(
        "region-created",
        (region: any, ...args: any) => {
          console.log(`${idx} Region Created`);
          if (region.id === "temp")
            this.waveSurfers[idx].play(region.start, region.end);
        }
      );

      // Log Region Removed
      this.waveSurfers[idx].on("region-removed", (...args: any) =>
        console.log(`${idx} Region Removed`)
      );

      // Log Pause
      this.waveSurfers[idx].on("pause", (...args: any) =>
        console.log(`${idx} Paused`)
      );

      // Log Error
      this.waveSurfers[idx].on("error", (e: any) =>
        console.log("WS Error " + e)
      );

      // Log Loading
      this.waveSurfers[idx].on("loading", (i: number) =>
        console.log(`${idx}: ${i}% Loaded`)
      );

      // Log and Process WS Seeking
      this.waveSurfers[idx].on("seek", (...args: any) => {
        // If WS Had Been Clicked, Log and Process
        // -> Else, Log
        if (this.clicked[idx]) {
          console.log(`${idx} Seeking: Setting Player Time`);

          // Fetch Current Milestone and Calculate Relative Rate/Time
          const currM = this.getCurrentMilestone(idx);
          const playbackRate =
            idx === 0
              ? 1
              : (currM.stopTime - currM.startTime) /
                (currM.data[0].clipStop - currM.data[0].clipStart);
          const relativeTime =
            idx === 0
              ? this.waveSurfers[idx].getCurrentTime() /
                this.waveSurfers[idx].getDuration()
              : ((this.waveSurfers[idx].getCurrentTime() -
                  currM.data[0].clipStart) *
                  playbackRate +
                  currM.startTime) /
                this.waveSurfers[0].getDuration();

          // Play Player with Specific Settings
          this.props.setPlaybackRate(playbackRate);
          this.props.setSeek(relativeTime);
          this.props.togglePlay(true);

          // Clear Clicked
          this.clicked[idx] = false;
        } else console.log(`${idx} Seeking: No Click`);
      });

      // Log Play
      this.waveSurfers[idx].on("play", (...args: any) => {
        console.log(`${idx} Playing${this.clicked[idx] ? " and Clicked" : ""}`);
      });
    });
  };

  componentDidUpdate() {
    let currSync: string[] = [];
    if (this.props.currentTimeline !== -1)
      currSync = this.props.timeline[this.props.currentTimeline].syncMedia;
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
        if (this.loadQueue[idx] || this.currentPlaying[idx]) {
          this.loadQueue[idx] = "";
          this.waveSurfers[idx].empty();
          this.currentPlaying[idx] = "";
        }
      } else {
        // If Something is Playing in the Current WS, Allow Certain Actions
        // -> If LoadQueue Has Something in the Current WS, Check if it Can Load
        // -> Else, Re-Search
        if (this.currentPlaying[idx]) {
          // If the Wave Surfer is Ready, Allow Certain Actions
          if (this.waveSurfers[idx].isReady) {
            // Set Volume if Different from State
            if (this.waveSurfers[idx].getVolume() !== this.props.volumes[idx])
              this.waveSurfers[idx].setVolume(
                this.props.volumes[idx] * this.props.volumes[idx]
              );

            // Set Clip if Directed by State and Reset State Clip Start/Stop to -1
            if (
              this.props.dispatch.dispatchType &&
              (this.props.dispatch.wsNum === idx ||
                (this.props.dispatch.wsNum === -1 && idx === 2))
            ) {
              this.dispatchDJ();
            }
          }
        } else if (this.loadQueue[idx]) {
          // If the LoadQueue File Can Be Loaded, Load It
          if (this.fileAllowed(this.loadQueue[idx])) {
            let wave = "";
            if (idx === 0) {
              wave = this.props.sourceMedia.filter(
                (f: any) => f.blobURL === this.loadQueue[idx]
              )[0].waveform.wavedata;
            } else {
              wave = this.props.annotMedia.filter(
                (f: any) => f.blobURL === this.loadQueue[idx]
              )[0].waveform.wavedata;
            }

            // Load the File, and Change CurrentPlaying and LoadQueue Accordingly
            this.currentPlaying[idx] = this.loadQueue[idx];
            const wsFunction = "waveform-".repeat(+!wave) + "ready";
            if (wave)
              this.waveSurfers[idx].load(this.loadQueue[idx], JSON.parse(wave));
            else this.waveSurfers[idx].load(this.loadQueue[idx]);
            this.loadQueue[idx] = "";

            // Set Event Watcher for Ready
            let waveformReady = () => {
              console.log(`${idx} Waveform Ready`);
              this.onSurferReady(idx);
              this.waveSurfers[idx].un(wsFunction, waveformReady);
            };
            this.waveSurfers[idx].on(wsFunction, waveformReady);
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
            let wave =
              idx === 0
                ? this.props.sourceMedia.filter(
                    (f: any) => f.blobURL === loadFile
                  )[0].waveform
                : this.props.annotMedia.filter(
                    (f: any) => f.blobURL === loadFile
                  )[0].waveform;

            // Load the File, and Change CurrentPlaying Accordingly
            const wsFunction = "waveform-".repeat(+!wave) + "ready";
            if (wave) this.waveSurfers[idx].load(loadFile, JSON.parse(wave));
            else this.waveSurfers[idx].load(loadFile);
            this.currentPlaying[idx] = loadFile;

            // Set Event Watcher for Ready
            let waveformReady = () => {
              console.log(`${idx} Waveform Ready`);
              this.onSurferReady(idx);
              this.waveSurfers[idx].un(wsFunction, waveformReady);
            };
            this.waveSurfers[idx].on(wsFunction, waveformReady);
          } else {
            // Add File to LoadQueue
            this.loadQueue[idx] = loadFile;
          }
        }
      }
    });
  }

  // Processes WS Leaving Region
  regionOut = (idx: any) => {
    // Remove the Specified WS's Region, if it Exists, and Redraw
    if (this.waveSurfers[idx].regions.list.temp !== undefined)
      this.waveSurfers[idx].regions.list.temp.remove();
    this.checkStop();
  };

  // Processes Mouse Input on Region
  regionClick = (idx: number, region: any) => {
    // Seek to Specified Region Time and Redraw
    this.waveSurfers[idx].seekTo(region.start);
  };

  // Checks for Whether or not Given Blob is wsAllowed
  fileAllowed = (blobURL: string) => {
    if (blobURL === "") return false;
    let tempSrc = this.props.sourceMedia.filter(
      (m: any) => m.blobURL === blobURL
    );
    let tempAnnot = this.props.annotMedia.filter(
      (m: any) => m.blobURL === blobURL
    );
    return (
      (tempSrc.length === 1 && tempSrc[0].wsAllowed) ||
      (tempAnnot.length === 1 && tempAnnot[0].wsAllowed)
    );
  };

  // Process WS Once Ready
  onSurferReady = (idx: number) => {
    // Set Volume to Initial Value
    this.waveSurfers[idx].setVolume(this.props.volumes[idx]);

    // Add WS Waveform to Cache
    const waveIn = {
      ref: this.currentPlaying[idx],
      // True: Source, False: Annot
      sourceAnnot: idx === 0,
      wavedata: this.waveSurfers[idx].exportPCM(1024, 10000, true)
    };
    this.props.waveformAdded(waveIn);

    // Set WS Duration
    this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());

    // Sync and Start Player if Necessary
    if (idx === 0) {
      this.waveSurfers[idx].play();
      this.props.setSeek(
        this.waveSurfers[idx].getCurrentTime() /
          this.waveSurfers[idx].getDuration()
      );
      this.props.togglePlay(true);
    }
  };

  // Sets Volume Based on Input Slider
  setVolume = (e: any) => {
    this.props.setWSVolume(parseInt(e.target.id), e.target.value);
  };

  // Resets Volumes of and Stops all but Specified WS
  solo = (wsNum: number, noVolReset?: boolean) => {
    [0, 1, 2].forEach((idx: number) => {
      if (
        noVolReset &&
        this.waveSurfers[idx].getVolume() > 0.5 &&
        idx !== wsNum
      ) {
        this.props.setWSVolume(idx, 0);
      } else if (!noVolReset) {
        this.props.setWSVolume(idx, +(idx === wsNum));
      }
      if (idx !== wsNum) this.waveSurfers[idx].stop();
      this.waveSurfers[idx].seekTo(0);
      this.waveSurfers[idx].setPlaybackRate(1);
    });
  };

  // Processes Click on a Waveform
  waveformClick = (wsNum: number) => {
    this.clicked[wsNum] = true;
    this.solo(wsNum);
    this.clearRegions();
    this.waveSurfers[wsNum].play();
  };

  // Clears All WS Regions
  clearRegions = () => {
    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].regions.list.temp !== undefined)
        this.waveSurfers[idx].regions.list.temp.remove();
    });
  };

  // Fetches the Current Milestone of the Specified WS
  getCurrentMilestone = (
    wsNum: number,
    dispatch: DeeJayDispatch = { dispatchType: "" }
  ) => {
    if (!dispatch && wsNum === 0) {
      console.log("Getting Milestone of WS0 with No Dispatch.");
    }
    return this.props.timeline[this.props.currentTimeline].milestones
      .filter((m: any) => {
        return wsNum === 0
          ? m.startTime === dispatch.clipStart &&
              m.stopTime === dispatch.clipStop
          : m.data.filter((d: any) => {
              return dispatch.dispatchType !== ""
                ? d.clipStart === dispatch.clipStart &&
                    d.clipStop === dispatch.clipStop &&
                    d.channel ===
                      `${wsNum === 1 ? "Careful" : "Translation"}Merged`
                : d.clipStart <= this.waveSurfers[wsNum].getCurrentTime() &&
                    this.waveSurfers[wsNum].getCurrentTime() < d.clipStop &&
                    d.channel ===
                      `${wsNum === 1 ? "Careful" : "Translation"}Merged`;
            }).length === 1;
      })
      .map((m: any) => {
        return wsNum === 0
          ? m
          : {
              ...m,
              data: m.data.filter(
                (d: any) =>
                  d.channel ===
                  `${wsNum === 1 ? "Careful" : "Translation"}Merged`
              )
            };
      })[0];
  };

  checkStop = () => {
    let play = false;
    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].isPlaying()) play = true;
    });
    if (!play) this.props.togglePlay(play);
  };

  // Responds to DJ Dispatches
  dispatchDJ = () => {
    // Responsible for Stopping Clips at their End
    const clipPause = () => {
      // Only Stop Video Play if no Other WSs are Playing
      this.checkStop();
      this.waveSurfers[wsNum].un("pause", clipPause);
    };

    // Fetch the Necessary WSNum
    const wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;
    const dispatch = { ...this.props.dispatch };
    this.props.setDispatch({ dispatchType: "" });
    this.clearRegions();

    // Declare Necessary Switch Variables
    const actives: number[] = [];
    let currM: any = {};
    let playbackRate: number = 1;
    let relativeTime: number = 0;
    switch (dispatch.dispatchType) {
      // Processes the Seek Bar
      case "PlayerSeek":
        // Solve Undefined Issues
        dispatch.refStart = dispatch.refStart || 0;

        // Grab the One Milestone with Data that Matches the Video's Time
        currM = this.props.timeline[
          this.props.currentTimeline
        ].milestones.filter((m: any) => {
          dispatch.refStart = dispatch.refStart || 0;
          return (
            m.startTime <= dispatch.refStart && dispatch.refStart < m.stopTime
          );
        })[0];

        // Determine Which WSs are Active
        [0, 1, 2].forEach((idx: number) => {
          if (
            this.waveSurfers[idx].getVolume() > 0 ||
            this.waveSurfers[idx].isPlaying()
          )
            actives.push(idx);
        });

        // If Only One Active Player
        // -> Else If Two
        // -> Else Three
        if (actives.length === 1) {
          actives.forEach((idx: number) => {
            if (idx === 0) this.waveSurfers[0].play(dispatch.refStart);
            else {
              dispatch.refStart = dispatch.refStart || 0;
              let currMData = currM.data.filter(
                (d: any) =>
                  d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
              );
              if (currMData.length === 1) {
                playbackRate =
                  (currM.stopTime - currM.startTime) /
                  (currMData[0].clipStop - currMData[0].clipStart);
                this.props.setPlaybackRate(playbackRate);
                this.waveSurfers[idx].play(
                  (dispatch.refStart - currM.startTime) / playbackRate +
                    currMData[0].clipStart
                );
              }
            }
          });
        } else if (actives.length === 2) {
          if (actives.includes(0)) {
            this.waveSurfers[0].play(dispatch.refStart);
          }
          if (actives.includes(1)) {
            let currMData = currM.data.filter(
              (d: any) => d.channel === "CarefulMerged"
            );
            if (currMData.length === 1) {
              // Calculate and Set Playback Rate Based on Milestone Times
              playbackRate =
                (currM.stopTime - currM.startTime) /
                (currMData[0].clipStop - currMData[0].clipStart);
              this.waveSurfers[0].setPlaybackRate(playbackRate);
              this.props.setPlaybackRate(playbackRate);
              this.waveSurfers[1].play(
                (dispatch.refStart - currM.startTime) / playbackRate +
                  currMData.clipStart
              );
            }
          }
        }
        break;
      case "PlayPause":
        // 1. Stop Playing those that are Playing
        // 2. Playing those with Volume that are not Playing and Push to Actives
        [0, 1, 2].forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying()) {
            this.waveSurfers[idx].playPause();
          } else if (
            this.props.volumes[idx] &&
            !this.waveSurfers[idx].isPlaying()
          ) {
            this.waveSurfers[idx].playPause();
            actives.push(idx);
          }
        });

        // If Exactly Two WSs are Active
        if (actives.length === 2) {
          // If One of the Two Active is the Source
          if (actives.includes(0)) {
            // Pop Off the Source Audio
            actives.indexOf(0) ? actives.pop() : actives.shift();

            // Grab the One Milestone with Data that Matches Remaining Active
            currM = this.getCurrentMilestone(actives[0]);

            // Calculate and Set Playback Rate Based on Milestone Times
            playbackRate =
              (currM.stopTime - currM.startTime) /
              (currM.data[0].clipStop - currM.data[0].clipStart);
            this.waveSurfers[0].setPlaybackRate(playbackRate);
            this.props.setPlaybackRate(playbackRate);

            // Calculate and Set Relative Time in Seconds of Source Audio
            relativeTime =
              ((this.waveSurfers[actives[0]].getCurrentTime() -
                currM.data[0].clipStart) *
                playbackRate +
                currM.startTime) /
              this.waveSurfers[0].getDuration();
            this.waveSurfers[0].seekTo(relativeTime);
            this.props.setSeek(relativeTime);
          }
        }
        break;
      case "Clip":
        // Grab the One Milestone with Data that Matches Dispatch
        currM = this.getCurrentMilestone(wsNum, dispatch);

        // Clear Any Issues with Undefined Input (There Won't Be Any)
        dispatch.clipStop = dispatch.clipStop || 0;
        dispatch.clipStart = dispatch.clipStart || 0;

        this.solo(wsNum, true);

        // Determine Which WSs are Active
        [0, 1, 2].forEach((idx: number) => {
          if (
            this.waveSurfers[idx].getVolume() > 0 ||
            this.waveSurfers[idx].isPlaying()
          )
            actives.push(idx);
        });

        // Set Volume of Selected WS to Max
        this.props.setWSVolume(wsNum, 1);

        if (actives.length === 1) {
          // Let the User Know Something is Playing
          this.props.dispatchSnackbar("Playing Clip");

          // Add Watchers and Add Region
          this.waveSurfers[wsNum].on("pause", clipPause);
          this.waveSurfers[wsNum].addRegion({
            id: "temp",
            color: "rgba(153,170,255,0.3)",
            start: dispatch.clipStart,
            end: dispatch.clipStop,
            drag: false,
            resize: false
          });

          // Sync Video with Audio
          this.props.setPlaybackRate(
            (currM.stopTime - currM.startTime) /
              (dispatch.clipStop - dispatch.clipStart)
          );
          this.props.setSeek(currM.startTime || 0);
          this.props.togglePlay(true);
        } else if (actives.length === 2) {
          // Determine the King
          const king = actives.reduce((prev, current) => {
            return this.waveSurfers[prev].getVolume() >
              this.waveSurfers[current].getVolume()
              ? prev
              : current;
          });
          // Determine Sub's Start/Stop Times
          const sub = actives[-1 * actives.indexOf(king) + 1];
          const subM =
            sub === 0
              ? currM
              : currM.data.filter(
                  (d: any) =>
                    d.channel ===
                    `${sub === 1 ? "Careful" : "Translation"}Merged`
                )[0];
          const subStart = sub === 0 ? subM.startTime : subM.clipStart;
          const subStop = sub === 0 ? subM.stopTime : subM.clipStop;

          // Calculate and Set Playback Rate Based on Milestone Times
          const subPlaybackRate =
            (subStop - subStart) / (dispatch.clipStop - dispatch.clipStart);
          playbackRate =
            (currM.stopTime - currM.startTime) /
            (dispatch.clipStop - dispatch.clipStart);
          this.waveSurfers[sub].setPlaybackRate(subPlaybackRate);
          this.props.setPlaybackRate(playbackRate);

          // Add Watchers and Add Region
          this.waveSurfers[wsNum].on("pause", clipPause);
          this.waveSurfers[wsNum].addRegion({
            id: "temp",
            color: "rgba(153,170,255,0.3)",
            start: dispatch.clipStart,
            end: dispatch.clipStop,
            drag: false,
            resize: false
          });

          // Calculate and Set Relative Time in Seconds of Source and Sub Audio
          this.waveSurfers[sub].play(subStart, subStop);
          this.props.setSeek(currM.startTime);
          this.props.togglePlay(true);
        }
        break;
      case "Seek":
        console.log(`${wsNum} Entered Seeking`);
        break;
      case "Step":
        this.props.dispatchSnackbar("Stepping");
        break;
      case "PlayThrough":
        this.props.dispatchSnackbar("Playing Through");
        break;
      case "ClipPlus":
        break;
    }

    // this.props.dispatchSnackbar("🎵 DJ Activated 🎵");
  };

  describeVol = (idx: number) =>
    (!this.props.volumes && "Undefined") ||
    (this.props.volumes[idx] > 0.5 && "High") ||
    (this.props.volumes[idx] === 0 && "Muted") ||
    "Low";

  toggleVol = (idx: number) => {
    if (this.waveSurfers[idx] !== undefined && this.waveSurfers[idx].isReady) {
      let name =
        (idx === 0 && "Original Audio set to ") ||
        (idx === 1 && "Careful Audio set to ") ||
        (idx === 2 && "Translation Audio set to ");
      if (this.props.volumes[idx] > 0.5) {
        this.props.dispatchSnackbar(name + "50% (Background)");
        this.props.setWSVolume(idx, 0.5);
      } else if (this.props.volumes[idx] === 0) {
        this.props.dispatchSnackbar(name + "100% (Main)");
        this.props.setWSVolume(idx, 1);
      } else if (this.props.volumes[idx] <= 0.5) {
        this.props.dispatchSnackbar(name + "0% (Muted)");
        this.props.setWSVolume(idx, 0);
      }
    }
  };

  playPauseButton = () => {
    this.props.togglePlay();
    this.props.setDispatch({
      dispatchType: "PlayPause",
      wsNum: -1
    });
  };

  onClickFullscreen = () => {
    // screenfull.request(findDOMNode(this.player))
  };

  minusPlaybackRate = () => {
    if (this.speedsIndex > 0) {
      this.speedsIndex--;
      this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
    }
  };

  plusPlaybackRate = () => {
    if (this.speedsIndex < this.speeds.length - 1) {
      this.speedsIndex++;
      this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
    }
  };

  onSeekMouseDown = (e: any) => {
    this.props.onSeekMouseDown();
  };

  onSeekChange = (e: any) => {
    this.props.onSeekChange(parseFloat(e.target.value));
  };

  onSeekMouseUp = (e: any) => {
    this.props.onSeekMouseUp();
    this.props.setSeek(parseFloat(e.target.value));
    this.props.setDispatch({
      dispatchType: "PlayerSeek",
      wsNum: -1,
      refStart: e.target.value * this.props.playerDuration
    });
  };

  inspect = () => {
    this.waveSurfers[0].getDuration();
    console.log("Inspecting");
  };

  render() {
    // Forms the Rows for Each WS
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
            {this.describeVol(idx)}
            <br />
            {this.waveSurfers[idx]
              ? roundIt(this.waveSurfers[idx].getPlaybackRate(), 2)
              : ""}
          </td>
          <td className="wave-table-volume">
            <input
              id={idx.toString()}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={this.props.volumes[idx]}
              onChange={this.setVolume}
            />
          </td>
          <td
            className="waveform"
            id={"waveform" + idx.toString()}
            onClick={() => this.waveformClick(idx)}
          ></td>
        </tr>
      );
    });

    return (
      <div>
        <div>
          <div className="control-row">
            <div className="control-row-items">
              <button
                className="play-pause-button"
                onClick={() => this.playPauseButton()}
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
              <button onClick={this.minusPlaybackRate}>-</button>
              <div className="playback-rate">
                {roundIt(this.props.playerPlaybackRate, 2)}x
              </div>
              <button onClick={this.plusPlaybackRate}>+</button>
              <input
                className="seek-input"
                max={1}
                min={0}
                onChange={this.onSeekChange}
                onMouseDown={this.onSeekMouseDown}
                onMouseUp={this.onSeekMouseUp}
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
          <div className="current-transcription"></div>
        </div>
        <div className="wave-table-container">
          <table className="wave-table">
            <tbody>{waveTableRows}</tbody>
          </table>
        </div>
        <button onClick={this.inspect} />
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotMedia: state.tree.annotMedia,
  currentTimeline: state.annot.currentTimeline,
  dispatch: state.deeJay.dispatch,
  playerDuration: state.player.duration,
  playerPlaybackRate: state.player.playbackRate,
  playerPlayed: state.player.played,
  playerPlaying: state.player.playing,
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annot.timeline,
  timelineChanged: state.annot.timelineChanged,
  url: state.player.url,
  volumes: state.deeJay.volumes
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      dispatchSnackbar: actions.dispatchSnackbar,
      onSeekChange: actions.onSeekChange,
      onSeekMouseDown: actions.onSeekMouseDown,
      onSeekMouseUp: actions.onSeekMouseUp,
      resetDeeJay: actions.resetDeeJay,
      setDispatch: actions.setDispatch,
      setPlaybackRate: actions.setPlaybackRate,
      setSeek: actions.setSeek,
      setWSDuration: actions.setWSDuration,
      setWSVolume: actions.setWSVolume,
      toggleLoop: actions.toggleLoop,
      togglePlay: actions.togglePlay,
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
