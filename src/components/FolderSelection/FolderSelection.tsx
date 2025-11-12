import * as aTypes from "../../store/annot/types";
import * as actions from "../../store";
import * as tTypes from "../../store/tree/types";

import Timelines from "./Timelines";
import React, { Component } from "react";
import {
  getSourceMedia,
  getTimelineIndex,
  roundIt,
  safeParseSync,
} from "../globalFunctions";
import { electronAPI } from "../../utils/electronAPI";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import toast from "react-hot-toast";
import {
  testingAnnot,
  testingAnnotMedia,
  testingSourceMedia,
} from "./WebExample";

interface StateProps {
  annotMedia: aTypes.LooseObject[];
  annot: aTypes.AnnotationState;
  // eslint-disable-next-line @typescript-eslint/ban-types
  annotations: object;
  availableFiles: aTypes.LooseObject[];
  categories: string[];
  env: string;
  folderName: string;
  folderPath: string;
  sourceMedia: aTypes.LooseObject[];
  timeline: aTypes.LooseObject[];
  url: string;
  tree: tTypes.TreeState;
}

interface DispatchProps {
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  annotMediaAdded: typeof actions.annotMediaAdded;
  annotMediaChanged: typeof actions.annotMediaChanged;
  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  loadAnnot: typeof actions.loadAnnot;
  loadTree: typeof actions.loadTree;
  onNewFolder: typeof actions.onNewFolder;
  onReloadFolder: typeof actions.onReloadFolder;
  pushTimeline: typeof actions.pushTimeline;
  setURL: typeof actions.setURL;
  sourceMediaAdded: typeof actions.sourceMediaAdded;
  sourceMediaChanged: typeof actions.sourceMediaChanged;
  setAnnotMediaInMilestones: typeof actions.setAnnotMediaInMilestones;
  setTimelinesInstantiated: typeof actions.setTimelinesInstantiated;
  setTimelineChanged: typeof actions.setTimelineChanged;
  setAnnotMediaWSAllowed: typeof actions.setAnnotMediaWSAllowed;
  setSourceMediaWSAllowed: typeof actions.setSourceMediaWSAllowed;
}

interface FolderProps extends StateProps, DispatchProps {}

class SelectFolderZone extends Component<FolderProps> {
  private isChokReady = false;
  private currentFolder: string = "";
  private prevPath = "";
  private readyPlayURL = "";
  private usingStoredData = false;
  private watcherId: string | null = null;

  componentDidMount(): void {
    // Cleaning Storage
    // FIXME: This is a hack to avoid a crash during presentation.
    for (const l in localStorage)
      if (l.startsWith("Prestige")) localStorage.removeItem(l);
  }

  componentDidUpdate(prevProps: FolderProps): void {
    // If timeline was just created and we have a URL set, update currentTimeline
    if (
      prevProps.timeline.length === 0 &&
      this.props.timeline.length > 0 &&
      this.props.url !== "" &&
      this.props.url !== "none"
    ) {
      const timelineIndex = getTimelineIndex(
        this.props.timeline,
        this.props.url,
        this.props.sourceMedia
      );
      console.log(`[FolderSelection] Timeline created! Updating currentTimeline from -1 to ${timelineIndex}`);
      if (timelineIndex !== -1) {
        this.props.setURL(this.props.url, timelineIndex);
      }
    }
  }

  async componentWillUnmount() {
    if (this.watcherId !== null) {
      await electronAPI.stopWatcher(this.watcherId);
    }
    // Remove file system event listener
    electronAPI.removeFileSystemEventListener();
    console.log("UnMounting Trees");
    // Todo: Also Unmount/Kill FFMpeg.
  }

