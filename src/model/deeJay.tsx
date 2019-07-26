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
import { LooseObject, Milestone } from "../store/annot/types";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import repeat from "../assets/icons/player/repeat.png";
import { speeds } from "../store/player/reducers";

interface StateProps {
  annotMedia: any;
  currentTimeline: number;
  dispatch: DeeJayDispatch;
  playbackMultiplier: number;
  playerDuration: number;
  playerRate: number;
  playerPlayed: number;
  playerPlaying: boolean;
  sourceMedia: any;
  speedsIndex: number;
  timeline: any;
  timelineChanged: boolean;
  url: string;
  volumes: number[];
}

interface DispatchProps {
  changeSpeedsIndex: typeof actions.changeSpeedsIndex;
  onSeekChange: typeof actions.onSeekChange;
  onSeekMouseDown: typeof actions.onSeekMouseDown;
  onSeekMouseUp: typeof actions.onSeekMouseUp;
  resetDeeJay: typeof actions.resetDeeJay;
  setDispatch: typeof actions.setDispatch;
  setPlaybackMultiplier: typeof actions.setPlaybackMultiplier;
  setPlaybackRate: typeof actions.setPlaybackRate;
  setSeek: typeof actions.setSeek;
  setWSDuration: typeof actions.setWSDuration;
  setWSVolume: typeof actions.setWSVolume;
  toggleLoop: typeof actions.toggleLoop;
  togglePlay: typeof actions.togglePlay;
  enqueueSnackbar: typeof actions.enqueueSnackbar;
  closeSnackbar: typeof actions.closeSnackbar;
  waveformAdded: typeof actions.waveformAdded;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  private clicked: boolean[] = [];
  private clipStart: boolean = false;
  private continuing: boolean = false;
  private currBlob: string = "";
  private currentPlaying: string[] = [];
  private currentSpeeds: number[] = [];
  private idxs = [0, 1, 2];
  private loadQueue: string[] = [];
  private regionsOn: number = 0;
  private ts: string[] = [];
  private voNum: number = 0;
  private waveSurfers: WaveSurfer[] = [];

