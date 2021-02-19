import * as actions from "../../store";
import * as aTypes from "../../store/annot/types";
import React, { Component } from "react";
import { roundIt } from "../globalFunctions";

import { DeeJayDispatch } from "../../store/deeJay/types";

import { LooseObject, Milestone } from "../../store/annot/types";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import WaveTableRow from "./WaveTableRow/WaveTableRow";
import {
  getInterMilestone,
  findNextMilestoneIndex,
  findLastMilestoneIndex,
  getCurrentMilestone,
} from "./MilestoneFunctions";
import { clipTime, calcPlaybackRate, calcRelativeTime } from "./TimeFunctions";
import { syncContainsCurrent, findValidAudio } from "./FileFunctions";
import {
  generateRegionColors,
  updateRegionAlpha,
  toggleAllRegions,
} from "./RegionFunctions";
import { createWaveSurfer, rowHeight } from "./WaveSurferFunctions";

interface StateProps {
  annotMedia: any;
  currentTimeline: number;
  dispatch: DeeJayDispatch;
  playbackMultiplier: number;
  playerPlaying: boolean;
  sourceMedia: any;
  timeline: any;
  timelineChanged: boolean;
  url: string;
  volumes: number[];
  isReady: boolean;
  dimensions: any;
}

interface DispatchProps {
  closeSnackbar: typeof actions.closeSnackbar;
  enqueueSnackbar: typeof actions.enqueueSnackbar;
  onReady: typeof actions.onReady;
  setDispatch: typeof actions.setDispatch;
  setPlaybackRate: typeof actions.setPlaybackRate;
  setSeek: typeof actions.setSeek;
  setWSVolume: typeof actions.setWSVolume;
  togglePlay: typeof actions.togglePlay;
  waveformAdded: typeof actions.waveformAdded;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  private actingDispatch: DeeJayDispatch = { dispatchType: "" };
  private clicked: boolean[] = [];
  private clipStart = false;
  private currBlob = "";
  private currentPlaying: string[] = [];
  private currentSpeeds: number[] = [];
  private idxs = [0, 1, 2];
  private loadQueue: string[] = [];
  private playPausing = false;
  private regionColors: string[] = [];
  private regionsOn = 1;
  private voNum = 0;
  private waveSurfers: WaveSurfer[] = [];
  private debugPlayback = true;
  private lastDimensions = 477;

  getDimensions = (): number => {
    if (
      this.props.dimensions.AppBody.height > 1 &&
      this.props.dimensions.AppPlayer.height > 1
    )
      return (
        this.props.dimensions.AppBody.height -
        this.props.dimensions.AppPlayer.height
      );
    else return 477;
  };

  // Set Up DeeJay Instance Variables
  componentDidMount = (): void => {
    // Build Starting Arrays and Create Wave Surfers
    this.idxs.forEach((idx: number) => {
      this.clicked.push(false);
      this.currentPlaying.push("");
      this.currentSpeeds.push(1);
      this.loadQueue.push("");
      this.createWaveSurfer(idx);
    });
  };

  createWaveSurfer = (idx: number): void => {
    const newWS = createWaveSurfer(idx);

    newWS.on("region-created", (region: any) => {
      if (newWS.regions.list[region.id])
        newWS.regions.list[region.id].onDrag(0);
    });

    // Process Region Hover In
    newWS.on("region-mouseenter", (region: any) =>
      this.regionHover(region, "hover", this.regionsOn)
    );

    // Process Region Hover Out
    newWS.on("region-mouseleave", (region: any) =>
      this.regionHover(region, "", this.regionsOn)
    );

    // Log Pause and Stop Player if All are Paused
    newWS.on("pause", () => {
      console.log(`${idx} Paused`);
      let play = false;
      this.idxs.forEach((idx: number) => {
        if (this.waveSurfers[idx].isPlaying()) play = true;
      });
      if (!play) this.props.togglePlay(play);
      // this.toggleAllRegions(true);
    });

    // Process WS Play
    newWS.on("play", () => {
      console.log(`${idx} Played`);
      if (this.clipStart) this.clipStart = false;
    });

    // Process WS Error by Displaying Through Snackbar
    newWS.on("error", (err: any) => {
      console.log(err);
      this.sendSnackbar(String(err));
    });

    // Process WS Seeking
    newWS.on("seek", () => this.wsSeek(idx));

    this.waveSurfers[idx] = newWS;
  };

