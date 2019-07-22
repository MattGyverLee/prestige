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
  private regionsOn: number = 0;
  private ts: string[] = [];
  private continuing: boolean = false;

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
      this.waveSurfers[idx].setVolume(+(idx === 0));

      // Log and Process Region Out
      this.waveSurfers[idx].on("region-out", () => {
        console.log(`${idx} Region Out`);
        if (this.waveSurfers[idx].regions.list.temp !== undefined)
          this.waveSurfers[idx].regions.list.temp.remove();
        let play = false;
        [0, 1, 2].forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying()) play = true;
        });
        if (!play) this.props.togglePlay(play);
      });

      // Log and Process Region Hover In
      this.waveSurfers[idx].on("region-mouseenter", region => {
        console.log(`${idx} Region Mouse In`);
        this.ts.push(region.id);
        this.regionMouseIn(idx, region);
      });

      // Log and Process Region Hover Out
      this.waveSurfers[idx].on("region-mouseleave", region => {
        console.log(`${idx} Region Mouse out`);
        this.props.dispatchSnackbar("Playing Clip");
        this.ts = this.ts.filter((item: string) => item !== region.id);
        this.regionMouseOut(idx, region);
      });

      // Log and Process Region Click
      this.waveSurfers[idx].on("region-click", (region: any) => {
        console.log(`${idx} Region Click`);
        this.waveSurfers[idx].seekTo(region.start);
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

      // Log Pause and Stop Player if All are Paused
      this.waveSurfers[idx].on("pause", (...args: any) => {
        let play = false;
        [0, 1, 2].forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying()) play = true;
        });
        if (!play) this.props.togglePlay(play);
        console.log(`${idx} Paused`);
      });

      this.waveSurfers[idx].on("finish", (...args: any) => {
        console.log(`${idx} Finished Playing`);
        this.waveSurfers[idx].pause();
      });

      // Log and Process WS Seeking
      this.waveSurfers[idx].on("seek", (...args: any) => {
        // If WS Had Been Clicked => Log and Process
        // -> Else => Log That the Seek was Not Caused by a Click
        if (!this.clicked[idx]) console.log(`${idx} Seeking: No Click`);
        else {
          // Log Action and Reset Clicked and Continuing
          console.log(`${idx} Seeking: Setting Player Time`);
          this.clicked[idx] = this.continuing = false;

          // Fetch Current Milestone and Calculate Relative Rate/Time
          const ws = this.waveSurfers[idx];
          const currM = this.getCurrentMilestone(idx);
          const playbackRate = idx === 0 ? 1 : this.calcPlaybackRate(currM);
          const relTime = this.calcRelativeTime(idx, currM, playbackRate);

          // Function for Loading Next Milestone in Sequence
          let loadNext = () => {
            // Fetch Current Milestone
            const nextM = this.getCurrentMilestone(idx);

            // If There is a Next Milestone and Clip is Continuing => Load Next Clip
            // -> Else => Unsubscribe
            if (!nextM || !this.continuing) ws.un("pause", loadNext);
            else {
              // Play Player with Specific Settings
              const playbackRate = idx === 0 ? 1 : this.calcPlaybackRate(nextM);
              const relTime = this.calcRelativeTime(idx, currM, playbackRate);
              this.props.setPlaybackRate(playbackRate);
              this.props.setSeek(relTime);
              this.props.togglePlay(true);
              let nextMIndex = this.findNextMilestoneIndex(nextM);
              let lastMIndex = this.findLastMilestoneIndex(idx);

              if (nextMIndex === lastMIndex) {
                ws.play(ws.getCurrentTime(), ws.getDuration());
                ws.un("pause", loadNext);
              } else {
                ws.play(
                  ws.getCurrentTime(),
                  idx === 0 ? nextM.stopTime : nextM.data[0].clipStop
                );
              }
            }
          };

          // Play Player with Specific Settings and Start WS to Match It
          this.props.setPlaybackRate(playbackRate);
          this.props.setSeek(relTime);
          this.props.togglePlay(true);
          ws.play(
            ws.getCurrentTime(),
            idx === 0 ? currM.stopTime : currM.data[0].clipStop
          );

          // Set Continuing So That Watcher Knows to Load
          this.continuing = true;

          // Set Watcher for Pausing (Allows for Loading Next Milestone)
          if (this.props.currentTimeline !== -1) ws.on("pause", loadNext);
        }
      });
    });
  };

  componentDidUpdate() {
    const currSync: string[] =
      this.props.currentTimeline !== -1
        ? this.props.timeline[this.props.currentTimeline].syncMedia
        : [];
    if (this.currBlob !== this.props.url) {
      this.currBlob = this.props.url;
      [0, 1, 2].forEach((idx: number) => {
        this.props.setWSVolume(idx, +(idx === 0));
        this.loadQueue[idx] = "";
        this.waveSurfers[idx].empty();
        this.waveSurfers[idx].backend.peaks = [];
        this.currentPlaying[idx] = "";
      });
    }
    [0, 1, 2].forEach((idx: number) => {
      const ws = this.waveSurfers[idx];
      if (currSync.filter((s: any) => s === this.currBlob).length !== 1) {
        if (this.props.currentTimeline === -1) {
          if (idx === 0 && !this.currentPlaying[idx]) {
            ws.load(this.props.url);
            this.currentPlaying[idx] = this.props.url;
          }
          this.checkDispatch(idx);
        }
      } else {
        if (this.currentPlaying[idx] && ws.isReady) {
          this.checkDispatch(idx);
          if (ws.getVolume() !== this.props.volumes[idx])
            ws.setVolume(this.props.volumes[idx] * this.props.volumes[idx]);
        } else if (!this.currentPlaying[idx]) {
          let load = this.loadQueue[idx];
          if (!this.loadQueue[idx]) {
            const audio =
              idx === 0
                ? sourceAudio(this.props.sourceMedia, true).filter(
                    (sa: LooseObject) =>
                      sa.blobURL.includes("_StandardAudio_Normalized.mp3") &&
                      currSync.indexOf(
                        sa.blobURL.substring(
                          0,
                          sa.blobURL.indexOf("_Normalized.mp3")
                        ) + ".wav"
                      ) !== -1
                  )
                : annotAudio(
                    this.props.annotMedia,
                    true,
                    this.props.currentTimeline,
                    this.props.timeline
                  ).filter((aa: LooseObject) =>
                    aa.blobURL.includes(
                      (idx - 1 ? "Translation" : "Careful") + "_Merged.mp3"
                    )
                  );
            load = audio.length === 1 ? audio[0].blobURL : "";
          }

          if (!this.fileAllowed(load)) this.loadQueue[idx] = load;
          else {
            const wave = (idx === 0
              ? this.props.sourceMedia.filter((f: any) => f.blobURL === load)
              : this.props.annotMedia.filter((f: any) => f.blobURL === load))[0]
              .waveform;
            const wsFunction = "waveform-".repeat(+!wave) + "ready";
            this.currentPlaying[idx] = load;
            if (wave) ws.load(load, JSON.parse(wave));
            else ws.load(load);
            this.loadQueue[idx] = "";

            const waveformReady = () => {
              console.log(`${idx} Waveform Ready`);
              const waveIn = {
                ref: this.currentPlaying[idx],
                sourceAnnot: idx === 0,
                wavedata: this.waveSurfers[idx].exportPCM(1024, 10000, true)
              };
              this.props.waveformAdded(waveIn);

              this.props.setWSDuration(
                idx,
                this.waveSurfers[idx].getDuration()
              );

              if (idx === 0) {
                this.waveSurfers[idx].play(0);
                this.props.setSeek(0);
                this.props.togglePlay(true);
              }
              ws.un(wsFunction, waveformReady);
            };
            ws.on(wsFunction, waveformReady);
          }
        }
      }
    });
  }

  componentWillUnmount() {
    console.log("UnMounting DeeJay");
  }

  checkDispatch = (idx: number) => {
    if (
      this.props.dispatch.wsNum === idx ||
      (this.props.dispatch.wsNum === -1 && idx === 2)
    )
      this.dispatchDJ();
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

  // Resets Volumes of and Stops all but Specified WS
  solo = (wsNum: number, noVolReset?: boolean) => {
    [0, 1, 2].forEach((idx: number) => {
      if (
        noVolReset &&
        this.waveSurfers[idx].getVolume() > 0.5 ** 0.25 &&
        idx !== wsNum
      ) {
        this.props.setWSVolume(idx, 0);
      } else if (!noVolReset) {
        this.props.setWSVolume(idx, +(idx === wsNum));
      }
      if (idx !== wsNum) this.waveSurfers[idx].stop();
      this.waveSurfers[idx].setPlaybackRate(1);
    });
  };

  // Clears All Temp WS Regions
  clearDispatchLeftovers = () => {
    this.continuing = false;
    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].regions.list.temp !== undefined)
        this.waveSurfers[idx].regions.list.temp.remove();
      this.clicked[idx] = false;
    });
  };

  regionMouseIn = (inIdx: number, sourceRegion: any) => {
    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].regions.list[sourceRegion.id]) {
        const thisRegion = this.waveSurfers[idx].regions.list[sourceRegion.id];
        thisRegion.color = thisRegion.color.replace("0.1", "0.5");
        thisRegion.element.id = "hover";
        if (this.regionsOn === 2) {
          thisRegion.element.style.backgroundColor = "rgba(18, 117, 240, 0.1)";
        }
        thisRegion.element.style.outlineOffset = "-3px";
        this.forceUpdate();
      }
    });
  };

  regionMouseOut = (inIdx: number, sourceRegion: any) => {
    [0, 1, 2].forEach((idx: number) => {
      if (this.waveSurfers[idx].regions.list[sourceRegion.id]) {
        const thisRegion = this.waveSurfers[idx].regions.list[sourceRegion.id];
        thisRegion.element.id = "";
        if (this.regionsOn === 2) {
          thisRegion.element.style.backgroundColor = "";
        }
        this.forceUpdate();
      }
    });
  };

  toggleAllRegions = () => {
    if (this.regionsOn === 0 || this.regionsOn === 1) {
      // Clear Regions first
      [0, 1, 2].forEach((idx: number) => {
        this.waveSurfers[idx].clearRegions();
        this.waveSurfers[idx].clearRegions();
      });
      // Draw Regions
      let milestones = this.props.timeline[this.props.currentTimeline]
        .milestones;
      milestones.forEach((m: any) => {
        const startId = m.startId;
        const tempColor = this.regionsOn
          ? this.randomColor(0.0)
          : this.randomColor(0.1);
        this.waveSurfers[0].addRegion({
          id: startId,
          start: m.startTime,
          end: m.stopTime,
          color: tempColor,
          drag: false,
          resize: false
        });
        m.data
          .filter(
            (data: any) =>
              data.channel !== undefined && data.channel.endsWith("Merged")
          )
          .forEach((d: LooseObject) => {
            this.waveSurfers[d.channel.startsWith("Careful") ? 1 : 2].addRegion(
              {
                id: startId,
                start: d.clipStart,
                end: d.clipStop,
                color: tempColor,
                drag: false,
                resize: false
              }
            );
          });
      });
      this.regionsOn++;
    } else {
      [0, 1, 2].forEach((idx: number) => {
        this.waveSurfers[idx].clearRegions();
      });
      this.regionsOn = 0;
    }
  };

  randomColor(alpha: number) {
    return (
      "rgba(" +
      [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha
      ] +
      ")"
    );
  }

  // Fetches the Current Milestone of the Specified WS
  getCurrentMilestone = (
    wsNum: number,
    dispatch: DeeJayDispatch = { dispatchType: "" }
  ) => {
    if (!dispatch && wsNum === 0)
      console.log("Getting Milestone of WS0 with No Dispatch.");
    if (this.props.currentTimeline === -1) return -1;
    const channel = `${wsNum === 1 ? "Careful" : "Translation"}Merged`;
    return this.props.timeline[this.props.currentTimeline].milestones
      .filter((m: any) => {
        return wsNum === 0
          ? dispatch.dispatchType !== ""
            ? m.startTime === dispatch.clipStart &&
              m.stopTime === dispatch.clipStop
            : m.startTime <= this.waveSurfers[wsNum].getCurrentTime() &&
              this.waveSurfers[wsNum].getCurrentTime() < m.stopTime
          : m.data.filter((d: any) => {
              return dispatch.dispatchType !== ""
                ? d.clipStart === dispatch.clipStart &&
                    d.clipStop === dispatch.clipStop &&
                    d.channel === channel
                : d.clipStart <= this.waveSurfers[wsNum].getCurrentTime() &&
                    this.waveSurfers[wsNum].getCurrentTime() < d.clipStop &&
                    d.channel === channel;
            }).length === 1;
      })
      .map((m: any) => {
        return {
          ...m,
          data: m.data.filter((d: any) => wsNum === 0 || d.channel === channel)
        };
      })[0];
  };

  calcPlaybackRate = (milestone: any) =>
    (milestone.stopTime - milestone.startTime) /
    (milestone.data[0].clipStop - milestone.data[0].clipStart);

  calcRelativeTime = (idx: number, milestone: any, playbackRate: number) =>
    idx === 0
      ? this.waveSurfers[idx].getCurrentTime() /
        this.waveSurfers[idx].getDuration()
      : ((this.waveSurfers[idx].getCurrentTime() -
          milestone.data[0].clipStart) *
          playbackRate +
          milestone.startTime) /
        this.waveSurfers[0].getDuration();

  findNextMilestoneIndex = (milestone: any) =>
    this.props.timeline === -1
      ? -1
      : this.props.timeline[this.props.currentTimeline].milestones.findIndex(
          (m: any) => m.startTime === milestone.startTime
        );

  findLastMilestoneIndex = (idx: number) => {
    if (this.props.currentTimeline === -1) return 0;
    const milestones = this.props.timeline[this.props.currentTimeline]
      .milestones;
    return idx === 0
      ? milestones.length - 1
      : milestones
          .map((m: any) =>
            m.data.findIndex(
              (d: any) =>
                d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
            )
          )
          .reduce((a: number, b: number) => (a > b ? a : b), 0);
  };

  // Responds to DJ Dispatches
  dispatchDJ = () => {
    // Fetch the Necessary WSNum
    const wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;

    // Grab and Clear Dispatch
    const dispatch = { ...this.props.dispatch };
    this.props.setDispatch({ dispatchType: "" });

    // Clear Things Associated with Previous Dispatches
    this.clearDispatchLeftovers();

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
        currM =
          this.props.currentTimeline === -1
            ? -1
            : this.props.timeline[this.props.currentTimeline].milestones.filter(
                (m: any) => {
                  dispatch.refStart = dispatch.refStart || 0;
                  return (
                    m.startTime <= dispatch.refStart &&
                    dispatch.refStart < m.stopTime
                  );
                }
              )[0];

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
              const currMData = currM.data.filter(
                (d: any) =>
                  d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
              );
              if (currMData.length === 1) {
                playbackRate = this.calcPlaybackRate(currM);
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
            const currMData = currM.data.filter(
              (d: any) => d.channel === "CarefulMerged"
            );
            if (currMData.length === 1) {
              // Calculate and Set Playback Rate Based on Milestone Times
              playbackRate = this.calcPlaybackRate(currM);
              this.waveSurfers[0].setPlaybackRate(
                playbackRate >= 15
                  ? 14.5
                  : playbackRate <= 0.2
                  ? 0.2
                  : playbackRate
              );
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
            playbackRate = this.calcPlaybackRate(currM);
            this.waveSurfers[0].setPlaybackRate(
              playbackRate >= 15
                ? 14.5
                : playbackRate <= 0.2
                ? 0.2
                : playbackRate
            );
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
              : this.getCurrentMilestone(0, {
                  dispatchType: "",
                  wsNum: 0,
                  clipStart: currM.startTime,
                  clipStop: currM.stopTime
                }).data.filter(
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
          this.waveSurfers[sub].setPlaybackRate(
            subPlaybackRate >= 15
              ? 14.5
              : subPlaybackRate <= 0.2
              ? 0.2
              : subPlaybackRate
          );
          this.props.setPlaybackRate(playbackRate);

          // Add Watchers and Add Region
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

  toggleVol = (idx: number) => {
    if (this.waveSurfers[idx] !== undefined && this.waveSurfers[idx].isReady) {
      let name =
        (idx === 0 && "Original Audio set to ") ||
        (idx === 1 && "Careful Audio set to ") ||
        (idx === 2 && "Translation Audio set to ");
      if (this.props.volumes[idx] > 0.5 ** 0.25) {
        this.props.dispatchSnackbar(name + "50% (Background)");
        this.props.setWSVolume(idx, 0.5 ** 0.25);
      } else if (this.props.volumes[idx] === 0) {
        this.props.dispatchSnackbar(name + "100% (Main)");
        this.props.setWSVolume(idx, 1);
      } else if (this.props.volumes[idx] <= 0.5 ** 0.25) {
        this.props.dispatchSnackbar(name + "0% (Muted)");
        this.props.setWSVolume(idx, 0);
      }
    }
  };

  onClickFullscreen = () => {
    // screenfull.request(findDOMNode(this.player))
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
            {(!this.props.volumes && "Undefined") ||
              (this.props.volumes[idx] > 0.5 ** 0.25 && "High") ||
              (this.props.volumes[idx] === 0 && "Muted") ||
              "Low"}
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
              value={roundIt(this.props.volumes[idx] ** 4, 2)}
              onChange={e =>
                this.props.setWSVolume(
                  parseInt(e.target.id),
                  parseFloat(e.target.value) ** 0.25
                )
              }
              disabled={
                !this.waveSurfers[idx] || !this.waveSurfers[idx].isReady
              }
            />
          </td>
          <td
            className="waveform"
            id={"waveform" + idx.toString()}
            onClick={() => {
              [0, 1, 2].forEach((wsNum: number) => {
                while (this.waveSurfers[wsNum].handlers.pause.length > 1)
                  this.waveSurfers[wsNum].un(
                    "pause",
                    this.waveSurfers[wsNum].handlers.pause[1]
                  );
              });
              this.clearDispatchLeftovers();
              this.clicked[idx] = true;
              this.solo(idx);
              this.waveSurfers[idx].play();
            }}
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
                onClick={() => {
                  this.props.togglePlay();
                  this.props.setDispatch({
                    dispatchType: "PlayPause",
                    wsNum: -1
                  });
                }}
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
              <button
                onClick={() => {
                  if (this.speedsIndex > 0) {
                    this.speedsIndex--;
                    this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
                  }
                }}
              >
                -
              </button>
              <div className="playback-rate">
                {roundIt(this.props.playerPlaybackRate, 2)}x
              </div>
              <button
                onClick={() => {
                  if (this.speedsIndex < this.speeds.length - 1) {
                    this.speedsIndex++;
                    this.props.setPlaybackRate(this.speeds[this.speedsIndex]);
                  }
                }}
              >
                +
              </button>
              <input
                className="seek-input"
                max={1}
                min={0}
                onChange={e =>
                  this.props.onSeekChange(parseFloat(e.target.value))
                }
                onMouseDown={this.props.onSeekMouseDown}
                onMouseUp={e => {
                  this.props.onSeekMouseUp();
                  this.props.setSeek(
                    parseFloat((e.target as HTMLInputElement).value)
                  );
                  this.props.setDispatch({
                    dispatchType: "PlayerSeek",
                    wsNum: -1,
                    refStart:
                      parseFloat((e.target as HTMLInputElement).value) *
                      this.props.playerDuration
                  });
                }}
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
        <button
          onClick={() => {
            this.waveSurfers[0].getDuration();
            console.log("Inspecting");
          }}
        />{" "}
        <button onClick={() => this.toggleAllRegions()}>
          {this.regionsOn === 2 ? "Hide Regions" : "Toggle Regions"}
        </button>
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
