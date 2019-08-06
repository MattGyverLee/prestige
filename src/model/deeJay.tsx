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
  dimensions: LooseObject;
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
  private currBlob: string = "";
  private currentPlaying: string[] = [];
  private currentSpeeds: number[] = [];
  private idxs = [0, 1, 2];
  private loadQueue: string[] = [];
  private regionColors: string[] = [];
  private regionsOn: number = 0;
  private ts: string[] = [];
  private voNum: number = 0;
  private waveSurfers: WaveSurfer[] = [];

  // Set Up DeeJay Instance Variables
  componentDidMount = () => {
    // Build Starting Arrays and Create Wave Surfers
    this.idxs.forEach((idx: number) => {
      this.clicked.push(false);
      this.currentPlaying.push("");
      this.currentSpeeds.push(1);
      this.loadQueue.push("");
      this.createWaveSurfer(idx);
    });
  };

  // Processes Reaction to State Updates
  componentDidUpdate() {
    // Fetch Current Sync Media if Available
    const currSync: string[] =
      this.props.currentTimeline !== -1
        ? this.props.timeline[this.props.currentTimeline].syncMedia
        : [];

    // If currentURL and StateURL Don't Match
    if (this.currBlob !== this.props.url) {
      // Add Colors for Possible Regions if Necessary
      if (this.props.currentTimeline !== -1) {
        this.regionColors = [];
        this.props.timeline[this.props.currentTimeline].milestones.forEach(() =>
          this.regionColors.push(
            "rgba(" +
              [
                ~~(Math.random() * 255),
                ~~(Math.random() * 255),
                ~~(Math.random() * 255),
                0.0
              ] +
              ")"
          )
        );
      }

      // Match URLs
      this.currBlob = this.props.url;

      // Reset Private Variables in Preparation
      this.idxs.forEach((idx: number) => {
        this.props.setWSVolume(idx, +(idx === 0));
        this.loadQueue[idx] = "";
        this.waveSurfers[idx].destroy();
        this.createWaveSurfer(idx);
        this.waveSurfers[idx].backend.peaks = [];
        this.waveSurfers[idx].clearRegions();
        this.currentPlaying[idx] = "";
      });
    }

    // Loop Through all WSs
    this.idxs.forEach((idx: number) => {
      // If Sync Media Does Not Contain currBlob => No Timeline Actions
      // -> Else => Timeline Actions
      if (currSync.filter((s: any) => s === this.currBlob).length !== 1) {
        // If WS is Playing => Check for Playing Actions
        // -> Else If WS0, and Not Empty URL => Load and Play URL
        if (this.currentPlaying[idx]) this.checkPlayingValues(idx);
        else if (!idx && this.props.url) this.loadFileWS(idx, this.props.url);
      } else {
        // If WS is Ready and Playing => Check for Playing Actions
        // -> Else => Search and Load
        if (this.currentPlaying[idx] && this.waveSurfers[idx].isReady)
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

          // Load File if Possible, Otherwise Put Into LoadQueue
          if (!this.fileAllowed(load)) this.loadQueue[idx] = load;
          else this.loadFileWS(idx, load);
        }
      }
    });
    [0, 1, 2].forEach(idx => {
      if (this.waveSurfers[idx].height !== this.rowHeight()) {
        this.waveSurfers[idx].height = this.rowHeight();
      }
    });
  }
  rowHeight = () => {
    if (
      this.props.dimensions !== undefined &&
      this.props.dimensions.AppDeeJay !== undefined &&
      this.props.dimensions.AppDeeJay.height !== undefined &&
      this.props.dimensions.AppDeeJay.height !== -1
    ) {
      return Math.round((this.props.dimensions.AppDeeJay.height * 0.8) / 4);
    } else {
      return 128;
    }
  };
  createWaveSurfer = (idx: number) => {
    const regionsPlugin = require("../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
    this.waveSurfers[idx] = WaveSurfer.create({
      container: "#waveform" + idx.toString(),
      barWidth: 1,
      cursorWidth: 2,
      backend: "MediaElement",
      progressColor: "#4a74a5",
      cursorColor: "#4a74a5",
      responsive: true,
      waveColor: "#ccc",
      hideScrollbar: true,
      height: this.rowHeight(),
      plugins: [regionsPlugin.create()]
    });
    this.waveSurfers[idx].empty();
    this.waveSurfers[idx].setVolume(+(idx === 0));

    // Process Region Hover In
    this.waveSurfers[idx].on("region-mouseenter", (region: any) => {
      if (this.regionsOn !== 0) {
        this.ts.push(region.id);
        this.idxs.forEach((idx: number) => {
          if (
            this.waveSurfers[idx].regions.list[region.id] &&
            this.regionsOn !== 0
          ) {
            const thisRegion = this.waveSurfers[idx].regions.list[region.id];
            thisRegion.element.id = "hover";
            this.updateRegionAlpha(
              idx,
              region.id,
              this.regionsOn === 1 ? 0.7 : 0.1
            );
            // thisRegion.element.style.backgroundColor = "rgba(18, 117, 240, 0.1)";
            thisRegion.element.style.outlineOffset = "-3px";
            thisRegion.onDrag(0);
          }
        });
      }
    });

    // Process Region Hover Out
    this.waveSurfers[idx].on("region-mouseleave", (region: any) => {
      if (this.regionsOn !== 0) {
        this.ts = this.ts.filter((item: string) => item !== region.id);
        this.idxs.forEach((idx: number) => {
          if (
            this.waveSurfers[idx].regions.list[region.id] &&
            this.regionsOn !== 0
          ) {
            const thisRegion = this.waveSurfers[idx].regions.list[region.id];
            thisRegion.element.id = "";
            this.updateRegionAlpha(
              idx,
              region.id,
              this.regionsOn === 1 ? 0.1 : 0.0
            );
            if (this.regionsOn === 2)
              thisRegion.element.style.backgroundColor = "";
            thisRegion.onDrag(0);
          }
        });
      }
    });

    // Log Pause and Stop Player if All are Paused
    this.waveSurfers[idx].on("pause", () => {
      console.log(`${idx} Paused`);
      let play = false;
      this.idxs.forEach((idx: number) => {
        if (this.waveSurfers[idx].isPlaying()) play = true;
      });
      if (!play) this.props.togglePlay(play);
      // this.toggleAllRegions(true);
    });

    // Process WS Play
    this.waveSurfers[idx].on("play", () => {
      if (this.clipStart) this.clipStart = false;
    });

    // Process WS Finish
    this.waveSurfers[idx].on("finish", () => {
      this.waveSurfers[idx].pause();
    });

    // Process WS Error by Displaying Through Snackbar
    this.waveSurfers[idx].on("error", (err: any) => {
      console.log(err);
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
    this.waveSurfers[idx].on("seek", () => {
      if (!this.clicked[idx]) console.log(`${idx} No Click Seeking`);
      else {
        // Log Action and Reset Clicked
        console.log(`${idx} Click Seeking`);
        this.clicked[idx] = false;
        const ws = this.waveSurfers[idx];
        const currMiles = this.props.timeline[this.props.currentTimeline]
          .milestones;

        // Grab Current Milestone and Set Volum of Given WS
        const currM = this.getCurrentMilestone(idx);
        this.waveSurfers[idx].setVolume(1);
        this.props.setWSVolume(idx, 1);

        // Grab High and Low Audio WSs from the Active WSs
        const actives = this.getActives();
        const highs = actives.filter(
          (a: number) => this.waveSurfers[a].getVolume() > 0.5 ** 0.25
        );
        const lows = actives.filter(
          (a: number) =>
            this.waveSurfers[a].getVolume() &&
            this.waveSurfers[a].getVolume() <= 0.5 ** 0.25
        );

        // Find Lowest Element of High that Can Play the Seeked Milestone
        const currMD = {
          dispatchType: "WSSeek",
          clipStart: currM.startTime,
          clipStop: currM.stopTime
        };
        const lowestValidHigh = highs.reduce(
          (a: number, b: number) =>
            (!b || this.getCurrentMilestone(0, currMD, b).data.length) &&
            (b < a || a === -1)
              ? b
              : a,
          -1
        );

        // If LowestValidHigh is not this WS => Set Clicked and Relative Time for What Is
        // -> Else => Set Up Subscriptions and Start Playing
        if (lowestValidHigh !== idx) {
          // Allow LowestValidHigh to Be Processed in Seek, and Then Seek It
          this.clicked[lowestValidHigh] = true;
          this.setRelativeTime(
            idx,
            lowestValidHigh,
            currM,
            this.getCurrentMilestone(0, currMD, lowestValidHigh)
          );
        } else {
          lows.forEach((low: number) => {
            const lowM = this.getCurrentMilestone(0, currMD, low);
            if (!low || lowM.data.length)
              this.setRelativeTime(idx, low, currM, lowM);
          });

          // Subscribe Highs to Function for Loading Next Milestone in Sequence
          highs.forEach((high: number, hIdx: number) => {
            const highWS = this.waveSurfers[high];

            // Function for Loading Next Clip on Pause
            const loadNext = () => {
              // If No Highs are Playing => Load Next
              if (!this.voNum) {
                // Cycle Through All Highs (from First After Current, Ending on Current)
                for (let i = 1, l = highs.length + 1; i < l; i++) {
                  // Grab Index of Next WS and the WS Itself
                  const nextIdx = highs[(hIdx + i) % highs.length];

                  // Calculate Timeline Index of the Coming Milestone:
                  // - 1. FindMilestoneIndex of High's Current Time
                  // - 2. + (0 If Next WS <= High Else -1)
                  let nextM: any;
                  if (this.getCurrentMilestone(high)) {
                    const comingMIdx =
                      this.findNextMilestoneIndex(
                        this.getCurrentMilestone(high)
                      ) +
                      +(highWS.getDuration() - highWS.getCurrentTime() < 0.05) +
                      +(nextIdx <= high) +
                      -1;

                    if (comingMIdx === currMiles.length)
                      highWS.un("pause", loadNext);
                    else {
                      // Grab currComingM
                      const currComingM = currMiles[comingMIdx];
                      nextM = this.getCurrentMilestone(
                        0,
                        {
                          dispatchType: "WSSeek",
                          clipStart: currComingM.startTime,
                          clipStop: currComingM.stopTime
                        },
                        nextIdx
                      );
                      // If NextM Exists and NextM Has Data if Necessary => Load Next Clip
                      if (nextM && (!nextIdx || nextM.data.length)) {
                        // Force Exit Loop Now
                        i = l;
                        this.checkVOAndPlay(nextIdx, lows, nextM);
                      }
                    }
                  }
                }
              } else {
                const currComingM =
                  currMiles[
                    this.findNextMilestoneIndex(this.getCurrentMilestone(idx)) -
                      1
                  ];
                this.checkVOAndPlay(
                  idx,
                  lows,
                  this.getCurrentMilestone(
                    0,
                    {
                      dispatchType: "WSSeek",
                      clipStart: currComingM.startTime,
                      clipStop: currComingM.stopTime
                    },
                    idx
                  )
                );
              }
            };

            // If Current Milestone Has What it Needs => Set Relative Time
            const highM = this.getCurrentMilestone(0, currMD, high);
            if (!high || highM.data.length)
              this.setRelativeTime(idx, high, currM, highM);

            // Subscribe High for Pausing (Allows for Loading Next Milestone)
            if (this.props.currentTimeline !== -1) highWS.on("pause", loadNext);
          });

          // If Current Timeline is not Empty => Play According to Milestones
          // -> Else => Play as Normal
          if (this.props.currentTimeline !== -1)
            this.checkVOAndPlay(idx, lows, currM);
          else {
            // Sync Player and Play WS From Now Until End of Clip
            this.props.setSeek(ws.getCurrentTime() / ws.getDuration());
            this.props.togglePlay(true);
            ws.play(ws.getCurrentTime(), ws.getDuration());
          }
        }
      }
    });
  };

  checkVOAndPlay = (idx: number, lows: number[], m: Milestone) => {
    const mD = {
      dispatchType: "WSSeek",
      clipStart: m.startTime,
      clipStop: m.stopTime
    };
    const validLows = lows.filter(
      (l: any) => !l || this.getCurrentMilestone(0, mD, l).data.length
    );
    let voM;
    if (
      validLows.length &&
      ((voM = this.getCurrentMilestone(0, mD, validLows[this.voNum])).data
        .length ||
        !validLows[this.voNum])
    ) {
      if (this.voNum) this.setRelativeTime(validLows[this.voNum], idx, voM, m);
      this.setRelativePlay(idx, validLows[this.voNum], m, voM);
      this.voNum = (this.voNum + 1) % validLows.length;
    }
    this.seekSyncAndPlay(idx, m);
  };

  seekSyncAndPlay = (idx: number, m: Milestone) => {
    // Sync Player
    const playbackRate = idx === 0 ? 1 : this.calcPlaybackRate(m);
    this.props.setPlaybackRate(playbackRate);
    this.props.setSeek(this.calcRelativeTime(idx, m, playbackRate));
    this.props.togglePlay(true);

    // Play From Now Until End of Clip
    this.waveSurfers[idx].play(
      this.waveSurfers[idx].getCurrentTime(),
      this.findNextMilestoneIndex(m) === this.findLastMilestoneIndex(idx)
        ? this.waveSurfers[idx].getDuration()
        : this.clipTime(idx, m, false)
    );
  };

  // Gets the Desired StarTime, StopTime, ClipStart, or ClipStop of the Milestone According to WS Idx
  clipTime = (idx: number, milestone: any, startOrStop: boolean) =>
    idx === 0
      ? startOrStop
        ? milestone.startTime
        : milestone.stopTime
      : startOrStop
      ? milestone.data[0].clipStart
      : milestone.data[0].clipStop;

  // Sets WS Idx2 to the Time Relative to WS Idx1
  // -> Returns Playback Rate
  setRelativeTime = (idx1: number, idx2: number, mile1: any, mile2: any) => {
    // Grab Filtered Milestone of the First High
    const playbackRate = this.calcPlaybackRate(
      mile2,
      {
        dispatchType: "WSSeek",
        clipStart: this.clipTime(idx1, mile1, true),
        clipStop: this.clipTime(idx1, mile1, false)
      },
      {
        dispatchType: "WSSeek",
        clipStart: this.clipTime(idx2, mile2, true),
        clipStop: this.clipTime(idx2, mile2, false)
      }
    );

    // Set High Clicked and Seek it to the Relative Time
    // This Makes First High First One to Play
    this.waveSurfers[idx2].seekTo(
      this.calcRelativeTime(idx1, mile1, playbackRate, idx2, mile2)
    );
    return playbackRate;
  };

  setRelativePlay = (idx1: number, idx2: number, mile1: any, mile2: any) => {
    this.currentSpeeds[idx2] = this.setRelativeTime(idx1, idx2, mile1, mile2);
    this.waveSurfers[idx2].setPlaybackRate(this.currentSpeeds[idx2]);
    this.waveSurfers[idx2].play(
      this.waveSurfers[idx2].getCurrentTime(),
      this.clipTime(idx2, mile2, false)
    );
  };

  // Loads a WS and Subscribes it to an "onReady" Function
  loadFileWS = (idx: number, load: string) => {
    // Grab WS, Its WF (if it exists), and Subscription Function (based on if WF exists or not)
    const ws = this.waveSurfers[idx];
    const wave = (idx === 0
      ? this.props.sourceMedia.filter((f: any) => f.blobURL === load)
      : this.props.annotMedia.filter((f: any) => f.blobURL === load))[0]
      .waveform;
    const sub = (wave ? "" : "waveform-") + "ready";

    // Subscription Function to Act Whenever WS is Ready or WFReady
    const waveformReady = () => {
      // Add WF and Set WS Duration
      this.props.waveformAdded({
        ref: this.currentPlaying[idx],
        sourceAnnot: idx === 0,
        wavedata: this.waveSurfers[idx].exportPCM(1024, 10000, true)
      });
      this.props.setWSDuration(idx, this.waveSurfers[idx].getDuration());

      // Draw All Regions currentTimeline Has
      if (this.props.currentTimeline !== -1)
        this.props.timeline[this.props.currentTimeline].milestones.forEach(
          (m: any, mileNum: number) => {
            if (idx === 0) {
              this.waveSurfers[idx].addRegion({
                id: m.startId,
                start: m.startTime,
                end: m.stopTime,
                color: this.regionColors[mileNum],
                drag: false,
                resize: false
              });
              this.waveSurfers[idx].regions.list[m.startId].onDrag(0);
            } else
              m.data.forEach((d: LooseObject) => {
                if (
                  d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
                ) {
                  this.waveSurfers[idx].addRegion({
                    id: m.startId,
                    start: d.clipStart,
                    end: d.clipStop,
                    color: this.regionColors[mileNum],
                    drag: false,
                    resize: false
                  });
                  this.waveSurfers[idx].regions.list[m.startId].onDrag(0);
                }
              });
          }
        );

      // Start Up if WS0, Reload All Regions, and unsubscribe
      if (idx === 0) {
        this.waveSurfers[idx].play(0);
        this.props.setSeek(0);
        this.props.togglePlay(true);
      }
      this.toggleAllRegions(true);
      ws.un(sub, waveformReady);
    };

    // Subscribe to Appropriate Ready Function
    ws.on(sub, waveformReady);

    // Load WS (with/without Wave) and Update LoadQueue and CurrentPlaying
    this.currentPlaying[idx] = load;
    if (wave) ws.load(load, JSON.parse(wave));
    else ws.load(load);
    this.loadQueue[idx] = "";
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
    const expVolume = roundIt(
      this.currentSpeeds[idx] * this.props.playbackMultiplier >= 15
        ? 14.5
        : this.currentSpeeds[idx] * this.props.playbackMultiplier <= 0.2
        ? 0.2
        : this.currentSpeeds[idx] * this.props.playbackMultiplier,
      2
    );
    if (ws.getPlaybackRate() !== expVolume) ws.setPlaybackRate(expVolume);
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
      (tempSrc.length && tempSrc[0].wsAllowed) ||
      (tempAnnot.length && tempAnnot[0].wsAllowed)
    );
  };

  // Resets Volumes of and Stops all but Specified WS
  solo = (wsNum: number, resetAll: boolean) => {
    // If Reset All or Any High => Set Only wsNum On
    if (
      resetAll ||
      !this.idxs.reduce(
        (a: number, b: number) =>
          +(a || this.waveSurfers[b].getVolume() > 0.5 ** 0.25),
        0
      )
    )
      this.idxs.forEach((idx: number) => {
        this.waveSurfers[idx].setVolume(+(idx === wsNum));
        this.props.setWSVolume(idx, +(idx === wsNum));
      });

    // Stop All Not wsNum and Reset Playback Rates
    this.idxs.forEach((idx: number) => {
      if (idx !== wsNum) this.waveSurfers[idx].stop();
      this.currentSpeeds[idx] = 1;
      this.waveSurfers[idx].setPlaybackRate(this.currentSpeeds[idx]);
    });
  };

  // Clears All Temp WS Regions and "pause" Subscriptions
  clearDispatchLeftovers = () => {
    this.idxs.forEach((idx: number) => {
      this.clearHandler(idx, "pause");
      this.clearHandler(idx, "play");
      this.clicked[idx] = false;
    });
    this.voNum = 0;
  };

  clearHandler = (idx: number, handler: string) => {
    while (this.waveSurfers[idx].handlers[handler].length > 1)
      this.waveSurfers[idx].un(
        handler,
        this.waveSurfers[idx].handlers[handler][1]
      );
  };

  // Toggle Between Various Representations of the Current Timeline's Regions
  toggleAllRegions = (noIncrement?: boolean) => {
    // FIXME: Last Region in all WSs Not Drawn
    if (this.props.currentTimeline !== -1 && this.regionsOn !== 2) {
      const alpha = this.regionsOn - +(noIncrement || 0) ? 0.0 : 0.1;
      this.props.timeline[this.props.currentTimeline].milestones.forEach(
        (m: any) => {
          const reg0 = this.findRegion(0, m.startTime, m.stopTime);
          if (reg0) this.updateRegionAlpha(0, reg0, alpha);
          m.data.forEach((d: LooseObject) => {
            const wsNum =
              +d.channel.endsWith("Merged") *
              (1 + +d.channel.startsWith("Translation"));
            let reg;
            if (
              wsNum &&
              (reg = this.findRegion(wsNum, d.clipStart, d.clipStop))
            )
              this.updateRegionAlpha(wsNum, reg, alpha);
          });
        }
      );
    }
    if (!noIncrement) this.regionsOn = ++this.regionsOn % 3;
  };

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
  calcRelativeTime = (
    idx: number,
    milestone: any,
    playbackRate: number,
    idx2?: number,
    milestone2?: any
  ) =>
    roundIt(
      ((this.waveSurfers[idx].getCurrentTime() -
        (idx === 0 ? milestone.startTime : milestone.data[0].clipStart)) *
        playbackRate +
        (!idx2 ? milestone.startTime : milestone2.data[0].clipStart)) /
        this.waveSurfers[idx2 || 0].getDuration(),
      3
    );

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

  updateRegionAlpha = (wsNum: number, id: string, alpha: number) => {
    this.waveSurfers[wsNum].regions.list[id].color = this.waveSurfers[
      wsNum
    ].regions.list[id].color
      .split(",")
      .map((v: string) => (v.endsWith(")") ? `${alpha})` : v))
      .join(",");
    this.waveSurfers[wsNum].regions.list[id].onDrag(0);
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
      case "PlayerSeek": {
        /*
        // Grab Current Milestone and "Solo" the Given WS
        currM = this.getCurrentMilestone(wsNum, dispatch);
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
        */

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
      }
      case "PlayPause": {
        // If Playing => Stop All
        // -> If Not Playing, Fetch all the "Actives"
        this.idxs.forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying() && this.props.playerPlaying)
            this.waveSurfers[idx].playPause();
          else if (this.props.volumes[idx] && !this.props.playerPlaying)
            actives.push(idx);
        });

        // Process Based on Number of Active WSs
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
      }
      case "Clip": {
        // Notify Via Snackbar
        this.sendSnackbar("Playing Clip");

        // Grab Current Milestone and "Solo" the Given WS
        currM = this.getCurrentMilestone(wsNum, dispatch);
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
          if (!highs[x] || m1.data.length) {
            const m1Start = this.clipTime(highs[x], m1, true);
            const m1Stop = this.clipTime(highs[x], m1, false);

            // For Each WS in Low
            for (let y = 0, l = lows.length; y < l; y++) {
              // Grab the Sub's Milestone
              const m2Dispatch = {
                dispatchType: "Clip",
                clipStart: m1.startTime,
                clipStop: m1.stopTime
              };
              const m2 = this.getCurrentMilestone(0, m2Dispatch, lows[y]);

              // Process Only if it Has Data
              if (!lows[y] || m2.data.length) {
                const m2Start = this.clipTime(lows[y], m2, true);
                const m2Stop = this.clipTime(lows[y], m2, false);

                // Create and Push Next Voiceover
                voiceOvers.push(() => {
                  // Craft its Region
                  this.updateRegionAlpha(
                    lows[y],
                    this.findRegion(lows[y], m2Start, m2Stop),
                    0.7
                  );
                  this.waveSurfers[lows[y]].play(m2Start, m2Stop);

                  // Determine its Playback Rate
                  this.currentSpeeds[lows[y]] = this.calcPlaybackRate(
                    m2,
                    m1Dispatch,
                    m2Dispatch
                  );
                  this.waveSurfers[lows[y]].setPlaybackRate(
                    this.currentSpeeds[lows[y]]
                  );
                });
              }
            }

            // Craft RecentStart for Linking Together the Clips
            recentStart = () => {
              if (x === 0 || !this.clipStart) {
                // Reset Highlights
                this.toggleAllRegions(true);
                this.updateRegionAlpha(
                  highs[x],
                  this.findRegion(highs[x], m1Start, m1Stop),
                  0.7
                );
                this.waveSurfers[highs[x]].play(m1Start, m1Stop);
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
    }
  };

  // Toggles the Volume Between Three Predetermined States
  toggleVol = (idx: number) => {
    if (this.waveSurfers[idx] && this.waveSurfers[idx].isReady) {
      let name = `${
        !idx ? "Original" : idx === 1 ? "Careful" : "Translation"
      } Audio Set to `;
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
  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) =>
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
              width={this.rowHeight()}
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
              if (this.waveSurfers[idx] && this.waveSurfers[idx].isReady) {
                this.clearDispatchLeftovers();
                this.clicked[idx] = true;
                this.solo(idx, false);
                this.waveSurfers[idx].pause();
              }
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
        <button onClick={() => this.toggleAllRegions()}>
          {this.regionsOn === 2 ? "Hide Regions" : "Toggle Regions"}
        </button>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotMedia: state.tree.annotMedia,
  dimensions: state.system.dimensions,
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

export default require("notistack").withSnackbar(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(DeeJay)
);