  regionHover = (region: any, element: string, regionsOn: number): void => {
    if (regionsOn !== 0) {
      this.idxs.forEach((idx: number) => {
        if (this.waveSurfers[idx].regions.list[region.id]) {
          const thisRegion = this.waveSurfers[idx].regions.list[region.id];
          thisRegion.element.id = element;
          updateRegionAlpha(
            this.waveSurfers[idx].regions.list,
            regionsOn === 1 ? (element ? 0.7 : 0.1) : element ? 0.1 : 0.0,
            thisRegion.start,
            thisRegion.end
          );
          if (element) thisRegion.element.style.outlineOffset = "-3px";
          thisRegion.onDrag(0);
        }
      });
    }
  };

  // Processes Reaction to State Updates
  componentDidUpdate(): void {
    // If currentURL and StateURL Don't Match
    if (this.currBlob !== this.props.url) {
      // Add Colors for Possible Regions if Necessary
      this.regionColors = generateRegionColors();

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
        this.actingDispatch = { dispatchType: "" };
      });
    }

    if (this.props.isReady && this.lastDimensions !== this.getDimensions()) {
      this.lastDimensions = this.getDimensions();
      this.idxs.forEach((idx: number) => {
        this.waveSurfers[idx].setHeight(rowHeight());
      });
    }

    // Loop Through all WSs
    this.idxs.forEach((idx: number) => {
      // If Sync Media Does Not Contain currBlob => No Timeline Actions
      // -> Else => Timeline Actions
      if (syncContainsCurrent(this.currBlob)) {
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
          const load = this.loadQueue[idx]
            ? this.loadQueue[idx]
            : findValidAudio(idx);
          // Load File if Possible, Otherwise Put Into LoadQueue
          if (!this.fileAllowed(load)) this.loadQueue[idx] = load;
          else this.loadFileWS(idx, load);
        }
      }
    });
  }

  wsSeek = (idx: number): void => {
    if (!this.clicked[idx]) console.log(`${idx} No Click Seeking`);
    else {
      // Log Action and Reset Clicked
      console.log(`${idx} Click Seeking`);
      this.clicked[idx] = false;
      const ws = this.waveSurfers[idx];
      const currMiles =
        this.props.currentTimeline === -1
          ? []
          : this.props.timeline[this.props.currentTimeline].milestones;

      // Grab Current Milestone and Set Volume of Given WS
      const currM = getCurrentMilestone(
        idx,
        this.waveSurfers[idx].getCurrentTime()
      );
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
        clipStop: currM.stopTime,
      };
      const lowestValidHigh = highs.reduce(
        (a: number, b: number) =>
          (!b ||
            getCurrentMilestone(
              0,
              this.waveSurfers[0].getCurrentTime(),
              currMD,
              b
            ).data.length) &&
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
          getCurrentMilestone(
            0,
            this.waveSurfers[0].getCurrentTime(),
            currMD,
            lowestValidHigh
          )
        );
      } else {
        lows.forEach((low: number) => {
          const lowM = getCurrentMilestone(
            0,
            this.waveSurfers[0].getCurrentTime(),
            currMD,
            low
          );
          if (!low || lowM.data.length)
            this.setRelativeTime(idx, low, currM, lowM);
        });

        // Subscribe Highs to Function for Loading Next Milestone in Sequence
        highs.forEach((high: number, hIdx: number) => {
          const highWS = this.waveSurfers[high];

          // Function for Loading Next Clip on Pause
          const loadNext = () => {
            // If No Highs are Playing => Load Next
            if (!this.playPausing) {
              if (!this.voNum) {
                // Cycle Through All Highs (from First After Current, Ending on Current)
                for (let i = 1, l = highs.length + 1; i < l; i++) {
                  // Grab Index of Next WS and the WS Itself
                  const nextIdx = highs[(hIdx + i) % highs.length];

                  // Calculate Timeline Index of the Coming Milestone:
                  // - 1. FindMilestoneIndex of High's Current Time
                  // - 2. + (0 If Next WS <= High Else -1)
                  let nextM: any;
                  if (
                    getCurrentMilestone(
                      high,
                      this.waveSurfers[high].getCurrentTime()
                    )
                  ) {
                    const comingMIdx =
                      findNextMilestoneIndex(
                        getCurrentMilestone(
                          high,
                          this.waveSurfers[high].getCurrentTime()
                        )
                      ) +
                      +(highWS.getDuration() - highWS.getCurrentTime() < 0.05) +
                      +(nextIdx <= high) +
                      -1;

                    if (comingMIdx === currMiles.length)
                      highWS.un("pause", loadNext);
                    else {
                      // Grab currComingM
                      const currComingM = currMiles[comingMIdx];
                      nextM = getCurrentMilestone(
                        0,
                        this.waveSurfers[0].getCurrentTime(),
                        {
                          dispatchType: "WSSeek",
                          clipStart: currComingM.startTime,
                          clipStop: currComingM.stopTime,
                        },
                        nextIdx
                      );
                      // If NextM Exists and NextM Has Data if Necessary => Load Next Clip
                      if (nextM && (!nextIdx || nextM.data.length)) {
                        // Force Exit Loop Now
                        i = l;
                        this.checkVOAndPlay(nextIdx, lows, nextM);
                        this.actingDispatch = {
                          dispatchType: "WSSeek",
                          wsNum: nextIdx,
                        };
                      }
                    }
                  }
                }
              } else {
                const currComingM =
                  currMiles[
                    findNextMilestoneIndex(
                      getCurrentMilestone(
                        idx,
                        this.waveSurfers[idx].getCurrentTime()
                      )
                    ) - 1
                  ];
                this.checkVOAndPlay(
                  idx,
                  lows,
                  getCurrentMilestone(
                    0,
                    this.waveSurfers[0].getCurrentTime(),
                    {
                      dispatchType: "WSSeek",
                      clipStart: currComingM.startTime,
                      clipStop: currComingM.stopTime,
                    },
                    idx
                  )
                );
                this.actingDispatch = { dispatchType: "WSSeek", wsNum: idx };
              }
            }
          };

          // If Current Milestone Has What it Needs => Set Relative Time
          const highM = getCurrentMilestone(
            0,
            this.waveSurfers[0].getCurrentTime(),
            currMD,
            high
          );
          if (!high || highM.data.length)
            this.setRelativeTime(idx, high, currM, highM);

          // Subscribe High for Pausing (Allows for Loading Next Milestone)
          if (this.props.currentTimeline !== -1) highWS.on("pause", loadNext);
        });

        // If Current Timeline is not Empty => Play According to Milestones
        // -> Else => Play as Normal
        if (this.props.currentTimeline !== -1)
          this.checkVOAndPlay(idx, lows, currM);
        else
          this.seekSyncAndPlay(0, {
            annotationID: "",
            startTime: 0,
            stopTime: ws.getDuration(),
            data: [],
          });
        this.actingDispatch = { dispatchType: "WSSeek", wsNum: idx };
      }
    }
  };

  checkVOAndPlay = (idx: number, lows: number[], m: Milestone) => {
    const mD = {
      dispatchType: "WSSeek",
      clipStart: m.startTime,
      clipStop: m.stopTime,
    };
    const validLows = lows.filter(
      (l: any) =>
        !l ||
        getCurrentMilestone(0, this.waveSurfers[0].getCurrentTime(), mD, l).data
          .length
    );
    let voM;
    if (
      validLows.length &&
      ((voM = getCurrentMilestone(
        0,
        this.waveSurfers[0].getCurrentTime(),
        mD,
        validLows[this.voNum]
      )).data.length ||
        !validLows[this.voNum])
    ) {
      if (this.voNum) this.setRelativeTime(validLows[this.voNum], idx, voM, m);
      this.setRelativePlay(idx, validLows[this.voNum], m, voM);
      this.voNum = (this.voNum + 1) % validLows.length;
    }
    this.seekSyncAndPlay(idx, m);
  };

  seekSyncAndPlay = (idx: number, m: Milestone): void => {
    // Sync Player
    const playbackRate = idx === 0 ? 1 : calcPlaybackRate(m);
    this.props.setPlaybackRate(roundIt(playbackRate, 2));
    this.props.setSeek(
      calcRelativeTime(
        this.waveSurfers[idx].getCurrentTime(),
        clipTime(idx, m, true),
        this.waveSurfers[0].getDuration(),
        playbackRate,
        clipTime(0, m, true)
      )
    );
    this.props.togglePlay(true);

    // Discuss
    if (this.debugPlayback) {
      this.sendSnackbar(
        "Playing WS" +
          idx +
          " from " +
          m.startTime +
          " to " +
          m.stopTime +
          ". Video at " +
          roundIt(playbackRate, 2) +
          "x."
      );
    }
    // Play From Now Until End of Clip
    this.waveSurfers[idx].play(
      this.waveSurfers[idx].getCurrentTime(),
      findNextMilestoneIndex(m) === findLastMilestoneIndex(idx)
        ? this.waveSurfers[idx].getDuration()
        : clipTime(idx, m, false)
    );
  };

  // Sets WS Idx2 to the Time Relative to WS Idx1
  // -> Returns Playback Rate
  setRelativeTime = (
    idx1: number,
    idx2: number,
    mile1: any,
    mile2: any
  ): number => {
    // Grab Filtered Milestone of the First High
    const playbackRate = calcPlaybackRate(
      mile2,
      {
        dispatchType: "WSSeek",
        clipStart: clipTime(idx1, mile1, true),
        clipStop: clipTime(idx1, mile1, false),
      },
      {
        dispatchType: "WSSeek",
        clipStart: clipTime(idx2, mile2, true),
        clipStop: clipTime(idx2, mile2, false),
      }
    );

    // Set High Clicked and Seek it to the Relative Time
    // This Makes First High First One to Play
    this.waveSurfers[idx2].seekTo(
      calcRelativeTime(
        this.waveSurfers[idx1].getCurrentTime(),
        clipTime(idx1, mile1, true),
        this.waveSurfers[idx2].getDuration(),
        playbackRate,
        clipTime(idx2, mile2, true)
      )
    );
    return playbackRate;
  };

  setRelativePlay = (
    idx1: number,
    idx2: number,
    mile1: any,
    mile2: any
  ): void => {
    this.currentSpeeds[idx2] = this.setRelativeTime(idx1, idx2, mile1, mile2);
    this.waveSurfers[idx2].setPlaybackRate(
      roundIt(this.currentSpeeds[idx2], 2)
    );
    this.waveSurfers[idx2].play(
      this.waveSurfers[idx2].getCurrentTime(),
      clipTime(idx2, mile2, false)
    );
  };

  // Loads a WS and Subscribes it to an "onReady" Function
  loadFileWS = (idx: number, load: string): void => {
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
        wavedata: this.waveSurfers[idx].exportPCM(1024, 10000, true),
      });

      // Draw All Regions currentTimeline Has
      if (this.props.currentTimeline !== -1)
        this.props.timeline[this.props.currentTimeline].milestones.forEach(
          (m: any, mileNum: number) => {
            const region = {
              id: m.startId,
              start: m.startTime,
              end: m.stopTime,
              color: this.regionColors[mileNum],
              drag: false,
              resize: false,
            };
            if (idx === 0) this.waveSurfers[idx].addRegion(region);
            else
              m.data.forEach((d: LooseObject) => {
                if (
                  d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
                ) {
                  this.waveSurfers[idx].addRegion({
                    ...region,
                    start: d.clipStart,
                    end: d.clipStop,
                  });
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
      toggleAllRegions(this.regionsOn, true, this.getWSRegions());
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

  componentWillUnmount(): void {
    console.log("UnMounting DeeJay Component");
    // todo: Make sure Wavesurfers Unloaded Gently.
  }

  // Does Necessary Playback Checks (Dispatch, Volume, Playback Rate) for a Given WS
  checkPlayingValues = (idx: number): void => {
    const ws = this.waveSurfers[idx];
    if (
      this.props.dispatch.wsNum === idx ||
      (this.props.dispatch.wsNum === -1 && idx === 0)
    )
      this.dispatchDJ();
    if (ws.getVolume() !== this.props.volumes[idx])
      ws.setVolume(this.props.volumes[idx]);
    const expRate = roundIt(
      this.currentSpeeds[idx] * this.props.playbackMultiplier >= 15
        ? 14.5
        : this.currentSpeeds[idx] * this.props.playbackMultiplier <= 0.2
        ? 0.2
        : this.currentSpeeds[idx] * this.props.playbackMultiplier,
      2
    );
    if (ws.getPlaybackRate() !== expRate) ws.setPlaybackRate(expRate);
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
  solo = (wsNum: number, resetAll: boolean, wsNum2 = -1): void => {
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

    // if wsNum2: turn that on, too.
    if (wsNum2 >= 0) {
      this.waveSurfers[wsNum].setVolume(1);
      this.props.setWSVolume(wsNum, 1);
      this.waveSurfers[wsNum2].setVolume(1);
      this.props.setWSVolume(wsNum2, 1);
    }

    // Stop All Not wsNum and Reset Playback Rates
    this.idxs.forEach((idx: number) => {
      if (idx !== wsNum) this.waveSurfers[idx].stop();
      this.currentSpeeds[idx] = 1;
      this.waveSurfers[idx].setPlaybackRate(
        roundIt(this.currentSpeeds[idx], 2)
      );
    });
  };

  // Clears All Temp WS Regions and "pause" Subscriptions
  clearDispatchLeftovers = (): void => {
    this.idxs.forEach((idx: number) => {
      this.clearHandler(idx, "pause");
      this.clearHandler(idx, "play");
      this.clicked[idx] = false;
    });
    this.voNum = 0;
  };

  clearHandler = (idx: number, handler: string): void => {
    while (this.waveSurfers[idx].handlers[handler].length > 1)
      this.waveSurfers[idx].un(
        handler,
        this.waveSurfers[idx].handlers[handler][1]
      );
  };

  // Returns an Array with the Indexes of Active WSs
  getActives = (): Array<number> => {
    return this.idxs.filter(
      (idx: number) =>
        this.waveSurfers[idx].getVolume() > 0 ||
        this.waveSurfers[idx].isPlaying()
    );
  };

  getWSRegions = (): Array<number> => {
    return this.idxs.map((idx: number) =>
      this.waveSurfers[idx] ? this.waveSurfers[idx].regions.list : []
    );
  };

  // Responds to DJ Dispatches
  dispatchDJ = (): void => {
    // Store Dispatch Into Local Variable and Clear It
    if (this.props.dispatch.dispatchType !== "PlayPause") {
      this.actingDispatch = { ...this.props.dispatch };
      this.playPausing = false;
    } else this.playPausing = true;
    const dispatch = { ...this.props.dispatch };
    this.props.setDispatch({ dispatchType: "" });

    // Necessary Switch Variables for WS, Active WSs, Milestone, and PlaybackRate
    let wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;
    const wsNum2 =
      this.props.dispatch.wsNum2 !== undefined
        ? this.props.dispatch.wsNum2
        : -1;
    let actives: number[] = [];
    let currM: any = {};
    const playbackRate = 1;
    // Process Dispatch Based on its Type
    switch (dispatch.dispatchType) {
      case "WSSeek": {
        this.clearDispatchLeftovers();
        this.clicked[wsNum] = true;
        this.waveSurfers[wsNum].pause();
        this.wsSeek(wsNum);
        break;
      }
      case "PlayerSeek": {
        this.clearDispatchLeftovers();
        dispatch.refStart = dispatch.refStart || 0;

        // Fetch the Active WSs and Processes Based on How Many
        actives = this.getActives();

        // "Click" WS So That it can Automatically Seek Beyond Beginning Milestone
        this.clicked[actives[0]] = true;

        // If WS 0 => Seek To Ref
        // -> Else If Milestone Data Exists => Seek To Relative Ref
        currM = getInterMilestone(dispatch.refStart, actives[0]);
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
        break;
      }
      case "PlayPause": {
        // If Playing => Stop All
        // -> If Not Playing, Fetch all the "Actives"
        const playerPlaying = this.props.playerPlaying;
        this.idxs.forEach((idx: number) => {
          if (this.waveSurfers[idx].isPlaying() && playerPlaying) {
            this.waveSurfers[idx].pause();
            if (this.waveSurfers[idx].getVolume() > 0.5 ** 0.25)
              this.actingDispatch = { ...this.actingDispatch, wsNum: idx };
            else if (this.waveSurfers[idx].getVolume())
              this.actingDispatch = { ...this.actingDispatch, wsNum2: idx };
          } else if (this.props.volumes[idx] && !playerPlaying) {
            actives.push(idx);
          }
        });

        // Process Based on Number of Active WSs
        if (actives.length) {
          this.playPausing = false;
          if (this.actingDispatch.wsNum !== undefined) {
            const ppWS = this.waveSurfers[this.actingDispatch.wsNum];
            currM = getCurrentMilestone(
              this.actingDispatch.wsNum,
              this.waveSurfers[this.actingDispatch.wsNum].getCurrentTime(),
              {
                dispatchType: "",
              },
              this.actingDispatch.wsNum
            );
            ppWS.play(
              ppWS.getCurrentTime(),
              clipTime(this.actingDispatch.wsNum, currM, false)
            );
            this.props.togglePlay(true);
          }
          if (this.actingDispatch.wsNum2 !== undefined) {
            const ppWS = this.waveSurfers[this.actingDispatch.wsNum2];
            currM = getCurrentMilestone(
              this.actingDispatch.wsNum2,
              this.waveSurfers[this.actingDispatch.wsNum2].getCurrentTime(),
              {
                dispatchType: "",
              },
              this.actingDispatch.wsNum2
            );
            ppWS.play(
              ppWS.getCurrentTime(),
              clipTime(this.actingDispatch.wsNum2, currM, false)
            );
          }
        }

        break;
      }
      case "Clip": {
        this.clearDispatchLeftovers();
        this.solo(wsNum, true, wsNum2);
        if (wsNum < 0) wsNum = 0;
        // Grab Current Milestone and "Solo" the Given WS
        currM = getCurrentMilestone(
          wsNum,
          this.waveSurfers[wsNum].getCurrentTime(),
          dispatch
        );
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
        // TODO: Check whether this empty function is an issue.]
        let recentStart = () => {
          // This is a placeholder to keep this function in scope
        };
        const voiceOvers: ((data: string) => void)[] = [];
        for (let x = highs.length - 1; x >= 0; x--) {
          // Grab its Milestone
          const m1Dispatch = {
            dispatchType: "Clip",
            clipStart: currM.startTime,
            clipStop: currM.stopTime,
          };
          const m1 = getCurrentMilestone(
            0,
            this.waveSurfers[0].getCurrentTime(),
            m1Dispatch,
            highs[x]
          );

          // Process Only if it WS is 0 or M1 has Data
          if (!highs[x] || m1.data.length) {
            const m1Start = clipTime(highs[x], m1, true);
            const m1Stop = clipTime(highs[x], m1, false);

            // For Each WS in Low
            for (let y = lows.length - 1; y >= 0; y--) {
              // Grab the Sub's Milestone
              const m2Dispatch = {
                dispatchType: "Clip",
                clipStart: m1.startTime,
                clipStop: m1.stopTime,
              };
              const m2 = getCurrentMilestone(
                0,
                this.waveSurfers[0].getCurrentTime(),
                m2Dispatch,
                lows[y]
              );

              // Process Only if it Has Data
              if (!lows[y] || m2.data.length) {
                const m2Start = clipTime(lows[y], m2, true);
                const m2Stop = clipTime(lows[y], m2, false);

                // Create and Push Next Voiceover
                voiceOvers.push(() => {
                  // Craft its Region
                  updateRegionAlpha(
                    this.waveSurfers[lows[y]].regions.list,
                    0.7,
                    m2Start,
                    m2Stop
                  );

                  // Determine its Playback Rate
                  this.currentSpeeds[lows[y]] = calcPlaybackRate(
                    m2,
                    {
                      dispatchType: "Clip",
                      clipStart: m1Start,
                      clipStop: m1Stop,
                    },
                    {
                      dispatchType: "Clip",
                      clipStart: m2Start,
                      clipStop: m2Stop,
                    }
                  );
                  this.waveSurfers[lows[y]].setPlaybackRate(
                    roundIt(this.currentSpeeds[lows[y]], 2)
                  );
                  this.waveSurfers[lows[y]].play(m2Start, m2Stop);
                });
              }
            }

            // Craft RecentStart for Linking Together the Clips
            recentStart = () => {
              if (!this.playPausing && (x === 0 || !this.clipStart)) {
                // Reset Highlights
                toggleAllRegions(this.regionsOn, true, this.getWSRegions());
                updateRegionAlpha(
                  this.waveSurfers[highs[x]].regions.list,
                  0.7,
                  m1Start,
                  m1Stop
                );
                if (this.voNum + x < voiceOvers.length)
                  voiceOvers[voiceOvers.length - (this.voNum + x + 1)]("");
                this.props.setPlaybackRate(
                  roundIt(calcPlaybackRate(m1, dispatch), 2)
                );
                this.props.setSeek(m1.startTime || 0);
                this.props.togglePlay(true);
                this.waveSurfers[highs[x]].play(m1Start, m1Stop);
                if (x > 0)
                  this.waveSurfers[highs[x - 1]].un("pause", recentStart);
              }
            };

            // Sub Next Lowest WS to RecentStart Only if Not Lowest WS
            if (x > 0) this.waveSurfers[highs[x - 1]].on("pause", recentStart);
            if (x === highs.length - 1) {
              const resetDispatch = () => {
                if (
                  !this.playPausing &&
                  (x === 0 || !this.clipStart) &&
                  this.voNum + x >= voiceOvers.length - 1
                ) {
                  this.actingDispatch = { dispatchType: "" };
                  this.waveSurfers[highs[x]].un("pause", resetDispatch);
                }
              };
              this.waveSurfers[highs[x]].on("pause", resetDispatch);
            }
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
            if (!this.playPausing && !this.clipStart) {
              this.voNum = 1;
              recentStart();
              this.waveSurfers[highs[0]].un("pause", secondVO);
            }
          };
          this.waveSurfers[highs[0]].on("pause", secondVO);
        }
        break;
      }
    }
  };
  // TODO: Make this a global function
  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) => {
    this.props.enqueueSnackbar({
      message: inMessage,
      options: {
        key: inKey || new Date().getTime() + Math.random(),
        variant: vType || "default",
        action: (key: aTypes.LooseObject) => (
          <button onClick={() => this.props.closeSnackbar(key)}>Dismiss</button>
        ),
      },
    });
  };
  render(): JSX.Element {
    // Forms the Rows for Each WS
    //const waveTableRows = this.idxs.map((idx: number) => {
    const waveTableRows = (idx: number) => {
      return (
        <WaveTableRow
          getPlaybackRate={() =>
            this.waveSurfers[idx] && this.waveSurfers[idx].getPlaybackRate()
          }
          getReady={() =>
            this.waveSurfers[idx] && this.waveSurfers[idx].isReady
          }
          index={idx}
          onClick={() => {
            if (this.waveSurfers[idx] && this.waveSurfers[idx].isReady) {
              this.clearDispatchLeftovers();
              this.clicked[idx] = true;
              this.solo(idx, false);
              this.waveSurfers[idx].pause();
            }
          }}
        />
      );
    };

    return (
      <div>
        <div className="wave-table-container">
          <table className="wave-table">
            <tbody>
              <tr>
                <td colSpan={3} className="rowWithTitle">
                  <div className="rowTitle">Original</div>
                </td>
              </tr>
              {waveTableRows(0)}
              <tr>
                <td colSpan={3} className="rowWithTitle">
                  <div className="rowTitle">Careful</div>
                </td>
              </tr>
              {waveTableRows(1)}
              <tr>
                <td colSpan={3} className="rowWithTitle">
                  <div className="rowTitle">Translation</div>
                </td>
              </tr>
              {waveTableRows(2)}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => {
            toggleAllRegions(this.regionsOn, false, this.getWSRegions());
            this.regionsOn = ++this.regionsOn % 3;
          }}
        >
          {this.regionsOn === 2 ? "Hide Regions" : "Toggle Regions"}
        </button>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotMedia: state.tree.annotMedia,
  currentTimeline: state.annot.currentTimeline,
  dimensions: state.system.dimensions,
  dispatch: state.deeJay.dispatch,
  isReady: state.player.ready,
  playbackMultiplier: state.player.playbackMultiplier,
  playerPlaying: state.player.playing,
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annot.timeline,
  timelineChanged: state.annot.timelineChanged,
  url: state.player.url,
  volumes: state.deeJay.volumes,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      closeSnackbar: actions.closeSnackbar,
      enqueueSnackbar: actions.enqueueSnackbar,
      onReady: actions.onReady,
      setDispatch: actions.setDispatch,
      setPlaybackRate: actions.setPlaybackRate,
      setSeek: actions.setSeek,
      setWSVolume: actions.setWSVolume,
      togglePlay: actions.togglePlay,
      waveformAdded: actions.waveformAdded,
    },
    dispatch
  ),
});
//Todo: Try to import Snackbar.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export default require("notistack").withSnackbar(
  connect(mapStateToProps, mapDispatchToProps)(DeeJay)
);