  // Helper: Processes File and Returns File Definition
  private chokFileDescribe = async (
    path: string,
  ): Promise<aTypes.LooseObject> => {
    // Define Fields for Returned FileDef using secure APIs
    const parsedPath = safeParseSync(path);

    // Get MIME Type of File
    const tempMime = await electronAPI.getMimeType(path);

    // For audio/video files, convert to blob URL for webSecurity compatibility
    // For other files, use file:// URL
    let blobURL: string;
    const isAudioVideo = tempMime.startsWith("audio") || tempMime.startsWith("video");

    if (isAudioVideo) {
      try {
        // Read file as ArrayBuffer
        const arrayBuffer = await electronAPI.readFileAsBuffer(path);
        // Create Blob from ArrayBuffer with proper MIME type
        const blob = new Blob([arrayBuffer], { type: tempMime });
        // Create blob URL
        blobURL = URL.createObjectURL(blob);
        console.log(`[chokFileDescribe] Created blob URL for ${parsedPath.base}`);
      } catch (error) {
        console.error(`[chokFileDescribe] Error creating blob URL for ${path}:`, error);
        // Fallback to file:// URL if blob creation fails
        blobURL = await electronAPI.pathToFileURL(path);
      }
    } else {
      blobURL = await electronAPI.pathToFileURL(path);
    }

    const isMerged = parsedPath.base.includes("_Merged");
    const isAnnotation =
      parsedPath.dir.endsWith("_Annotations") ||
      parsedPath.base.includes("oralAnnotations") ||
      isMerged;

    // If ".mts" File => Convert (TODO: Implement video conversion via IPC)
    // -> Else If ".eaf" File => Process
    if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
      console.log("MTS video conversion not yet implemented via IPC");
      // TODO: Implement via electronAPI.convertVideo
    } else if (tempMime.endsWith("eaf")) {
      console.log(parsedPath.base, tempMime);
      this.callProcessEAF(path);
    }

