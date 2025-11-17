import * as actions from "../../store";
import React, { Component } from "react";
import { roundIt } from "../globalFunctions";

import { DeeJayDispatch } from "../../store/deeJay/types";

import { LooseObject, Milestone } from "../../store/annot/types";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import toast from "react-hot-toast";
import WaveTableRow from "./WaveTableRow/WaveTableRow";
import {
  getInterMilestone,
  findNextMilestoneIndex,
  findLastMilestoneIndex,
  getCurrentMilestone,
  getSubtitle,
} from "./MilestoneFunctions";
import { clipTime, calcPlaybackRate, calcRelativeTime } from "./TimeFunctions";
import { syncContainsCurrent, findValidAudio } from "./FileFunctions";
import {
  generateRegionColors,
  updateRegionAlpha,
  toggleAllRegions,
} from "./RegionFunctions";
import { exportVideo, hasSyncedVideo } from "../FolderSelection/ExportVid";
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
  onReady: typeof actions.onReady;
  setDispatch: typeof actions.setDispatch;
  setPlaybackRate: typeof actions.setPlaybackRate;
  setSeek: typeof actions.setSeek;
  setSubtitle: typeof actions.setSubtitle;
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
  private isWSReady: boolean[] = []; // Track ready state for each WaveSurfer
  private loadQueue: string[] = [];
  private playPausing = false;
  private regionColors: string[] = [];
  private regionsOn = 1;
  private voNum = 0;
  private waveSurfers: WaveSurfer[] = [];
  private regionsPlugins: RegionsPlugin[] = [];
  private debugPlayback = false;
  private verboseMilestones = false; // Set to true to see milestone redrawing logs
  private lastDimensions = 477;

  // Track pause/play handlers so we can remove them in WaveSurfer v7
  private eventHandlers: {
    [idx: number]: { pause: (() => void)[]; play: (() => void)[] };
  } = {
    0: { pause: [], play: [] },
    1: { pause: [], play: [] },
    2: { pause: [], play: [] },
  };

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
      this.isWSReady.push(false); // Initialize ready state to false
      this.loadQueue.push("");
      this.createWaveSurfer(idx);
    });
  };

  createWaveSurfer = (idx: number): void => {
    const { wavesurfer: newWS, regionsPlugin } = createWaveSurfer(idx);

    newWS.on("region-created", () => {
      // In WaveSurfer v7, region.onDrag is not needed
      // The region is already created and configured
    });

    // Process Region Hover In
    newWS.on("region-mouseenter", (region: any) =>
      this.regionHover(region, "hover", this.regionsOn),
    );

    // Process Region Hover Out
    newWS.on("region-mouseleave", (region: any) =>
      this.regionHover(region, "", this.regionsOn),
    );

    // Process Region Click - enables playback when clicking on regions
    newWS.on("region-clicked", (region: any) => {
      if (
        this.waveSurfers[idx] &&
        this.isWSReady[idx] &&
        this.props.currentTimeline !== -1
      ) {
        // Dispatch a "Clip" action to play this region, matching annotation table behavior
        this.props.setDispatch({
          dispatchType: "Clip",
          wsNum: idx,
          clipStart: region.start,
          clipStop: region.end,
        });
      }
    });

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
      console.error(`[DeeJay] WS${idx} ERROR:`, err);
      console.error(`[DeeJay] WS${idx} ERROR details:`, {
        message: err?.message,
        stack: err?.stack,
        type: typeof err,
        full: err,
      });
      this.sendSnackbar(String(err));
    });

    // Process WS Interaction (click/drag on waveform) - enables drag-to-seek
    newWS.on("interaction", () => {
      if (this.waveSurfers[idx] && this.isWSReady[idx]) {
        if (this.debugPlayback) {
          console.log(
            `[DeeJay] WS${idx} interaction detected, enabling drag-to-seek`,
          );
        }
        this.clearDispatchLeftovers();
        this.clicked[idx] = true;
        // Don't call solo() - preserve existing volume states for voiceover workflow
        // Just pause this wavesurfer to prepare for seeking
        this.waveSurfers[idx].pause();
      }
    });

    // Process WS Seeking (fires continuously while dragging)
    newWS.on("seeking", () => {
      if (this.clicked[idx]) {
        this.wsSeek(idx);
      }
    });

    // Process WS Seek (fires when seek is complete)
    newWS.on("seek", () => this.wsSeek(idx));

    this.waveSurfers[idx] = newWS;
    this.regionsPlugins[idx] = regionsPlugin;
  };

  regionHover = (region: any, element: string, regionsOn: number): void => {
    if (regionsOn !== 0) {
      this.idxs.forEach((idx: number) => {
        if (this.waveSurfers[idx] && this.regionsPlugins[idx]) {
          const regions = this.regionsPlugins[idx].getRegions();
          const thisRegion = regions.find((r: any) => r.id === region.id);
          if (thisRegion) {
            thisRegion.element.id = element;
            updateRegionAlpha(
              regions,
              regionsOn === 1 ? (element ? 0.7 : 0.1) : element ? 0.1 : 0.0, // Non-hover: 0.1 to match default
              thisRegion.start,
              thisRegion.end,
            );
            if (element) thisRegion.element.style.outlineOffset = "-3px";
            // onDrag is not needed in v7
          }
        }
      });
    }
  };

  // ============================================================================
  // COMPONENT UPDATE HELPERS
  // ============================================================================

  /**
   * Handle timeline being set for the first time
   *
   * When a timeline is selected:
   * 1. Generate region colors
   * 2. If WS0 is ready, redraw regions and start playback
   * 3. Trigger WS1/WS2 to load annotation audio
   */
  private handleTimelineJustSet = (): void => {
    console.log(`[DeeJay] Timeline just set! Checking WS0 readiness...`);
    // Generate region colors for the new timeline
    this.regionColors = generateRegionColors();

    // Redraw regions for WS0 if it's already ready
    const ws0 = this.waveSurfers[0];
    const regions0 = this.regionsPlugins[0];
    const ws0Duration = ws0 ? ws0.getDuration() : 0;
    const ws0Ready = this.isWSReady[0];

    console.log(
      `[DeeJay] WS0 check: exists=${!!ws0}, duration=${ws0Duration}, isReady=${ws0Ready}, regions=${!!regions0}, currentPlaying[0]=${this.currentPlaying[0]}`,
    );

    // Check if WaveSurfer is ready by checking isWSReady flag and has loaded audio
    if (ws0 && ws0Ready && this.currentPlaying[0] && regions0) {
      console.log(
        `[DeeJay] WS0 is ready, redrawing regions and starting playback`,
      );
      regions0.clearRegions();
      const milestones =
        this.props.timeline[this.props.currentTimeline].milestones;
      milestones.forEach((m: any, mileNum: number) => {
        const region = {
          id: m.startId,
          start: m.startTime,
          end: m.stopTime,
          color: this.regionColors[mileNum],
          drag: false,
          resize: false,
        };
        regions0.addRegion(region);
      });

      // Start playback now that timeline is set and WS0 is ready
      // WS1/WS2 will load asynchronously
      console.log(`[DeeJay] Dispatching PlayerSeek to start auto-playback`);
      // Use setTimeout to ensure dispatch happens after componentDidUpdate completes
      setTimeout(() => {
        this.props.setDispatch({
          dispatchType: "PlayerSeek",
          wsNum: -1,
          refStart: 0,
        });
      }, 100);
    } else {
      console.log(
        `[DeeJay] WS0 not ready yet when timeline set, will auto-play when WS0 becomes ready`,
      );
    }

    // Force WS1 and WS2 to load by clearing their currentPlaying state
    this.currentPlaying[1] = "";
    this.currentPlaying[2] = "";
  };

  /**
   * Handle milestones changing (e.g., oral annotations added)
   *
   * Redraws all waveforms with updated milestone data
   */
  private handleMilestonesChanged = (): void => {
    // Redraw WS0 regions with new milestone data
    const ws0 = this.waveSurfers[0];
    const regions0 = this.regionsPlugins[0];
    if (ws0 && regions0 && ws0.getDuration() > 0) {
      regions0.clearRegions();
      const milestones =
        this.props.timeline[this.props.currentTimeline].milestones;
      milestones.forEach((m: any, mileNum: number) => {
        const region = {
          id: m.startId,
          start: m.startTime,
          end: m.stopTime,
          color: this.regionColors[mileNum],
          drag: false,
          resize: false,
        };
        regions0.addRegion(region);
      });
    }

    // Clear and reload WS1 and WS2 to redraw regions with new oral annotations
    [1, 2].forEach((idx) => {
      if (this.waveSurfers[idx] && this.regionsPlugins[idx]) {
        // Only clear if the file to load is different from what's currently loaded
        // This prevents infinite reload loops when milestones change repeatedly
        const audioToLoad = findValidAudio(idx);
        if (audioToLoad && audioToLoad !== this.currentPlaying[idx]) {
          if (this.verboseMilestones) {
            console.log(
              `[DeeJay] WS${idx} milestones changed, clearing currentPlaying to reload with new regions`,
            );
          }
          this.currentPlaying[idx] = "";
        } else if (!audioToLoad) {
          // If no valid audio, clear it
          this.currentPlaying[idx] = "";
        } else {
          if (this.verboseMilestones) {
            console.log(
              `[DeeJay] WS${idx} milestones changed but same file is loaded, just redrawing regions`,
            );
          }
          // Same file is already loaded, just clear and redraw regions
          this.regionsPlugins[idx].clearRegions();
          const milestones =
            this.props.timeline[this.props.currentTimeline].milestones;
          milestones.forEach((m: any, mileNum: number) => {
            if (m.data[idx]) {
              const region = {
                id: m.startId + "_ws" + idx,
                start:
                  m.data[idx].clipStart !== undefined
                    ? m.data[idx].clipStart
                    : m.startTime,
                end:
                  m.data[idx].clipStop !== undefined
                    ? m.data[idx].clipStop
                    : m.stopTime,
                color: this.regionColors[mileNum],
                drag: false,
                resize: false,
              };
              this.regionsPlugins[idx].addRegion(region);
            }
          });
        }
      }
    });
  };

  /**
   * Handle URL change - reset all wavesurfers for new media file
   */
  private handleUrlChanged = (): void => {
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
      // WaveSurfer v7 no longer exposes backend.peaks directly
      // Peaks are managed internally - empty() is called in createWaveSurfer
      // Regions are also cleared when the wavesurfer is destroyed and recreated
      this.currentPlaying[idx] = "";
      this.actingDispatch = { dispatchType: "" };
    });
  };

  /**
   * Handle dimension changes - update waveform heights
   */
  private handleDimensionsChanged = (): void => {
    this.lastDimensions = this.getDimensions();
    const newHeight = rowHeight();
    this.idxs.forEach((idx: number) => {
      // WaveSurfer v7 uses setOptions instead of setHeight
      this.waveSurfers[idx].setOptions({ height: newHeight });
    });
  };

  /**
   * Handle loading audio for a specific wavesurfer
   *
   * Determines what audio file to load (if any) and triggers loading
   */
  private handleWaveformLoading = (idx: number): void => {
    // Don't load waveforms until we have a timeline (if one exists)
    // If timeline array is populated but currentTimeline is -1, wait
    const waitingForTimeline =
      this.props.timeline.length > 0 && this.props.currentTimeline === -1;
    if (waitingForTimeline) {
      console.log(
        `[DeeJay] WS${idx} waiting for timeline to be set (timeline.length=${this.props.timeline.length}, currentTimeline=${this.props.currentTimeline})`,
      );
      return;
    }

    // If Sync Media Does Not Contain currBlob => No Timeline Actions
    // -> Else => Timeline Actions
    const inSync = syncContainsCurrent(this.currBlob);

    if (inSync) {
      // If WS is Playing => Check for Playing Actions
      // -> Else If WS0, and Not Empty URL => Load and Play URL
      if (this.currentPlaying[idx]) {
        this.checkPlayingValues(idx);
      } else if (!idx && this.props.url) {
        const audioToLoad =
          this.props.url !== "" ? findValidAudio(idx) : this.props.url;
        // Only load if we have a valid URL and it's different from current
        if (audioToLoad && audioToLoad !== this.currentPlaying[idx]) {
          this.loadFileWS(idx, audioToLoad);
        }
      } else if (idx > 0) {
        // WS1 and WS2 (annotation tracks)
        const audioToLoad = findValidAudio(idx);
        if (audioToLoad && audioToLoad !== this.currentPlaying[idx]) {
          this.loadFileWS(idx, audioToLoad);
        }
      }
    } else {
      // If WS is Ready and Playing => Check for Playing Actions
      // -> Else => Search and Load
      if (this.currentPlaying[idx] && this.isWSReady[idx]) {
        this.checkPlayingValues(idx);
      } else if (!this.currentPlaying[idx]) {
        const load = this.loadQueue[idx]
          ? this.loadQueue[idx]
          : findValidAudio(idx);
        // Load File if Possible, Otherwise Put Into LoadQueue
        if (!this.fileAllowed(load)) {
          this.loadQueue[idx] = load;
        } else if (load) {
          this.loadFileWS(idx, load);
        }
      }
    }
  };

  /**
   * Processes reactions to state updates
   *
   * This method coordinates all state change responses by:
   * 1. Detecting what changed (URL, timeline, milestones, dimensions)
   * 2. Delegating to specific handlers for each concern
   * 3. Ensuring waveforms stay synchronized with application state
   */
  componentDidUpdate(prevProps: StateProps): void {
    // Track if URL or media files changed
    const urlChanged = prevProps.url !== this.props.url;
    const timelineJustSet =
      prevProps.currentTimeline === -1 && this.props.currentTimeline !== -1;

    // Check if milestones changed (e.g., oral annotations added)
    const milestonesChanged =
      this.props.currentTimeline !== -1 &&
      prevProps.timeline[this.props.currentTimeline] &&
      this.props.timeline[this.props.currentTimeline] &&
      prevProps.timeline[this.props.currentTimeline].milestones !==
        this.props.timeline[this.props.currentTimeline].milestones;

    // Handle each type of state change
    if (timelineJustSet) {
      this.handleTimelineJustSet();
    }

    if (milestonesChanged && !timelineJustSet) {
      this.handleMilestonesChanged();
    }

    if (urlChanged) {
      this.handleUrlChanged();
    }

    // Only update dimensions if they actually changed
    if (
      this.props.isReady &&
      prevProps.isReady &&
      this.lastDimensions !== this.getDimensions()
    ) {
      this.handleDimensionsChanged();
    }

    // Load waveforms for each track
    this.idxs.forEach((idx: number) => {
      this.handleWaveformLoading(idx);
    });
  }

  // ============================================================================
  // WAVEFORM SEEKING HELPERS
  // ============================================================================

  /**
   * Filter active wavesurfers into "highs" (primary tracks) and "lows" (voiceovers)
   *
   * Highs have volume > 0.5^0.25 (≈0.84), lows have volume between 0 and 0.5^0.25
   */
  private getHighsAndLows = (
    actives: number[],
  ): { highs: number[]; lows: number[] } => {
    const highs = actives.filter(
      (a: number) => this.waveSurfers[a].getVolume() > 0.5 ** 0.25,
    );
    const lows = actives.filter(
      (a: number) =>
        this.waveSurfers[a].getVolume() &&
        this.waveSurfers[a].getVolume() <= 0.5 ** 0.25,
    );
    return { highs, lows };
  };

  /**
   * Find the lowest-indexed high wavesurfer that can play the current milestone
   *
   * Returns the index of the lowest valid high, or -1 if none found
   */
  private findLowestValidHigh = (highs: number[], currM: Milestone): number => {
    const currMD = {
      dispatchType: "WSSeek",
      clipStart: currM.startTime,
      clipStop: currM.stopTime,
    };

    return highs.reduce(
      (a: number, b: number) =>
        (!b ||
          getCurrentMilestone(
            0,
            this.waveSurfers[0].getCurrentTime(),
            currMD,
            b,
          ).data.length) &&
        (b < a || a === -1)
          ? b
          : a,
      -1,
    );
  };

  /**
   * Create a callback that loads the next milestone when current one finishes
   *
   * This is used during wsSeek to chain together sequential milestone playback
   */
  private createLoadNextCallback = (
    high: number,
    hIdx: number,
    highs: number[],
    lows: number[],
    idx: number,
    currMiles: any[],
  ): (() => void) => {
    const highWS = this.waveSurfers[high];

    return () => {
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
              getCurrentMilestone(high, this.waveSurfers[high].getCurrentTime())
            ) {
              const comingMIdx =
                findNextMilestoneIndex(
                  getCurrentMilestone(
                    high,
                    this.waveSurfers[high].getCurrentTime(),
                  ),
                ) +
                +(highWS.getDuration() - highWS.getCurrentTime() < 0.05) +
                +(nextIdx <= high) +
                -1;

              if (comingMIdx === currMiles.length)
                highWS.un("pause", this.createLoadNextCallback);
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
                  nextIdx,
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
                  this.waveSurfers[idx].getCurrentTime(),
                ),
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
              idx,
            ),
          );
          this.actingDispatch = { dispatchType: "WSSeek", wsNum: idx };
        }
      }
    };
  };

  /**
   * Set up sequential playback for highs with synchronized lows
   *
   * This subscribes each high wavesurfer to load the next milestone when it finishes
   */
  private setupSequentialPlayback = (
    idx: number,
    currM: Milestone,
    highs: number[],
    lows: number[],
    currMiles: any[],
  ): void => {
    const currMD = {
      dispatchType: "WSSeek",
      clipStart: currM.startTime,
      clipStop: currM.stopTime,
    };

    // Set relative times for lows
    lows.forEach((low: number) => {
      const lowM = getCurrentMilestone(
        0,
        this.waveSurfers[0].getCurrentTime(),
        currMD,
        low,
      );
      if (!low || lowM.data.length) this.setRelativeTime(idx, low, currM, lowM);
    });

    // Subscribe Highs to Function for Loading Next Milestone in Sequence
    highs.forEach((high: number, hIdx: number) => {
      const highWS = this.waveSurfers[high];

      // Function for Loading Next Clip on Pause
      const loadNext = this.createLoadNextCallback(
        high,
        hIdx,
        highs,
        lows,
        idx,
        currMiles,
      );

      // If Current Milestone Has What it Needs => Set Relative Time
      const highM = getCurrentMilestone(
        0,
        this.waveSurfers[0].getCurrentTime(),
        currMD,
        high,
      );
      if (!high || highM.data.length)
        this.setRelativeTime(idx, high, currM, highM);

      // Subscribe High for Pausing (Allows for Loading Next Milestone)
      if (this.props.currentTimeline !== -1) {
        highWS.on("pause", loadNext);
        this.eventHandlers[high].pause.push(loadNext);
      }
    });
  };

  /**
   * Handle waveform seek interaction
   *
   * Called when user clicks/drags on a waveform to seek to a new position.
   * This method:
   * 1. Finds the milestone at the seek position
   * 2. Determines which wavesurfers should play (highs vs lows)
   * 3. Sets up sequential playback if needed
   * 4. Dispatches playback action
   */
  wsSeek = (idx: number): void => {
    if (!this.clicked[idx]) return;

    // Added Mar 2021 because Pause was breaking things.
    // todo: this breaks Single clip playing.
    this.playPausing = false;
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
      this.waveSurfers[idx].getCurrentTime(),
    );
    this.waveSurfers[idx].setVolume(1);
    this.props.setWSVolume(idx, 1);

    // Grab High and Low Audio WSs from the Active WSs
    const actives = this.getActives();
    const { highs, lows } = this.getHighsAndLows(actives);

    // Find Lowest Element of High that Can Play the Seeked Milestone
    const lowestValidHigh = this.findLowestValidHigh(highs, currM);

    // If LowestValidHigh is not this WS => Set Clicked and Relative Time for What Is
    // -> Else => Set Up Subscriptions and Start Playing
    if (lowestValidHigh !== idx) {
      // Allow LowestValidHigh to Be Processed in Seek, and Then Seek It
      this.clicked[lowestValidHigh] = true;
      const currMD = {
        dispatchType: "WSSeek",
        clipStart: currM.startTime,
        clipStop: currM.stopTime,
      };
      this.setRelativeTime(
        idx,
        lowestValidHigh,
        currM,
        getCurrentMilestone(
          0,
          this.waveSurfers[0].getCurrentTime(),
          currMD,
          lowestValidHigh,
        ),
      );
    } else {
      // Set up sequential playback for highs with synchronized lows
      this.setupSequentialPlayback(idx, currM, highs, lows, currMiles);

      // If Current Timeline is not Empty => Dispatch Clip to trigger sequential playback with voiceovers
      // -> Else => Play as Normal
      if (this.props.currentTimeline !== -1) {
        // Instead of calling checkVOAndPlay/seekSyncAndPlay, dispatch a Clip action
        // This will use the full Clip handler logic for sequential highs + simultaneous lows

        // For WS0, use source timeline (startTime/stopTime)
        // For WS1/WS2, use annotation timeline (data[0].clipStart/clipStop)
        const clipStart =
          idx === 0
            ? currM.startTime
            : (currM.data[0]?.clipStart ?? currM.startTime);
        const clipStop =
          idx === 0
            ? currM.stopTime
            : (currM.data[0]?.clipStop ?? currM.stopTime);

        this.props.setDispatch({
          dispatchType: "Clip",
          wsNum: idx,
          clipStart,
          clipStop,
        });
      } else {
        this.seekSyncAndPlay(0, {
          annotationID: "",
          startTime: 0,
          stopTime: ws.getDuration(),
          data: [],
        });
      }
      // this.actingDispatch = { dispatchType: "WSSeek", wsNum: idx };
      // todo: can I delete this?
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
          .length,
    );
    let voM;
    if (
      validLows.length &&
      ((voM = getCurrentMilestone(
        0,
        this.waveSurfers[0].getCurrentTime(),
        mD,
        validLows[this.voNum],
      )).data.length ||
        !validLows[this.voNum])
    ) {
      if (this.voNum) this.setRelativeTime(validLows[this.voNum], idx, voM, m);
      this.setRelativePlay(idx, validLows[this.voNum], m, voM);
      this.voNum = (this.voNum + 1) % validLows.length;
    }
    this.seekSyncAndPlay(idx, m);
  };
  // 0 direct, 1 get relative time in reverse, find annotation in src milestone
  dispatchSubtitle = (idx: number, m: any): void => {
    if (m !== undefined && m.annotationID !== undefined) {
      if (idx <= 1) {
        const currentSubtitle: string = getSubtitle(m.annotationID, 1);
        this.props.setSubtitle(currentSubtitle);
      } else if (idx === 2) {
        const currentSubtitle: string = getSubtitle(m.annotationID, 2);
        this.props.setSubtitle(currentSubtitle);
      } else {
        console.log("oopsie");
      }
    }
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
        clipTime(0, m, true),
      ),
      "fraction",
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
          "x.",
      );
    }
    this.dispatchSubtitle(idx, m);
    // Play From Now Until End of Clip
    this.waveSurfers[idx].play(
      this.waveSurfers[idx].getCurrentTime(),
      findNextMilestoneIndex(m) === findLastMilestoneIndex(idx)
        ? this.waveSurfers[idx].getDuration()
        : clipTime(idx, m, false),
    );
  };

  // Sets WS Idx2 to the Time Relative to WS Idx1
  // -> Returns Playback Rate
  setRelativeTime = (
    idx1: number,
    idx2: number,
    mile1: any,
    mile2: any,
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
      },
    );

    // Set High Clicked and Seek it to the Relative Time
    // This Makes First High First One to Play
    this.waveSurfers[idx2].seekTo(
      calcRelativeTime(
        this.waveSurfers[idx1].getCurrentTime(),
        clipTime(idx1, mile1, true),
        this.waveSurfers[idx2].getDuration(),
        playbackRate,
        clipTime(idx2, mile2, true),
      ),
    );
    return playbackRate;
  };

  setRelativePlay = (
    idx1: number,
    idx2: number,
    mile1: any,
    mile2: any,
  ): void => {
    this.currentSpeeds[idx2] = this.setRelativeTime(idx1, idx2, mile1, mile2);
    this.waveSurfers[idx2].setPlaybackRate(
      roundIt(this.currentSpeeds[idx2], 2),
    );
    this.dispatchSubtitle(idx2, mile2);
    this.waveSurfers[idx2].play(
      this.waveSurfers[idx2].getCurrentTime(),
      clipTime(idx2, mile2, false),
    );
  };

  // Loads a WS and Subscribes it to an "onReady" Function
  loadFileWS = (idx: number, load: string): void => {
    // Don't load if already loading this file
    if (this.currentPlaying[idx] === load) {
      return;
    }

    // Mark as not ready while loading (disables volume controls)
    this.isWSReady[idx] = false;

    // Grab WS, Its WF (if it exists), and Subscription Function (based on if WF exists or not)
    const ws = this.waveSurfers[idx];
    //todo:, Waveforms not saved, so all are currently false.
    const wave = false;
    /* const tempWave =
      idx === 0
        ? this.props.sourceMedia.filter((f: any) => f.blobURL === load)
        : this.props.annotMedia.filter((f: any) => f.blobURL === load);
    if (tempWave[0]) {
      wave = tempWave[0].waveform;
    } */
    /*
       let wave: undefined | string = undefined;
    if (idx === 0) {
      wave = this.props.sourceMedia.filter((f: any) => f.blobURL === load);
    } else {
      const annotMed = this.props.annotMedia.filter(
        (f: any) => f.blobURL === load
      );
      if (annotMed) {
        wave = annotMed[0].waveform;
      }
    }
    */
    // WaveSurfer v7: Use 'ready' event (fires when audio is decoded and rendered)
    // v6 used 'waveform-ready' but that event no longer exists in v7
    const sub = "ready";

    // Subscription Function to Act Whenever WS is Ready or WFReady
    const waveformReady = () => {
      console.log(
        `[DeeJay] WS${idx} ===== WAVEFORM READY CALLBACK EXECUTING =====`,
      );
      console.log(
        `[DeeJay] WS${idx} waveform ready. currentTimeline:`,
        this.props.currentTimeline,
      );

      // Mark this WaveSurfer as ready (for volume controls)
      this.isWSReady[idx] = true;

      // Add WF and Set WS Duration
      // WaveSurfer v7: exportPCM is replaced with getDecodedData
      // getDecodedData returns an AudioBuffer
      const decodedData = this.waveSurfers[idx].getDecodedData();
      const peaks: number[][] = [];
      if (decodedData) {
        for (let i = 0; i < decodedData.numberOfChannels; i++) {
          peaks.push(Array.from(decodedData.getChannelData(i)));
        }
      }

      this.props.waveformAdded({
        ref: this.currentPlaying[idx],
        sourceAnnot: idx === 0,
        wavedata: peaks,
      });

      // Draw All Regions currentTimeline Has
      if (this.props.currentTimeline !== -1) {
        const milestones =
          this.props.timeline[this.props.currentTimeline].milestones;

        milestones.forEach((m: any, mileNum: number) => {
          const region = {
            id: m.startId,
            start: m.startTime,
            end: m.stopTime,
            color: this.regionColors[mileNum],
            drag: false,
            resize: false,
          };
          if (idx === 0) {
            this.regionsPlugins[idx].addRegion(region);
          } else {
            // WS1 plays Careful_Merged.mp3, WS2 plays Translation_Merged.mp3
            // Look for data items with channel "CarefulMerged" or "TranslationMerged"
            // which have clipStart/clipStop positions in the merged audio
            m.data.forEach((d: LooseObject) => {
              if (
                d.channel === `${idx === 1 ? "Careful" : "Translation"}Merged`
              ) {
                this.regionsPlugins[idx].addRegion({
                  ...region,
                  start: d.clipStart,
                  end: d.clipStop,
                });
              }
            });
          }
        });
      } else {
        console.log(
          `[DeeJay] WS${idx} no timeline selected (currentTimeline = -1), skipping regions`,
        );
      }

      // Start Up if WS0, Reload All Regions, and unsubscribe
      if (idx === 0) {
        //todo: Add subtitle here.
        if (this.props.currentTimeline >= 0) {
          console.log(
            `[DeeJay] WS0 ready and timeline exists, dispatching PlayerSeek to start playback`,
          );
          // Use setTimeout to ensure dispatch happens after waveformReady completes
          setTimeout(() => {
            this.props.setDispatch({
              dispatchType: "PlayerSeek",
              wsNum: -1,
              refStart: 0,
            });
          }, 100);
        } else {
          // Timeline doesn't exist yet - wait for it to be created
          // Auto-play will happen in componentDidUpdate when timeline is set
          console.log(
            `[DeeJay] WS0 ready but no timeline yet, waiting for timeline setup`,
          );
        }
      }
      toggleAllRegions(this.regionsOn, true, this.getWSRegions());
      ws.un(sub, waveformReady);
    };

    // Subscribe to Appropriate Ready Function
    console.log(
      `[DeeJay] WS${idx} About to subscribe waveformReady callback to '${sub}' event`,
    );
    ws.on(sub, waveformReady);
    console.log(
      `[DeeJay] WS${idx} Subscribed. Now loading:`,
      load.substring(0, 60),
    );

    // Load WS (with/without Wave) and Update LoadQueue and CurrentPlaying
    this.currentPlaying[idx] = load;
    if (wave) ws.load(load, JSON.parse(wave));
    else ws.load(load);
    this.loadQueue[idx] = "";
    console.log(
      `[DeeJay] WS${idx} ws.load() called, waiting for 'ready' event to fire...`,
    );
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
      2,
    );
    if (ws.getPlaybackRate() !== expRate) ws.setPlaybackRate(expRate);
  };

  // Checks for Whether or not Given Blob is wsAllowed
  fileAllowed = (blobURL: string) => {
    const tempSrc = this.props.sourceMedia.filter(
      (m: LooseObject) => m.blobURL === blobURL,
    );
    const tempAnnot = this.props.annotMedia.filter(
      (m: LooseObject) => m.blobURL === blobURL,
    );

    const srcAllowed = tempSrc.length && tempSrc[0].wsAllowed;
    const annotAllowed = tempAnnot.length && tempAnnot[0].wsAllowed;
    return srcAllowed || annotAllowed;
  };

  // Resets Volumes of and Stops all but Specified WS
  solo = (wsNum: number, resetAll: boolean, wsNum2 = -1): void => {
    // If Reset All or Any High => Set Only wsNum On
    if (
      resetAll ||
      !this.idxs.reduce(
        (a: number, b: number) =>
          +(a || this.waveSurfers[b].getVolume() > 0.5 ** 0.25),
        0,
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
        roundIt(this.currentSpeeds[idx], 2),
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
    if (!this.waveSurfers[idx]) return;

    // WaveSurfer v7: Use our tracked handlers
    if (handler === "pause" || handler === "play") {
      const handlers = this.eventHandlers[idx][handler as "pause" | "play"];
      handlers.forEach((handlerFn) => {
        this.waveSurfers[idx].un(handler, handlerFn);
      });
      // Clear the tracked handlers array
      this.eventHandlers[idx][handler as "pause" | "play"] = [];
    }
  };

  // Returns an Array with the Indexes of Active WSs
  getActives = (): Array<number> => {
    return this.idxs.filter(
      (idx: number) =>
        this.waveSurfers[idx].getVolume() > 0 ||
        this.waveSurfers[idx].isPlaying(),
    );
  };

  getWSRegions = (): Array<any> => {
    return this.idxs.map((idx: number) =>
      this.regionsPlugins[idx] ? this.regionsPlugins[idx].getRegions() : [],
    );
  };

  // ============================================================================
  // DISPATCH HANDLERS
  // ============================================================================

  /**
   * Handle WSSeek dispatch - User clicked and dragged on waveform to seek
   */
  private handleWSSeekDispatch = (wsNum: number): void => {
    this.clearDispatchLeftovers();
    this.clicked[wsNum] = true;
    this.waveSurfers[wsNum].pause();
    this.wsSeek(wsNum);
  };

  /**
   * Handle PlayerSeek dispatch - Seek triggered from video player timeline
   */
  private handlePlayerSeekDispatch = (dispatch: DeeJayDispatch): void => {
    this.clearDispatchLeftovers();
    const refStart = dispatch.refStart || 0;

    // Fetch the Active WSs and Processes Based on How Many
    const actives = this.getActives();

    // "Click" WS So That it can Automatically Seek Beyond Beginning Milestone
    this.clicked[actives[0]] = true;

    // If WS 0 => Seek To Ref
    // -> Else If Milestone Data Exists => Seek To Relative Ref
    const currM = getInterMilestone(refStart, actives[0]);
    const playbackRate = 1;

    if (actives[0] === 0) {
      this.dispatchSubtitle(0, currM);
      this.waveSurfers[0].seekTo(
        refStart / this.waveSurfers[actives[0]].getDuration(),
      );
    } else if (currM.data.length === 1) {
      this.dispatchSubtitle(0, currM);
      this.waveSurfers[actives[0]].seekTo(
        ((refStart - currM.startTime) / playbackRate +
          currM.data[0].clipStart) /
          this.waveSurfers[actives[0]].getDuration(),
      );
    }

    // Set actingDispatch so PlayPause knows which wavesurfer to play
    this.actingDispatch = { dispatchType: "PlayerSeek", wsNum: actives[0] };

    // Auto-play after seeking
    if (
      this.props.currentTimeline !== -1 &&
      currM &&
      currM.startTime !== undefined
    ) {
      console.log(
        `[DeeJay] PlayerSeek auto-play: dispatching Clip for WS${actives[0]} from ${currM.startTime} to ${currM.stopTime}`,
      );
      console.log(`[DeeJay] PlayerSeek currM.data:`, currM.data);

      // Use setTimeout to ensure the Clip dispatch happens after the current dispatch cycle completes
      setTimeout(() => {
        this.props.setDispatch({
          dispatchType: "Clip",
          wsNum: actives[0],
          clipStart: currM.startTime,
          clipStop: currM.stopTime,
        });
      }, 50);
    } else {
      console.log(
        `[DeeJay] PlayerSeek auto-play skipped: currentTimeline=${this.props.currentTimeline}, currM=`,
        currM,
      );
    }
  };

  /**
   * Handle PlayPause dispatch - Toggle play/pause state for all active waveforms
   */
  private handlePlayPauseDispatch = (): void => {
    // If Playing => Stop All
    // -> If Not Playing, Fetch all the "Actives"
    const playerPlaying = this.props.playerPlaying;
    const actives: number[] = [];

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
        let currM;
        try {
          currM = getCurrentMilestone(
            this.actingDispatch.wsNum,
            this.waveSurfers[this.actingDispatch.wsNum].getCurrentTime(),
            {
              dispatchType: "",
            },
            this.actingDispatch.wsNum,
          );
        } catch {
          // TODO: Make this cleaner, currently sets startingtime to zero if segment is skipped.
          currM = undefined;
          console.log("Time was empty, move along");
        }
        if (currM !== undefined) {
          this.dispatchSubtitle(this.actingDispatch.wsNum, currM);
          ppWS.play(
            ppWS.getCurrentTime(),
            clipTime(this.actingDispatch.wsNum, currM, false),
          );
          this.props.togglePlay(true);
        } else {
          // Avoid the Crash
          this.sendSnackbar(
            "No Annotation Audio to Play at this Point, Please click on an active timeline.",
          );
        }
      }
      if (this.actingDispatch.wsNum2 !== undefined) {
        const ppWS = this.waveSurfers[this.actingDispatch.wsNum2];
        const currM = getCurrentMilestone(
          this.actingDispatch.wsNum2,
          this.waveSurfers[this.actingDispatch.wsNum2].getCurrentTime(),
          {
            dispatchType: "",
          },
          this.actingDispatch.wsNum2,
        );
        if (currM !== undefined) {
          this.dispatchSubtitle(this.actingDispatch.wsNum2, currM);
          ppWS.play(
            ppWS.getCurrentTime(),
            clipTime(this.actingDispatch.wsNum2, currM, false),
          );
        } else {
          // Avoid the Crash
          this.sendSnackbar(
            "Nothing to Play, Please click on an active timeline.",
          );
        }
      }
    }
  };

  /**
   * Handle Clip dispatch - Play a specific milestone clip with voiceovers
   *
   * This is the most complex dispatch handler. It:
   * 1. Sets up "highs" (primary audio tracks) and "lows" (voiceover tracks)
   * 2. Creates voiceover callbacks that play synchronized with the main clip
   * 3. Chains clips together sequentially for multi-track playback
   * 4. Manages playback rates to keep everything in sync
   */
  private handleClipDispatch = (
    dispatch: DeeJayDispatch,
    wsNum: number,
    wsNum2: number,
  ): void => {
    this.clearDispatchLeftovers();

    // Only reset volumes if no wavesurfers are currently active (coming from annotation table)
    // If wavesurfers are already active (coming from waveform drag), preserve their volumes
    const hasActiveWavesurfers = this.idxs.some(
      (idx: number) => this.waveSurfers[idx].getVolume() > 0,
    );

    if (!hasActiveWavesurfers) {
      // Coming from annotation table - reset all volumes and enable only wsNum (and wsNum2)
      this.solo(wsNum, true, wsNum2);
    }

    if (wsNum < 0) wsNum = 0;
    // Grab Current Milestone and "Solo" the Given WS
    const currM = getCurrentMilestone(
      wsNum,
      this.waveSurfers[wsNum].getCurrentTime(),
      dispatch,
    );

    // Guard against undefined milestone
    if (!currM || currM.startTime === undefined) {
      console.error(
        `[DeeJay] Clip dispatch failed: no milestone found for WS${wsNum} at position ${this.waveSurfers[wsNum].getCurrentTime()}`,
      );
      this.sendSnackbar("No audio clip found at this position");
      return;
    }

    // Ensure the clicked wavesurfer is fully enabled
    this.waveSurfers[wsNum].setVolume(1);
    this.props.setWSVolume(wsNum, 1);

    // Grab High and Low Audio WSs from the Active WSs
    const actives = this.getActives();
    actives.forEach((idx: number) => this.waveSurfers[idx].pause());
    const highs = actives.filter(
      (idx: number) => this.waveSurfers[idx].getVolume() > 0.5 ** 0.25,
    );
    const lows = actives.filter(
      (idx: number) =>
        this.waveSurfers[idx].getVolume() > 0 &&
        this.waveSurfers[idx].getVolume() < 0.5 ** 0.25,
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
        highs[x],
      );

      // Process Only if it WS is 0 or M1 has Data
      if (!highs[x] || m1.data.length) {
        const m1Start = clipTime(highs[x], m1, true);
        const m1Stop = clipTime(highs[x], m1, false);

        // Determine actual play start position
        // If wavesurfer is already positioned within this clip, start from current position
        // Otherwise start from clip beginning
        const currentPos = this.waveSurfers[highs[x]].getCurrentTime();
        const actualM1Start =
          currentPos >= m1Start && currentPos < m1Stop ? currentPos : m1Start;

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
            lows[y],
          );

          // Process Only if it Has Data
          if (!lows[y] || m2.data.length) {
            const m2Start = clipTime(lows[y], m2, true);
            const m2Stop = clipTime(lows[y], m2, false);

            // Calculate relative start position for voiceover
            // If main clip starts mid-way, voiceover should start at corresponding position
            const voiceoverCurrentPos =
              this.waveSurfers[lows[y]].getCurrentTime();
            const actualM2Start =
              voiceoverCurrentPos >= m2Start && voiceoverCurrentPos < m2Stop
                ? voiceoverCurrentPos
                : m2Start;

            // Create and Push Next Voiceover
            voiceOvers.push(() => {
              // Craft its Region
              if (this.waveSurfers[lows[y]] && this.regionsPlugins[lows[y]]) {
                updateRegionAlpha(
                  this.regionsPlugins[lows[y]].getRegions(),
                  0.7,
                  m2Start,
                  m2Stop,
                );
              }

              // Determine its Playback Rate
              this.currentSpeeds[lows[y]] = calcPlaybackRate(
                m2,
                {
                  dispatchType: "Clip",
                  clipStart: actualM1Start,
                  clipStop: m1Stop,
                },
                {
                  dispatchType: "Clip",
                  clipStart: actualM2Start,
                  clipStop: m2Stop,
                },
              );
              this.waveSurfers[lows[y]].setPlaybackRate(
                roundIt(this.currentSpeeds[lows[y]], 2),
              );
              this.waveSurfers[lows[y]].play(actualM2Start, m2Stop);
            });
          }
        }

        // Craft RecentStart for Linking Together the Clips
        recentStart = () => {
          if (!this.playPausing && (x === 0 || !this.clipStart)) {
            // Reset Highlights
            toggleAllRegions(this.regionsOn, true, this.getWSRegions());
            if (
              this.waveSurfers[highs[x]] &&
              this.waveSurfers[highs[x]].regions &&
              this.waveSurfers[highs[x]].regions.list
            ) {
              updateRegionAlpha(
                this.waveSurfers[highs[x]].regions.list,
                0.7,
                m1Start,
                m1Stop,
              );
            }
            if (this.voNum + x < voiceOvers.length)
              voiceOvers[voiceOvers.length - (this.voNum + x + 1)]("");
            this.props.setPlaybackRate(
              roundIt(calcPlaybackRate(m1, dispatch), 2),
            );

            // Calculate video seek position based on where we're actually starting
            // If starting from middle of clip, adjust video position accordingly
            const playbackRate = highs[x] === 0 ? 1 : calcPlaybackRate(m1);
            const videoSeekTime =
              highs[x] === 0
                ? actualM1Start // WS0 is source, use direct position
                : m1.startTime + (actualM1Start - m1Start) * playbackRate; // WS1/WS2, calculate relative source position

            this.props.setSeek(videoSeekTime || 0, "seconds");
            this.props.togglePlay(true);
            this.dispatchSubtitle(highs[x], m1);
            this.waveSurfers[highs[x]].play(actualM1Start, m1Stop);
            if (x > 0) this.waveSurfers[highs[x - 1]].un("pause", recentStart);
          }
        };

        // Sub Next Lowest WS to RecentStart Only if Not Lowest WS
        if (x > 0) {
          this.waveSurfers[highs[x - 1]].on("pause", recentStart);
          this.eventHandlers[highs[x - 1]].pause.push(recentStart);
        }
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
          this.eventHandlers[highs[x]].pause.push(resetDispatch);
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
      this.eventHandlers[highs[0]].pause.push(secondVO);
    }
  };

  /**
   * Responds to DJ Dispatches
   *
   * Central dispatcher that routes different dispatch types to their specific handlers.
   * This method has been refactored to be a simple router, with the actual logic
   * extracted into separate handler methods.
   */
  dispatchDJ = (): void => {
    // Store Dispatch Into Local Variable and Clear It
    if (this.props.dispatch.dispatchType !== "PlayPause") {
      this.actingDispatch = { ...this.props.dispatch };
      this.playPausing = false;
    } else this.playPausing = true;
    const dispatch = { ...this.props.dispatch };
    if (this.debugPlayback) {
      this.sendSnackbar(
        "Playing WS" +
          dispatch.wsNum +
          " from " +
          dispatch.clipStart +
          " to " +
          dispatch.clipStop +
          ".",
      );
    }
    this.props.setDispatch({ dispatchType: "" });

    // Extract dispatch parameters
    const wsNum =
      this.props.dispatch.wsNum !== undefined ? this.props.dispatch.wsNum : -1;
    const wsNum2 =
      this.props.dispatch.wsNum2 !== undefined
        ? this.props.dispatch.wsNum2
        : -1;

    // Route dispatch to appropriate handler
    switch (dispatch.dispatchType) {
      case "WSSeek":
        this.handleWSSeekDispatch(wsNum);
        break;
      case "PlayerSeek":
        this.handlePlayerSeekDispatch(dispatch);
        break;
      case "PlayPause":
        this.handlePlayPauseDispatch();
        break;
      case "Clip":
        this.handleClipDispatch(dispatch, wsNum, wsNum2);
        break;
    }
  };
  // TODO: Make this a global function
  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) => {
    if (vType === "error") {
      toast.error(inMessage);
    } else if (vType === "success") {
      toast.success(inMessage);
    } else {
      toast(inMessage);
    }
  };
  render(): JSX.Element {
    const activeTimeline =
      this.props.timeline?.[this.props.currentTimeline] ?? null;
    const exportLabel = hasSyncedVideo(activeTimeline)
      ? "Export Video"
      : "Export Audio";

    const waveTableRows = (idx: number) => {
      return (
        <WaveTableRow
          getPlaybackRate={() =>
            this.waveSurfers[idx] && this.waveSurfers[idx].getPlaybackRate()
          }
          getReady={() => this.isWSReady[idx]}
          index={idx}
          onClick={() => {
            if (this.waveSurfers[idx] && this.isWSReady[idx]) {
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
                <td colSpan={3} className="cellWithTitle">
                  <div className="rowTitle">Original</div>
                </td>
              </tr>
              {waveTableRows(0)}
              <tr>
                <td colSpan={3} className="cellWithTitle">
                  <div className="rowTitle">Careful</div>
                </td>
              </tr>
              {waveTableRows(1)}
              <tr>
                <td colSpan={3} className="cellWithTitle">
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
        <button
          onClick={async () => {
            if (!activeTimeline) {
              toast.error("Load a timeline before exporting.");
              return;
            }

            await exportVideo(
              activeTimeline,
              this.props.playbackMultiplier,
              this.props.volumes,
            );
          }}
        >
          {exportLabel}
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
      onReady: actions.onReady,
      setDispatch: actions.setDispatch,
      setPlaybackRate: actions.setPlaybackRate,
      setSeek: actions.setSeek,
      setSubtitle: actions.setSubtitle,
      setWSVolume: actions.setWSVolume,
      togglePlay: actions.togglePlay,
      waveformAdded: actions.waveformAdded,
    },
    dispatch,
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(DeeJay);