  componentDidMount = () => {
    let regionsPlugin = require("../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
    this.idxs.forEach((idx: number) => {
      // Build Starting Arrays
      this.clicked.push(false);
      this.currentPlaying.push("");
      this.currentSpeeds.push(1);
      this.loadQueue.push("");
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
      this.waveSurfers[idx].empty();
      this.waveSurfers[idx].setVolume(+(idx === 0));

      // Process Region Out
      this.waveSurfers[idx].on("region-out", () => {
        if (this.waveSurfers[idx].regions.list.temp !== undefined)
          this.waveSurfers[idx].regions.list.temp.remove();
        let play = false;
        this.idxs.forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying()) play = true;
        });
        if (!play) this.props.togglePlay(play);
      });

      // Process Region Hover In
      this.waveSurfers[idx].on("region-mouseenter", region => {
        if (this.regionsOn !== 0) {
          this.ts.push(region.id);
          this.regionMouseIn(region);
        }
      });

      // Process Region Hover Out
      this.waveSurfers[idx].on("region-mouseleave", region => {
        if (this.regionsOn !== 0) {
          this.ts = this.ts.filter((item: string) => item !== region.id);
          this.regionMouseOut(region);
        }
      });

      // Process Region Click
      this.waveSurfers[idx].on("region-click", (region: any) => {
        this.waveSurfers[idx].seekTo(region.start);
      });

      // Process Region Created
      this.waveSurfers[idx].on(
        "region-created",
        (region: any, ...args: any) => {
          if (region.id === "temp")
            this.waveSurfers[idx].play(region.start, region.end);
        }
      );

      // Log Pause and Stop Player if All are Paused
      this.waveSurfers[idx].on("pause", (...args: any) => {
        let play = false;
        this.idxs.forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying()) play = true;
        });
        if (!play) this.props.togglePlay(play);
        console.log(`${idx} Paused`);
      });

      // Process WS Play
      this.waveSurfers[idx].on("play", (...args: any) => {
        if (this.clipStart) this.clipStart = false;
      });

      // Process WS Finish
      this.waveSurfers[idx].on("finish", (...args: any) => {
        this.waveSurfers[idx].pause();
      });

      // Process WS Error by Displaying Through Snackbar
      this.waveSurfers[idx].on("error", (err: any) => {
        this.sendSnackbar(
          `WaveSurfer ${idx} error:` +
            JSON.stringify(err) +
            "File: " +
            this.currentPlaying[idx],
          undefined,
          "error"
        );
      });

      // Process WS Seeking
      this.waveSurfers[idx].on("seek", (...args: any) => {
        if (this.clicked[idx]) {
          // Log Action and Reset Clicked and Continuing
          this.clicked[idx] = this.continuing = false;
          const ws = this.waveSurfers[idx];

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
              this.props.setPlaybackRate(playbackRate);
              this.props.setSeek(
                roundIt(this.calcRelativeTime(idx, nextM, playbackRate), 3)
              );
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
          const currM = this.getCurrentMilestone(idx);
          const playbackRate = idx === 0 ? 1 : this.calcPlaybackRate(currM);
          const relTime = this.calcRelativeTime(idx, currM, playbackRate);
          this.props.setPlaybackRate(playbackRate);
          this.props.setSeek(roundIt(relTime, 3));
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

  // Processes Reaction to State Updates
  componentDidUpdate() {
    const currSync: string[] =
      this.props.currentTimeline !== -1
        ? this.props.timeline[this.props.currentTimeline].syncMedia
        : [];
    if (this.currBlob !== this.props.url) {
      this.currBlob = this.props.url;
      this.idxs.forEach((idx: number) => {
        this.props.setWSVolume(idx, +(idx === 0));
        this.loadQueue[idx] = "";
        this.waveSurfers[idx].empty();
        this.waveSurfers[idx].backend.peaks = [];
        this.currentPlaying[idx] = "";
      });
    }
    this.idxs.forEach((idx: number) => {
      const ws = this.waveSurfers[idx];
      if (currSync.filter((s: any) => s === this.currBlob).length !== 1) {
        if (idx === 0 && !this.currentPlaying[idx] && this.props.url !== "") {
          this.loadFileWS(idx, this.props.url);
          this.currentPlaying[idx] = this.props.url;
        } else if (this.currentPlaying[idx]) this.checkPlayingValues(idx);
      } else {
        if (this.currentPlaying[idx] && ws.isReady)
          this.checkPlayingValues(idx);
        else if (!this.currentPlaying[idx]) {
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
          else this.loadFileWS(idx, load);
        }
      }
    });
  }

  // Loads a WS and Subscribes it to an "onReady" Function
  loadFileWS = (idx: number, load: string) => {
    const ws = this.waveSurfers[idx];
    const wave = (idx === 0
      ? this.props.sourceMedia.filter((f: any) => f.blobURL === load)
      : this.props.annotMedia.filter((f: any) => f.blobURL === load))[0]
      .waveform;
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

      this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());

      // Draw Regions
      if (this.props.currentTimeline !== -1)
        this.props.timeline[this.props.currentTimeline].milestones.forEach(
          (m: any) => {
            const tempColor = this.randomColor(0.0);
            if (idx === 0)
              this.waveSurfers[idx].addRegion({
                id: m.startId,
                start: m.startTime,
                end: m.stopTime,
                color: tempColor,
                drag: false,
                resize: false
              });
            else
              m.data.forEach((d: LooseObject) => {
                if (
                  d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
                )
                  this.waveSurfers[idx].addRegion({
                    id: m.startId,
                    start: d.clipStart,
                    end: d.clipStop,
                    color: tempColor,
                    drag: false,
                    resize: false
                  });
              });
          }
        );

      if (idx === 0) {
        this.waveSurfers[idx].play(0);
        this.props.setSeek(0);
        this.props.togglePlay(true);
      }
      ws.un("waveform-ready", waveformReady);
    };
    ws.on("waveform-ready", waveformReady);
  };

  componentWillUnmount() {
    console.log("UnMounting DeeJay Component");
    // todo: Make sure Wavesurfers Unloaded Gently.
  }

  // Does Necessary Playback Checks (Dispatch, Volume, Playback Rate) for a Given WS
  checkPlayingValues = (idx: number) => {
    const ws = this.waveSurfers[idx];
    if (
      this.props.dispatch.wsNum === idx ||
      (this.props.dispatch.wsNum === -1 && idx === 0)
    )
      this.dispatchDJ();
    if (ws.getVolume() !== this.props.volumes[idx])
      ws.setVolume(this.props.volumes[idx]);
    if (
      ws.getPlaybackRate() !==
      roundIt(this.currentSpeeds[idx] * this.props.playbackMultiplier, 2)
    )
      ws.setPlaybackRate(
        roundIt(this.currentSpeeds[idx] * this.props.playbackMultiplier, 2)
      );
  };

  // Checks for Whether or not Given Blob is wsAllowed
  fileAllowed = (blobURL: string) => {
    const tempSrc = this.props.sourceMedia.filter(
      (m: LooseObject) => m.blobURL === blobURL
    );
    const tempAnnot = this.props.annotMedia.filter(
      (m: LooseObject) => m.blobURL === blobURL
    );
    return (
      (tempSrc.length === 1 && tempSrc[0].wsAllowed) ||
      (tempAnnot.length === 1 && tempAnnot[0].wsAllowed)
    );
  };

  // Resets Volumes of and Stops all but Specified WS
  solo = (wsNum: number, resetAll: boolean) => {
    // If #On = #Low => Set Only wsNum On
    if (
      resetAll ||
      this.idxs.filter((idx: number) => this.waveSurfers[idx].getVolume() > 0)
        .length ===
        this.idxs.filter(
          (idx: number) =>
            this.waveSurfers[idx].getVolume() <= 0.5 ** 0.25 &&
            this.waveSurfers[idx].getVolume() > 0
        ).length
    ) {
      this.idxs.forEach((idx: number) => {
        if (idx !== wsNum) {
          this.waveSurfers[idx].setVolume(0);
          this.props.setWSVolume(idx, 0);
        }
      });
      this.waveSurfers[wsNum].setVolume(1);
      this.props.setWSVolume(wsNum, 1);
    }

    // Stop All Not wsNum and Reset Playback Rates
    this.idxs.forEach((idx: number) => {
      if (idx !== wsNum) this.waveSurfers[idx].stop();
      this.waveSurfers[idx].setPlaybackRate(1);
      this.currentSpeeds[idx] = 1;
    });
  };

  // Clears All Temp WS Regions and "pause" Subscriptions
  clearDispatchLeftovers = () => {
    this.idxs.forEach((idx: number) => {
      while (this.waveSurfers[idx].handlers.pause.length > 1)
        this.waveSurfers[idx].un(
          "pause",
          this.waveSurfers[idx].handlers.pause[1]
        );
      if (this.waveSurfers[idx].regions.list.temp !== undefined)
        this.waveSurfers[idx].regions.list.temp.remove();
      this.clicked[idx] = false;
    });
    this.continuing = false;
  };

  regionMouseIn = (sourceRegion: any) =>
    this.idxs.forEach((idx: number) => {
      if (
        this.waveSurfers[idx].regions.list[sourceRegion.id] &&
        this.regionsOn !== 0
      ) {
        const thisRegion = this.waveSurfers[idx].regions.list[sourceRegion.id];
        console.log(this.regionsOn);
        thisRegion.color = thisRegion.color.replace("0.1", "0.5");
        thisRegion.element.id = "hover";
        this.waveSurfers[idx].regions.list[sourceRegion.id].onDrag(0);
        if (this.regionsOn === 2)
          thisRegion.element.style.backgroundColor = "rgba(18, 117, 240, 0.1)";
        thisRegion.element.style.outlineOffset = "-3px";
      }
    });

  regionMouseOut = (sourceRegion: any) =>
    this.idxs.forEach((idx: number) => {
      if (
        this.waveSurfers[idx].regions.list[sourceRegion.id] &&
        this.regionsOn !== 0
      ) {
        const thisRegion = this.waveSurfers[idx].regions.list[sourceRegion.id];
        thisRegion.color = thisRegion.color.replace("0.5", "0.1");
        thisRegion.element.id = "";
        this.waveSurfers[idx].regions.list[sourceRegion.id].onDrag(0);
        if (this.regionsOn === 2) thisRegion.element.style.backgroundColor = "";
      }
    });

  // Toggle Between Various Representations of the Current Timeline's Regions
  toggleAllRegions = () => {
    if (this.props.currentTimeline !== -1 && this.regionsOn !== 2) {
      const alpha = this.regionsOn ? "0.0" : "0.1";
      this.props.timeline[this.props.currentTimeline].milestones.forEach(
        (m: any) => {
          const reg0 = this.findRegion(0, m.startTime, m.stopTime);
          if (reg0) {
            this.waveSurfers[0].regions.list[
              reg0
            ].color = this.waveSurfers[0].regions.list[reg0].color
              .split(",")
              .map((v: string) => (v.endsWith(")") ? `${alpha})` : v))
              .join(",");
            this.waveSurfers[0].regions.list[reg0].onDrag(0);
          }
          m.data.forEach((d: LooseObject) => {
            const wsNum = d.channel.endsWith("Merged")
              ? d.channel.startsWith("Careful")
                ? 1
                : 2
              : 0;
            if (wsNum) {
              const reg = this.findRegion(wsNum, d.clipStart, d.clipStop);
              if (reg) {
                this.waveSurfers[wsNum].regions.list[
                  reg
                ].color = this.waveSurfers[wsNum].regions.list[reg].color
                  .split(",")
                  .map((v: string) => (v.endsWith(")") ? `${alpha})` : v))
                  .join(",");
                this.waveSurfers[wsNum].regions.list[reg].onDrag(0);
              }
            }
          });
        }
      );
    }
    this.regionsOn = ++this.regionsOn % 3;
  };

  // Produces a Random RGBA Color with Provided Alpha
  randomColor = (alpha: number) =>
    "rgba(" +
    [
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      alpha
    ] +
    ")";

  // Fetches the Current Milestone of the Specified WS
  getCurrentMilestone = (
    wsNum: number,
    dispatch: DeeJayDispatch = { dispatchType: "" },
    filter?: number
  ) => {
    if (!filter) filter = wsNum;
    if (this.props.currentTimeline === -1) return -1;
    const channel = `${filter === 1 ? "Careful" : "Translation"}Merged`;
    return this.props.timeline[this.props.currentTimeline].milestones
      .filter((m: Milestone) => {
        return wsNum === 0
          ? dispatch.dispatchType !== ""
            ? m.startTime === dispatch.clipStart &&
              m.stopTime === dispatch.clipStop
            : m.startTime <= this.waveSurfers[wsNum].getCurrentTime() &&
              this.waveSurfers[wsNum].getCurrentTime() < m.stopTime
          : m.data.filter((d: LooseObject) => {
              return dispatch.dispatchType !== ""
                ? d.clipStart === dispatch.clipStart &&
                    d.clipStop === dispatch.clipStop &&
                    d.channel === channel
                : d.clipStart <= this.waveSurfers[wsNum].getCurrentTime() &&
                    this.waveSurfers[wsNum].getCurrentTime() < d.clipStop &&
                    d.channel === channel;
            }).length === 1;
      })
      .map((m: Milestone) => {
        return {
          ...m,
          data: m.data.filter(
            (d: LooseObject) =>
              (filter === 0 && wsNum === 0) || d.channel === channel
          )
        };
      })[0];
  };

  // Returns the Milestone Containing the Given Time and Possibly a Specific Data Element
  getInterMilestone = (time: number, wsNum?: number) =>
    this.props.currentTimeline === -1
      ? -1
      : this.props.timeline[this.props.currentTimeline].milestones
          .filter((m: any) => {
            return m.startTime <= time && time < m.stopTime;
          })
          .map((m: Milestone) => {
            return {
              ...m,
              data: m.data.filter(
                (d: LooseObject) =>
                  wsNum === 0 ||
                  d.channel ===
                    `${wsNum === 1 ? "Careful" : "Translation"}Merged`
              )
            };
          })[0];

  // Returns an Array with the Indexes of Active WSs
  getActives = () =>
    this.idxs.filter(
      (idx: number) =>
        this.waveSurfers[idx].getVolume() > 0 ||
        this.waveSurfers[idx].isPlaying()
    );

  // Calculates PlaybackRate for Source/Video Based on Milestone or Milestone and Dispatch
  calcPlaybackRate = (
    milestone: any,
    dispatch?: DeeJayDispatch,
    dispatch2?: DeeJayDispatch
  ) => {
    const playbackRate = roundIt(
      ((dispatch2 ? dispatch2.clipStop : milestone.stopTime) -
        (dispatch2 ? dispatch2.clipStart : milestone.startTime)) /
        ((dispatch ? dispatch.clipStop : milestone.data[0].clipStop) -
          (dispatch ? dispatch.clipStart : milestone.data[0].clipStart)),
      2
    );
    return playbackRate >= 15 ? 14.5 : playbackRate <= 0.2 ? 0.2 : playbackRate;
  };

  // Calculates Relative Time for Source/Video Based on a WS, Milestone, and PlaybackRate
  calcRelativeTime = (idx: number, milestone: any, playbackRate: number) =>
    idx === 0
      ? this.waveSurfers[idx].getCurrentTime() /
        this.waveSurfers[idx].getDuration()
      : ((this.waveSurfers[idx].getCurrentTime() -
          milestone.data[0].clipStart) *
          playbackRate +
          milestone.startTime) /
        this.waveSurfers[0].getDuration();

  // Finds the Index of the Milestone After the One Provided
  findNextMilestoneIndex = (milestone: any) =>
    this.props.timeline === -1
      ? -1
      : this.props.timeline[this.props.currentTimeline].milestones.findIndex(
          (m: any) => m.startTime === milestone.startTime
        );

  // Finds the Index of the Last Milestone of a Particular Type
  findLastMilestoneIndex = (wsNum: number) => {
    if (this.props.currentTimeline === -1) return 0;
    const milestones = this.props.timeline[this.props.currentTimeline]
      .milestones;
    return wsNum === 0
      ? milestones.length - 1
      : milestones
          .map((m: any, idx: number) =>
            m.data.findIndex(
              (d: any) =>
                d.channel === `${wsNum === 1 ? "Careful" : "Translation"}Merged`
            ) === -1
              ? 0
              : idx
          )
          .reduce((a: number, b: number) => (a > b ? a : b), 0);
  };

  findRegion = (wsNum: number, start: number, end: number) => {
    const id = Object.keys(this.waveSurfers[wsNum].regions.list).filter(
      (id: any) => {
        const r = this.waveSurfers[wsNum].regions.list[id];
        return r.start === start && r.end === end;
      }
    );
    return id.length === 1 ? id[0] : "";
  };

  // Responds to DJ Dispatches
  dispatchDJ = () => {
    // Store Dispatch Into Local Variable and Clear It
    const dispatch = { ...this.props.dispatch };
    this.props.setDispatch({ dispatchType: "" });
    this.clearDispatchLeftovers();

    // Necessary Switch Variables for WS, Active WSs, Milestone, and PlaybackRate
    const wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;
    let actives: number[] = [];
    let currM: any = {};
    let playbackRate: number = 1;
    // Process Dispatch Based on its Type
    switch (dispatch.dispatchType) {
      case "PlayerSeek":
        // Un-"Undefined" Dispatch
        dispatch.refStart = dispatch.refStart || 0;

        // Fetch the Active WSs and Processes Based on How Many
        actives = this.getActives();
        if (actives.length === 1) {
          // "Click" WS So That it can Automatically Seek Beyond Beginning Milestone
          this.clicked[actives[0]] = true;

          // If WS 0 => Seek To Ref
          // -> Else If Milestone Data Exists => Seek To Relative Ref
          currM = this.getInterMilestone(dispatch.refStart, actives[0]);
          if (actives[0] === 0)
            this.waveSurfers[0].seekTo(
              dispatch.refStart / this.waveSurfers[actives[0]].getDuration()
            );
          else if (currM.data.length === 1)
            this.waveSurfers[actives[0]].seekTo(
              ((dispatch.refStart - currM.startTime) / playbackRate +
                currM.data[0].clipStart) /
                this.waveSurfers[actives[0]].getDuration()
            );
        }
        break;
      case "PlayPause":
        // If Playing => Stop All
        // -> If Not Playing, Fetch all the "Actives"
        this.idxs.forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying() && this.props.playerPlaying)
            this.waveSurfers[idx].playPause();
          else if (this.props.volumes[idx] && !this.props.playerPlaying)
            actives.push(idx);
        });

        // Process Based on Number of Active WSs
        console.log(actives.toString());
        if (actives.length === 1) {
          // "Click" WS So That it can Automatically Seek Beyond Beginning Milestone
          this.clicked[actives[0]] = true;

          // Seek the Provided WS with a Relative Time Based on Player's Current
          const elapsed = this.props.playerPlayed * this.props.playerDuration;
          currM = this.getInterMilestone(elapsed, actives[0]);
          this.waveSurfers[actives[0]].seekTo(
            actives[0] === 0
              ? this.props.playerPlayed
              : (((elapsed - currM.startTime) /
                  (currM.stopTime - currM.startTime)) *
                  (currM.data[0].clipStop - currM.data[0].clipStart) +
                  currM.data[0].clipStart) /
                  this.waveSurfers[actives[0]].getDuration()
          );
        }
        break;
      case "Clip":
        // Notify Via Snackbar
        this.sendSnackbar("Playing Clip");

        // Grab Current Milestone and "Solo" the Given WS
        currM = this.getCurrentMilestone(wsNum, dispatch);
        dispatch.clipStop = dispatch.clipStop || 0;
        dispatch.clipStart = dispatch.clipStart || 0;
        this.solo(wsNum, false);
        this.waveSurfers[wsNum].setVolume(1);
        this.props.setWSVolume(wsNum, 1);

        // Grab High and Low Audio WSs from the Active WSs
        actives = this.getActives();
        actives.forEach((idx: number) => this.waveSurfers[idx].pause());
        const highs = actives.filter(
          (idx: number) => this.waveSurfers[idx].getVolume() > 0.5 ** 0.25
        );
        const lows = actives.filter(
          (idx: number) =>
            this.waveSurfers[idx].getVolume() > 0 &&
            this.waveSurfers[idx].getVolume() < 0.5 ** 0.25
        );

        // For Each WS in High, Starting at End
        let recentStart = () => {};
        let voiceOvers: ((data: string) => void)[] = [];
        for (let x = highs.length - 1; x >= 0; x--) {
          // Grab its Milestone
          const m1Dispatch = {
            dispatchType: "Clip",
            clipStart: currM.startTime,
            clipStop: currM.stopTime
          };
          const m1 = this.getCurrentMilestone(0, m1Dispatch, highs[x]);

          // Process Only if it WS is 0 or M1 has Data
          if (highs[x] === 0 || m1.data.length !== 0) {
            // Craft its Region
            const region = {
              id: "temp",
              color: "rgba(153,170,255,0.3)",
              start: highs[x] === 0 ? m1.startTime : m1.data[0].clipStart,
              end: highs[x] === 0 ? m1.stopTime : m1.data[0].clipStop,
              drag: false,
              resize: false
            };

            // For Each WS in Low
            let nextVoiceOver = () => {};
            for (let y = 0, l = lows.length; y < l; y++) {
              // Grab the Sub's Milestone
              const m2Dispatch = {
                dispatchType: "Clip",
                clipStart: m1.startTime,
                clipStop: m1.stopTime
              };
              const m2 = this.getCurrentMilestone(0, m2Dispatch, lows[y]);

              // Process Only if it Has Data
              if (lows[y] === 0 || m2.data.length !== 0) {
                // Create and Push Next Voiceover
                nextVoiceOver = () => {
                  // Craft its Region
                  this.waveSurfers[lows[y]].addRegion({
                    ...region,
                    start: lows[y] === 0 ? m2.startTime : m2.data[0].clipStart,
                    end: lows[y] === 0 ? m2.stopTime : m2.data[0].clipStop
                  });

                  // Determine its Playback Rate
                  const p2 = this.calcPlaybackRate(m2, m1Dispatch, m2Dispatch);
                  this.waveSurfers[lows[y]].setPlaybackRate(p2);
                  this.currentSpeeds[lows[y]] = p2;
                };
                voiceOvers.push(nextVoiceOver);
              }
            }

            // Craft RecentStart for Linking Together the Clips
            recentStart = () => {
              if (x === 0 || !this.clipStart) {
                this.waveSurfers[highs[x]].addRegion(region);
                if (this.voNum + x < voiceOvers.length)
                  voiceOvers[this.voNum + x]("");
                this.props.setPlaybackRate(this.calcPlaybackRate(m1, dispatch));
                this.props.setSeek(m1.startTime || 0);
                this.props.togglePlay(true);
                if (x > 0)
                  this.waveSurfers[highs[x - 1]].un("pause", recentStart);
              }
            };

            // Sub Next Lowest WS to RecentStart Only if Not Lowest WS
            if (x > 0) this.waveSurfers[highs[x - 1]].on("pause", recentStart);
          }
        }

        // Prepare for Multiple VOs or Multiple Clips
        this.voNum = 0;
        this.clipStart = true;

        // Start First Clip
        recentStart();

        // Link Second VO if it Exists
        if (voiceOvers.length > 1 && lows.length > 1) {
          const secondVO = () => {
            this.voNum = 1;
            recentStart();
            this.waveSurfers[0].un("pause", secondVO);
          };
          this.waveSurfers[0].on("pause", secondVO);
        }
        break;
    }
  };

  // Toggles the Volume Between Three Predetermined States
  toggleVol = (idx: number) => {
    if (this.waveSurfers[idx] !== undefined && this.waveSurfers[idx].isReady) {
      let name =
        (idx === 0 && "Original Audio set to ") ||
        (idx === 1 && "Careful Audio set to ") ||
        (idx === 2 && "Translation Audio set to ");
      if (this.props.volumes[idx] > 0.5 ** 0.25) {
        this.sendSnackbar(name + "50% (Background)", "vol" + idx.toString());
        this.props.setWSVolume(idx, 0.5 ** 0.25);
      } else if (this.props.volumes[idx] === 0) {
        this.sendSnackbar(name + "100% (Main)", "vol" + idx.toString());
        this.props.setWSVolume(idx, 1);
      } else if (this.props.volumes[idx] <= 0.5 ** 0.25) {
        this.sendSnackbar(name + "0% (Muted)", "vol" + idx.toString());
        this.props.setWSVolume(idx, 0);
      }
    }
  };

  onClickFullscreen = () => {
    // screenfull.request(findDOMNode(this.player))
  };

  // Enqueues the Next Snackbar Mesage
  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) => {
    this.props.enqueueSnackbar({
      message: inMessage,
      options: {
        key: inKey || new Date().getTime() + Math.random(),
        variant: vType || "default",
        action: (key: LooseObject) => (
          <button onClick={() => this.props.closeSnackbar(key)}>Dismiss</button>
        )
      }
    });
  };

  render() {
    // Forms the Rows for Each WS
    const waveTableRows = this.idxs.map((idx: number) => {
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
              this.clearDispatchLeftovers();
              this.clicked[idx] = true;
              this.solo(idx, true);
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
                  if (this.props.speedsIndex > 0) {
                    this.props.changeSpeedsIndex("-");
                  }
                }}
              >
                -
              </button>
              <div className="playback-rate">
                {roundIt(this.props.playbackMultiplier, 2)}x
              </div>
              <button
                onClick={() => {
                  if (this.props.speedsIndex < speeds.length - 1) {
                    this.props.changeSpeedsIndex("+");
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
                  this.clearDispatchLeftovers();
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
  playbackMultiplier: state.player.playbackMultiplier,
  playerDuration: state.player.duration,
  playerRate: state.player.playbackRate,
  playerPlayed: state.player.played,
  playerPlaying: state.player.playing,
  sourceMedia: state.tree.sourceMedia,
  speedsIndex: state.player.speedsIndex,
  timeline: state.annot.timeline,
  timelineChanged: state.annot.timelineChanged,
  url: state.player.url,
  volumes: state.deeJay.volumes
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      changeSpeedsIndex: actions.changeSpeedsIndex,
      closeSnackbar: actions.closeSnackbar,
      enqueueSnackbar: actions.enqueueSnackbar,
      onSeekChange: actions.onSeekChange,
      onSeekMouseDown: actions.onSeekMouseDown,
      onSeekMouseUp: actions.onSeekMouseUp,
      resetDeeJay: actions.resetDeeJay,
      setDispatch: actions.setDispatch,
      setPlaybackMultiplier: actions.setPlaybackMultiplier,
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

const withSnackbar = require("notistack").withSnackbar;
export default withSnackbar(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DeeJay)
);