    // Returns the File Definition
    return {
      blobURL: blobURL,
      extension: parsedPath.ext,
      hasAnnotation: false,
      isAnnotation: isAnnotation,
      isMerged: isMerged,
      inMilestones: false,
      mimeType: tempMime,
      name: parsedPath.base,
      path: path,
      wsAllowed: false,
      waveform: false,
    };
  };

  // Starts the Chokidar File Watcher
  startWatcher = async (path: string, props: any, ignoreInitial = false) => {
    // Closes Existing Watcher
    if (this.watcherId !== null) {
      await electronAPI.stopWatcher(this.watcherId);
    }

    // Start watcher via IPC
    this.watcherId = await electronAPI.startWatcher(path, {
      ignoreInitial: ignoreInitial,
    });

    // Set up IPC event listener for file system events
    electronAPI.onFileSystemEvent(async (event: any) => {
      // Only process events from our watcher
      if (event.watcherId !== this.watcherId) return;

      switch (event.type) {
        case "add":
          await this.handleFileAdd(event.path, props);
          break;
        case "addDir":
          console.log(`Directory ${event.path} has been added`);
          break;
        case "change":
          await this.handleFileChange(event.path, props);
          break;
        case "unlink":
          await this.handleFileUnlink(event.path, props);
          break;
        case "unlinkDir":
          console.log(`Directory ${event.path} has been removed`);
          break;
        case "error":
          console.log(`Watcher error: ${event.error}`);
          break;
        case "ready":
          await this.handleWatcherReady(props);
          break;
      }
    });
  };

  // Handler for file add events
  private handleFileAdd = async (path: string, props: any) => {
    this.props.setTimelineChanged(true);

    if (this.isChokReady && path.endsWith(".eaf") && !this.usingStoredData) {
      this.props.setTimelinesInstantiated(false);
      this.isChokReady = false;
      this.loadLocalFolder(this.currentFolder);
    } else {
      const fileDef = await this.chokFileDescribe(path);
      if (!fileDef) return;

      const isAudVid =
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio");

      if (isAudVid) {
        if (fileDef.isAnnotation) {
          this.props.annotMediaAdded({ file: fileDef });
        } else {
          this.props.sourceMediaAdded({ file: fileDef });
          if (fileDef.name.endsWith("_StandardAudio.wav")) {
            this.convertToMP3(fileDef.path);
          }
        }
      } else {
        this.props.fileAdded({ file: fileDef });
      }
    }
    await this.setLocal(this.currentFolder);
    console.log(`File ${path} has been added`);
  };

  // Handler for file change events
  private handleFileChange = async (path: string, props: any) => {
    this.props.setTimelineChanged(true);

    if (this.isChokReady && path.endsWith(".eaf")) {
      this.props.setTimelinesInstantiated(false);
      this.isChokReady = false;
      this.loadLocalFolder(this.currentFolder);
    } else {
      const fileDef = await this.chokFileDescribe(path);
      if (!fileDef) return;

      const isAudVid =
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio");

      if (isAudVid) {
        if (fileDef.isAnnotation) {
          this.props.annotMediaChanged({ file: fileDef });
        } else {
          this.props.sourceMediaChanged({ file: fileDef });
          if (fileDef.name.endsWith("_StandardAudio.wav")) {
            this.convertToMP3(fileDef.path);
          }
        }
      } else {
        props.fileChanged({ file: fileDef });
      }
    }
    await this.setLocal(this.currentFolder);
    console.log(`File ${path} has been changed`);
  };

  // Handler for file deletion events
  private handleFileUnlink = async (path: string, props: any) => {
    const fileURL = await electronAPI.pathToFileURL(path);
    props.fileDeleted(fileURL);
    console.log(`File ${path} has been removed`);
  };

  // Handler for watcher ready event
  private handleWatcherReady = async (props: any) => {
    if (!this.usingStoredData) {
      if (this.readyPlayURL !== "") {
        props.setURL(
          this.readyPlayURL,
          getTimelineIndex(this.props.timeline, this.readyPlayURL, this.props.sourceMedia),
        );
        this.readyPlayURL = "";
      } else if (this.props.sourceMedia.length !== 0) {
        await this.loadAnnot(true);
        await this.loadAnnot(false);
        const blobURL = getSourceMedia(this.props.sourceMedia, false)[0]
          .blobURL;
        props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL, this.props.sourceMedia));
        console.log(`Initial scan complete. Ready for changes`);
      } else {
        console.log("Empty Directory");
      }
    } else if (this.props.url === "" && this.props.sourceMedia.length !== 0) {
      const blobURL = getSourceMedia(this.props.sourceMedia, false)[0].blobURL;
      props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL, this.props.sourceMedia));
    }

    this.isChokReady = true;
    this.usingStoredData = false;
    this.props.setTimelinesInstantiated(true);
  };

  private async dirSnapshot(dir: string): Promise<string> {
    // Returns Stringified DIR Object using secure API
    if (!dir) {
      throw new Error("Directory path is required for snapshot");
    }
    return await electronAPI.getDirectorySnapshot(dir);
  }

  hasLocal = async (dir: string): Promise<boolean> => {
    const currentDir = await this.dirSnapshot(dir);
    if (
      localStorage.getItem(`Prestige.${dir}`) !== undefined &&
      localStorage.getItem(`Prestige.${dir}`) !== null &&
      localStorage.getItem(`Prestige.${dir}`) !== currentDir
    ) {
      const oldDir = JSON.parse(localStorage.getItem(`Prestige.${dir}`) + "");
      const newDir = JSON.parse(currentDir + "");
      // Find differences (simple array diff without lodash)
      const diffs = newDir.filter((item: any) => !oldDir.includes(item));
      if (diffs.length > 0) {
        console.log(diffs);
      }
      console.log("Diffed");
    }

    return (
      this.props.timeline.length === 0 &&
      localStorage.getItem(`Prestige.${dir}`) !== null &&
      localStorage.getItem(`Prestige.${dir}`) === currentDir &&
      localStorage.getItem(`Prestige.annot.${dir}`) !== null &&
      localStorage.getItem(`Prestige.tree.${dir}`) !== null
    );
  };

  loadLocal = (dir: string) => {
    const inAnnot = localStorage.getItem(`Prestige.annot.${dir}`) + "";
    this.props.loadAnnot(JSON.parse(inAnnot));

    const inTree = localStorage.getItem(`Prestige.tree.${dir}`) + "";
    this.props.loadTree(JSON.parse(inTree));

    this.usingStoredData = true;

    // The Folder is unchanged. No need to scan.
    return false;
  };

  setLocal = async (dir: string): Promise<boolean> => {
    if (!dir) {
      return false;
    }
    if (
      this.props.timeline.length > 0 &&
      this.props.tree.sourceMedia.length !== 0
    ) {
      const snapshot = await this.dirSnapshot(dir);
      localStorage.setItem(`Prestige.${dir}`, snapshot);
      localStorage.setItem(
        `Prestige.tree.${dir}`,
        JSON.stringify(this.props.tree),
      );
      localStorage.setItem(
        `Prestige.annot.${dir}`,
        JSON.stringify(this.props.annot),
      );
      const time = Date.now() + 0;
      const timeString = time.toString();
      localStorage.setItem("Prestige.time", timeString);
      return true;
    }
    return false;
  };

  // Loads a Local Folder from its Path
  async loadLocalFolder(folderPath: string) {
    console.log("=== loadLocalFolder called ===");
    console.log("folderPath:", folderPath);

    // Validate we have a path
    if (!folderPath) {
      console.log("Undefined Directory Selected - no folderPath");
      return;
    }

    // Reset the Current Folder
    if (folderPath !== this.currentFolder) {
      this.prevPath = this.currentFolder ? this.currentFolder : "";
      this.currentFolder = folderPath;
      // Removed forceUpdate() - Redux actions below will trigger re-renders
    }

    // Process the folder
    if (this.currentFolder !== this.prevPath) {
      console.log(`Setting Folder to: ${this.currentFolder}`);
      // here
      if (await this.hasLocal(this.currentFolder)) {
        // Importing State
        this.loadLocal(this.currentFolder);

        // Setting up imported State
        if (this.currentFolder !== "" && this.currentFolder !== this.prevPath) {
          this.isChokReady = false;
          await this.startWatcher(this.currentFolder, this.props, true);
        }
        this.readyPlayURL = "";
      } else {
        // Normal Build State
        this.props.onNewFolder(this.currentFolder);
        if (this.currentFolder !== "" && this.currentFolder !== this.prevPath) {
          this.isChokReady = false;
          await this.startWatcher(this.currentFolder, this.props);
        }
        this.readyPlayURL = "";
      }
    } else if (this.currentFolder === this.prevPath && !this.isChokReady) {
      // folder Reloading
      this.readyPlayURL = this.props.url;
      this.props.onReloadFolder(this.currentFolder);
      this.isChokReady = false;
      await this.startWatcher(this.currentFolder, this.props);
    } else {
      console.log("Fell through");
    }
    console.log("End of Load Folder");
  }

  // Adds All Oral Annotations not Yet in Milestones into Milestones
  async addNewMediaToMilestone() {
    for (const mediaFile of this.props.annotMedia) {
      if (
        mediaFile.isAnnotation &&
        !mediaFile.name.includes("oralAnnotation") &&
        !mediaFile.inMilestones &&
        !mediaFile.isMerged
      ) {
        // Define Fields for oralMilestone
        const parsedPath = safeParseSync(mediaFile.path);
        const splitPath = parsedPath.name.split("_");
        const tier = `${splitPath[3]}_audio`;

        // Create oralMilestone
        const oralMilestone: aTypes.Milestone = {
          annotationID: "",
          data: [
            {
              channel: splitPath[3],
              data: mediaFile.blobURL,
              linguisticType: tier,
              locale: "",
              mimeType: mediaFile.mimeType,
            },
          ],
          startTime: parseFloat(splitPath[0]),
          stopTime: parseFloat(splitPath[2]),
        };

        // Add Tier to Categories if not Already There
        if (this.props.categories.indexOf(tier) === -1)
          this.props.addCategory(tier);

        // Set mediaFile in Milestones and Add oralMilestone to OralAnnotations
        this.props.setAnnotMediaInMilestones(mediaFile.blobURL);

        const annotationPath = mediaFile.path.substring(
          0,
          mediaFile.path.indexOf("_Annotations"),
        );
        const fileURL = await electronAPI.pathToFileURL(annotationPath);

        this.props.addOralAnnotation(
          oralMilestone,
          getTimelineIndex(this.props.timeline, fileURL),
        );
      }
    }
  }

  // Resets Electron Cache
  // https://github.com/electron/electron/issues/4903#issuecomment-201835018
  deleteChromeCache = async () => {
    try {
      await electronAPI.clearCache();
    } catch (e) {
      console.log("Error clearing cache:", e);
    }
  };

  // Merges Annotation Sound Files (Careful/Translation)
  // carefulOrTranslation: True -> careful, False -> Translation
  loadAnnot = async (carefulOrTranslation: boolean) => {
    try {
      const ctString = carefulOrTranslation ? "Careful" : "Translation";

      // Sort FilteredAnnot Based on Start Time into InputFiles
      const inputFiles: any[] = this.props.annotMedia
        .filter((am: any) => am.name.includes("_" + ctString))
        .sort((a1: any, a2: any) => {
          return (
            parseFloat(a1.name.substring(0, a1.name.indexOf("_"))) -
            parseFloat(a2.name.substring(0, a2.name.indexOf("_")))
          );
        })
        .map((a: any) => a.path);

      if (inputFiles.length === 0) {
        return;
      }

      // Get directory separator and annotation directory
      const pathSep = await electronAPI.getPathSeparator();
      const annotDir = inputFiles[0].substring(
        0,
        inputFiles[0].lastIndexOf(pathSep) + 1,
      );

      const outputPath = annotDir + ctString + "_Merged.mp3";
      const cwd = await electronAPI.getCwd();

      this.sendSnackbar(
        "Merging " +
          (carefulOrTranslation ? "Careful Speech" : "Translation") +
          " files.",
      );

      // Use secure API to merge audio files
      const mergeResult = await electronAPI.mergeAudioFiles(
        inputFiles,
        outputPath,
        {
          bitrate: "128k",
          channels: 1,
          silencePath: cwd + "/public/silence.wav",
        },
      );

      console.log("Merging finished!");
      const timecodes = mergeResult.timecodes;

      // Get metadata for each input file to create milestones
      const inputTimes: any[] = [];
      for (const filePath of inputFiles) {
        const metadata = await electronAPI.getMediaMetadata(filePath);
        const parsedPath = safeParseSync(filePath);
        const name = parsedPath.base;

        inputTimes.push({
          file: filePath,
          name,
          duration: roundIt(metadata.streams[0].duration, 3),
          refStart: name.split("_")[0],
          refStop: name.split("_")[2],
        });
      }

      // Sort InputTimes Based on Start Time
      inputTimes.sort((a: any, b: any) => a.refStart - b.refStart);

      // Create and Add Oral Milestones to Timeline
      const TOGGLE_TIMES = true;
      const mergedFileURL = await electronAPI.pathToFileURL(outputPath);

      for (let i = 0, l = inputTimes.length; i < l; i++) {
        const oralMilestone: aTypes.Milestone = {
          annotationID: "",
          data: [
            {
              channel: `${ctString}Merged`,
              data: mergedFileURL,
              linguisticType: `${ctString}Merged`,
              locale: "",
              mimeType: "audio-mp3",
              clipStart: TOGGLE_TIMES
                ? i === 0
                  ? 0
                  : timecodes[2 * i - 1]
                : timecodes[2 * i],
              clipStop: timecodes[2 * i + 1],
            },
          ],
          startTime: parseFloat(inputTimes[i].refStart),
          stopTime: parseFloat(inputTimes[i].refStop),
        };

        // Add Milestone to Timeline
        const timelineURL = await electronAPI.pathToFileURL(
          annotDir.substring(0, annotDir.indexOf("_Annotations")),
        );
        this.props.addOralAnnotation(
          oralMilestone,
          getTimelineIndex(this.props.timeline, timelineURL),
        );
        this.props.setTimelineChanged(true);
      }

      this.sendSnackbar(
        (carefulOrTranslation ? "Careful Speech" : "Translation") +
          " annotations merged!",
      );
      this.props.setAnnotMediaWSAllowed(mergedFileURL);
      await this.setLocal(this.currentFolder);
    } catch (err) {
      console.error("Error in loadAnnot:", err);
      this.sendSnackbar(
        "File Access error: " + (err as any).message,
        undefined,
        "error",
      );
    }
  };

  // Convert audio file to MP3 with normalization
  convertToMP3 = async (path: string) => {
    try {
      const outputPath =
        path.substring(0, path.lastIndexOf(".")) + "_Normalized.mp3";

      this.sendSnackbar("Converting Source Audio.");

      // Use secure API for FFmpeg conversion
      const result = await electronAPI.convertAudioToMP3(path, outputPath, {
        bitrate: "128k",
        channels: 2,
        normalize: true,
      });

      console.log("MP3 Conversion finished!");
      this.sendSnackbar("Source Audio Converted.");

      const fileURL = await electronAPI.pathToFileURL(outputPath);
      this.props.setSourceMediaWSAllowed(fileURL);

      await this.setLocal(this.currentFolder);
    } catch (err) {
      console.log("An error occurred: " + (err as any).message);
      this.sendSnackbar("An error occurred: " + (err as any).message);
    }
  };

  callProcessEAF = (inputFile: string) => {
    this.processEAF(inputFile);
    console.log("#Scanning EAF", inputFile);
  };

  async processEAF(path: string) {
    try {
      // Parse EAF file using secure API
      const content = await electronAPI.parseEAF(path);

      // Miscellaneous Local Variables
      const fileData = content.ANNOTATION_DOCUMENT;
      const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
      const miles: any[] = [];

      // Define SyncMedia for tempTimeline
      const parsedPath = safeParseSync(path);
      const syncMedia: string[] = [];
      for (
        let h = 0, l = fileData.HEADER[0].MEDIA_DESCRIPTOR.length;
        h < l;
        h++
      ) {
        const mediaURL = await electronAPI.pathToFileURL(
          parsedPath.dir +
            "/" +
            fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL,
        );
        syncMedia.push(mediaURL);
      }

      // Instantiate tempTimeline
      const eafFileURL = await electronAPI.pathToFileURL(path);
      const tempTimeline = new Timelines({
        syncMedia: syncMedia,
        eafFile: eafFileURL,
      });

      // Inline Function Definition for findTime and findAnnotTime
      const findTime = (myRef: string) => {
        for (let i = 0, l = timeSlotPointer.length; i < l; i++)
          if (timeSlotPointer[i].$.TIME_SLOT_ID === myRef)
            return timeSlotPointer[i].$.TIME_VALUE;
        return -1;
      };
      const findAnnotTime = (myRef4: any, startStop: string) => {
        for (let i = 0, l = miles.length; i < l; i++)
          if (miles[i]["annotationID"] === myRef4) return miles[i][startStop];
        return -1;
      };

      // Process All of File's Annotations
      for (let j = 0, l = fileData.TIER.length; j < l; j++) {
        // Verify Current lingType is a Category and Add if Otherwise
        const lingType = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
        if (this.props.categories.indexOf(lingType) === -1)
          this.props.addCategory(lingType);

        // Process Annotations
        for (let k = 0, l2 = fileData.TIER[j].ANNOTATION.length; k < l2; k++) {
          // Process Alignable Annotations or Ref Annotations
          if ("ALIGNABLE_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
            // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
            const alAnnPointer =
              fileData.TIER[j].ANNOTATION[k].ALIGNABLE_ANNOTATION[0];
            const milestone = {
              annotationID: alAnnPointer.$.ANNOTATION_ID,
              data: [
                {
                  channel: fileData.TIER[j].$.TIER_ID,
                  linguisticType:
                    fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text",
                  data: alAnnPointer.ANNOTATION_VALUE[0],
                  locale: fileData.TIER[j].$.DEFAULT_LOCALE,
                  mimeType: "string",
                },
              ],
              startTime: findTime(alAnnPointer.$.TIME_SLOT_REF1) / 1000,
              startId: alAnnPointer.$.TIME_SLOT_REF1,
              stopTime: findTime(alAnnPointer.$.TIME_SLOT_REF2) / 1000,
              stopId: alAnnPointer.$.TIME_SLOT_REF2,
              timeline: parsedPath.base,
            };
            miles.push(milestone);
            tempTimeline.addMilestone(milestone);
          } else if ("REF_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
            const refAnnPointer =
              fileData.TIER[j].ANNOTATION[k].REF_ANNOTATION[0];
            // Only Process Annotation if it Has Actual Text
            if (refAnnPointer.ANNOTATION_VALUE[0] !== "") {
              // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
              const milestone2 = {
                annotationID: refAnnPointer.$.ANNOTATION_ID,
                data: [
                  {
                    channel: fileData.TIER[j].$.LINGUISTIC_TYPE_REF,
                    data: refAnnPointer.ANNOTATION_VALUE[0],
                    linguisticType: fileData.TIER[j].$.TIER_ID + "_text",
                    locale: fileData.TIER[j].$.DEFAULT_LOCALE,
                    mimeType: "string",
                  },
                ],
                startId: refAnnPointer.$.TIME_SLOT_REF1,
                startTime: findAnnotTime(
                  refAnnPointer.$.ANNOTATION_REF,
                  "startTime",
                ),
                stopId: refAnnPointer.$.TIME_SLOT_REF2,
                stopTime: findAnnotTime(
                  refAnnPointer.$.ANNOTATION_REF,
                  "stopTime",
                ),
                timeline: parsedPath.base,
              };
              tempTimeline.addMilestone(milestone2);
            }
          }
        }
      }

      // Push TempTimeline to Timeline
      this.props.pushTimeline(tempTimeline);
      console.log("EAF Processed");
    } catch (err) {
      console.error("Error processing EAF:", err);
    }
  }

  loadWeb = () => {
    console.log("Webbing");
    this.props.loadAnnot(testingAnnot);
    testingSourceMedia.forEach((media) => {
      this.props.sourceMediaAdded({ file: media });
    });
    testingAnnotMedia.forEach((media) => {
      this.props.annotMediaAdded({ file: media });
    });
    this.props.setTimelinesInstantiated(true);
    /* this.props.setAnnotMediaWSAllowed(
      "savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01_StandardAudio.wav_Annotations/Translation_Merged.mp3"
    );
    this.props.setAnnotMediaWSAllowed(
      "savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01_StandardAudio.wav_Annotations/Careful_Merged.mp3"
    ); */
    this.sendSnackbar("Video Loading");
    this.props.setURL(
      "http://localhost:3000/savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01.mp4",
      0,
    );
    /* this.props.setURL(
      "./savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01.mp4",
      0
    ); */
    /* this.props.setURL(
      "savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01.mp4",
      0
    ); */
    this.sendSnackbar("EAF Loaded");
  };

  exportSession = async (parentThis: any) => {
    // Setting up Folder
    const dir = "public/savedSession/";
    console.log("yo");

    try {
      const savedAnnot = JSON.stringify(parentThis.props.annot, null, 2);
      await electronAPI.writeFile(dir + "annot.json", savedAnnot);

      const savedSourceMedia = JSON.stringify(
        parentThis.props.sourceMedia,
        null,
        2,
      );
      await electronAPI.writeFile(dir + "sourceMedia.json", savedSourceMedia);
      //TODO: Filter out wavs, copy the others.

      const savedAnnotMedia = JSON.stringify(
        parentThis.props.annotMedia,
        null,
        2,
      );
      await electronAPI.writeFile(dir + "annotMedia.json", savedAnnotMedia);
      //TODO: Filter out wavs, copy the others.

      /* const savedTimeline = JSON.stringify(parentThis.props.timeline, null, 2);
      await electronAPI.writeFile(dir + "Timeline.json", savedTimeline); */
    } catch (err) {
      console.log("Error Found:", err);
    }
  };

  sendSnackbar = (inMessage: string, inKey?: string, vType?: string) => {
    if (vType === "error") {
      toast.error(inMessage);
    } else if (vType === "success") {
      toast.success(inMessage);
    } else {
      toast(inMessage);
    }
  };
  showPointer = (): string => {
    return this.props.url !== "" ? "" : "◎ ";
  };

  handleSelectDirectory = async () => {
    const selectedPath = await electronAPI.selectDirectory();
    if (selectedPath) {
      console.log("Selected directory:", selectedPath);
      this.loadLocalFolder(selectedPath);
    } else {
      console.log("Directory selection cancelled");
    }
  };

  render() {
    if (this.props.env === "electron") {
      return (
        <div className="folder-selection">
          <span className="pointer">{this.showPointer()}</span>
          <button onClick={this.handleSelectDirectory}>Select Folder</button>
          <button onClick={() => this.exportSession(this)}>Export</button>
        </div>
      );
    } else if (this.props.env === "web") {
      return (
        <div>
          <button className="mediaTest" onClick={() => this.loadWeb()}>
            Load Media
          </button>
        </div>
      );
    } else {
      return "";
    }
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotMedia: state.tree.annotMedia,
  annotations: state.annot.annotations,
  availableFiles: state.tree.availableFiles,
  categories: state.annot.categories,
  env: state.tree.env,
  folderName: state.tree.folderName,
  folderPath: state.tree.folderPath,
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annot.timeline,
  url: state.player.url,
  annot: state.annot,
  tree: state.tree,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      // updateActiveFolder: actions.updateActiveFolder,
      addCategory: actions.addCategory,
      addOralAnnotation: actions.addOralAnnotation,
      annotMediaAdded: actions.annotMediaAdded,
      annotMediaChanged: actions.annotMediaChanged,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      loadAnnot: actions.loadAnnot,
      loadTree: actions.loadTree,
      onNewFolder: actions.onNewFolder,
      onReloadFolder: actions.onReloadFolder,
      pushTimeline: actions.pushTimeline,
      setURL: actions.setURL,
      sourceMediaAdded: actions.sourceMediaAdded,
      sourceMediaChanged: actions.sourceMediaChanged,
      setAnnotMediaInMilestones: actions.setAnnotMediaInMilestones,
      setTimelinesInstantiated: actions.setTimelinesInstantiated,
      setTimelineChanged: actions.setTimelineChanged,
      setAnnotMediaWSAllowed: actions.setAnnotMediaWSAllowed,
      setSourceMediaWSAllowed: actions.setSourceMediaWSAllowed,
    },
    dispatch,
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(SelectFolderZone);
