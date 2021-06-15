/* eslint-disable @typescript-eslint/no-var-requires */
import * as aTypes from "../../store/annot/types";
import * as actions from "../../store";
import * as tTypes from "../../store/tree/types";

import Timelines from "./Timelines";
import React, { Component } from "react";
import { getSourceMedia, getTimelineIndex, roundIt } from "../globalFunctions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
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
  enqueueSnackbar: typeof actions.enqueueSnackbar;
  closeSnackbar: typeof actions.closeSnackbar;
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
  private currentFolder: any;
  private prevPath = "";
  private readyPlayURL = "";
  private usingStoredData = false;
  private watcherRef: any;

  componentDidMount(): void {
    // Cleaning Storage
    // FIXME: This is a hack to avoid a crash during presentation.
    for (const l in localStorage)
      if (l.startsWith("Prestige")) localStorage.removeItem(l);
  }

  componentWillUnmount() {
    if (this.watcherRef !== undefined) {
      this.watcherRef.close();
    }
    console.log("UnMounting Trees");
    // Todo: Also Unmount/Kill FFMpeg.
  }

  // Starts the Chokidar File Watcher
  startWatcher = (path: string, props: any, ignoreInitial = false) => {
    // Closes Existing Watcher
    if (this.watcherRef !== undefined) this.watcherRef.close();

    // Creates a Watcher to Watch Input Path
    const watcher = require("chokidar").watch(path, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: ignoreInitial,
    });
    this.watcherRef = watcher;

    // Adds a Directory Detected by Chokidar
    const choKAddDir = (path: string) => {
      console.log(`Directory ${path} has been added`);
    };

    // Processes File (Convert Media or Process EAF) and Returns File Definition
    const chokFileDescribe = (path: string): aTypes.LooseObject => {
      // Define Fields for Returned FileDef
      const fileURL = require("file-url");
      const parsedPath = require("path").parse(path);
      const isMerged = parsedPath.base.includes("_Merged");
      const isAnnotation =
        parsedPath.dir.endsWith("_Annotations") ||
        parsedPath.base.includes("oralAnnotations") ||
        isMerged;
      const blobURL = fileURL(path);

      // Get Temporary Mime Type of File
      const mime = require("mime");
      let tempMime = "file/" + parsedPath.ext;
      if (mime.getType(path) !== null) tempMime = mime.getType(path);

      // If ".mts" File => Convert
      // -> Else If ".eaf" File => Process
      if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
        require("ffmpeg")(blobURL).then(
          // Converts Video
          function (video: any) {
            // Callback mode
            video
              .setVideoSize("640x?", true, true, "#fff")
              .setAudioCodec("libfaac")
              .setAudioChannels(2)
              .save(
                parsedPath.dir + "\\" + parsedPath.name + ".avi",
                function (error: Error, file: File) {
                  if (!error) {
                    console.log("New video file: " + file);
                  } else {
                    console.log("Error: " + error);
                  }
                  return undefined;
                }
              );
          },
          // Reports on Video Conversion Errors
          function (err: Error) {
            console.log("Video Conversion Error: " + err);
          }
        );
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

    // Adds a File Detected by Chokidar
    const chokFileAdd = (path: string) => {
      // Show Timeline Has Changed
      this.props.setTimelineChanged(true);

      // If Chokidar is Ready and New File is ".eaf" => Reload Current Folder
      // -> Else => Add File to annotMedia, sourceMedia, or availableFiles According to its Type
      if (this.isChokReady && path.endsWith(".eaf") && !this.usingStoredData) {
        // Uninstantiate Timelines and Reset Chok Readiness
        this.props.setTimelinesInstantiated(false);
        this.isChokReady = false;

        this.loadLocalFolder(this.currentFolder);
      } else {
        const fileDef = chokFileDescribe(path);
        if (fileDef === undefined) return;
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
      this.setLocal(this.currentFolder);
      // Log the Added File
      console.log(`File ${path} has been added`);
    };

    // Processes a File Change Detected by Chokidar
    const chokChange = (path: string) => {
      // Show Timeline Has Changed
      this.props.setTimelineChanged(true);
      // If Chokidar is Ready and New File is ".eaf" => Reload Current Folder
      // -> Else => Add File to annotMedia, sourceMedia, or availableFiles According to its Type
      if (this.isChokReady && path.endsWith(".eaf")) {
        // Uninstantiate Timelines and Reset Chok Readiness
        this.props.setTimelinesInstantiated(false);
        this.isChokReady = false;

        this.loadLocalFolder(this.currentFolder);
      } else {
        const fileDef = chokFileDescribe(path);
        if (fileDef === undefined) return;
        const isAudVid =
          fileDef.mimeType.startsWith("video") ||
          fileDef.mimeType.startsWith("audio");
        if (isAudVid) {
          if (fileDef.isAnnotation) {
            this.props.annotMediaChanged({ file: fileDef });
          } else {
            this.props.sourceMediaChanged({ file: fileDef });
            if (fileDef.name.endsWith("_StandardAudio.wav")) {
              this.convertToMP3(fileDef.blobURL);
            }
          }
        } else {
          props.fileChanged({ file: fileDef });
        }
      }
      this.setLocal(this.currentFolder);
      // Log the Changed File
      console.log(`File ${path} has been changed`);
    };

    // Processes File Deletion
    const chokUnlink = (path: string) => {
      props.fileDeleted(require("file-url")(path));
      console.log(`File ${path} has been removed`);
    };

    // Processes Directory Deletion
    const chokUnlinkDir = (path: string) => {
      console.log(`Directory ${path} has been removed`);
    };

    // Processes Chokidar Errors
    const chokError = (error: Error) => {
      console.log(`Watcher error: ${error}`);
    };

    // Plays the First URL
    const chokReady = () => {
      if (!this.usingStoredData) {
        // Grabs and Sets First URL If it Exists
        if (this.readyPlayURL !== "") {
          props.setURL(
            this.readyPlayURL,
            getTimelineIndex(this.props.timeline, this.readyPlayURL)
          );
          this.readyPlayURL = "";
        } else if (this.props.sourceMedia.length !== 0) {
          this.loadAnnot(true);
          this.loadAnnot(false);
          const blobURL = getSourceMedia(this.props.sourceMedia, false)[0]
            .blobURL;
          props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL));
          console.log(`Initial scan complete. Ready for changes`);
        } else {
          console.log("Empty Directory");
        }
      } else if (this.props.url === "" && this.props.sourceMedia.length !== 0) {
        const blobURL = getSourceMedia(this.props.sourceMedia, false)[0]
          .blobURL;
        props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL));
      }
      // Notifies that Chok is Ready and the Timelines are Instantiated
      this.isChokReady = true;
      this.usingStoredData = false;
      this.props.setTimelinesInstantiated(true);
    };

    // Declare the listeners of the watcher
    watcher
      .on("add", (path: string) => chokFileAdd(path))
      .on("addDir", (path: string) => choKAddDir(path))
      .on("change", (path: string) => chokChange(path))
      .on("error", (error: Error) => chokError(error))
      .on("ready", () => chokReady())
      .on("unlink", (path: string) => chokUnlink(path))
      .on("unlinkDir", (path: string) => chokUnlinkDir(path));
  };

  private _addDirectory(node: any): any {
    if (node) {
      node.directory = true;
      node.webkitdirectory = true;
    }
  }

  private dirSnapshot(dir: string): any {
    // Returns Stringified DIR Object
    const fs = require("fs");
    const path = require("path");
    const walkSync = (inDir: string, filelist = []) =>
      fs.readdirSync(inDir).map((file: any) =>
        // Todo: Flatten this in process.
        fs.statSync(path.join(inDir, file)).isDirectory()
          ? walkSync(path.join(inDir, file), filelist)
          : filelist.concat(
              path.join(inDir, file) +
                [", "] +
                fs.statSync(path.join(inDir, file)).mtime
            )[0]
      );
    return JSON.stringify(walkSync(dir).flat(2));
  }

  hasLocal = (dir: string) => {
    const currentDir = this.dirSnapshot(dir);
    if (
      localStorage.getItem(`Prestige.${dir}`) !== undefined &&
      localStorage.getItem(`Prestige.${dir}`) !== null &&
      localStorage.getItem(`Prestige.${dir}`) !== currentDir
    ) {
      const oldDir = JSON.parse(localStorage.getItem(`Prestige.${dir}`) + "");
      const newDir = JSON.parse(currentDir + "");
      const _ = require("lodash");
      const diffs = _.difference(newDir, oldDir);
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

  setLocal = (dir: string) => {
    if (
      this.props.timeline.length > 0 &&
      this.props.tree.sourceMedia.length !== 0
    ) {
      localStorage.setItem(`Prestige.${dir}`, this.dirSnapshot(dir));
      localStorage.setItem(
        `Prestige.tree.${dir}`,
        JSON.stringify(this.props.tree)
      );
      localStorage.setItem(
        `Prestige.annot.${dir}`,
        JSON.stringify(this.props.annot)
      );
      const time = Date.now() + 0;
      const timeString = time.toString();
      localStorage.setItem("Prestige.time", timeString);
      return true;
    }
    return false;
  };

  // Loads a Local Folder from its Path
  loadLocalFolder(inputElement: any) {
    // Reset the Current Folder
    if (
      inputElement.files[0] !== undefined &&
      inputElement.files[0].path !== this.currentFolder
    ) {
      this.prevPath = this.currentFolder ? this.currentFolder : "";
      this.currentFolder = inputElement.files[0].path;
      this.forceUpdate();
    }
    // If Undefined Selection => Log
    // -> If First Path Not Same as Previous => Start
    // -> If First Path Same as Previous and Chok => Start
    if (inputElement.files.length === 0) {
      console.log("Undefined Directory Selected");
    } else if (this.currentFolder !== this.prevPath) {
      console.log(`Setting Folder to: ${this.currentFolder}`);
      // here
      if (this.hasLocal(this.currentFolder)) {
        // Importing State
        this.loadLocal(this.currentFolder);

        // Setting up imported State
        if (this.currentFolder !== "" && this.currentFolder !== this.prevPath) {
          this.isChokReady = false;
          this.startWatcher(this.currentFolder, this.props, true);
        }
        this.readyPlayURL = "";
      } else {
        // Normal Build State
        this.props.onNewFolder(this.currentFolder);
        if (this.currentFolder !== "" && this.currentFolder !== this.prevPath) {
          this.isChokReady = false;
          this.startWatcher(this.currentFolder, this.props);
        }
        this.readyPlayURL = "";
      }
    } else if (this.currentFolder === this.prevPath && !this.isChokReady) {
      // folder Reloading
      this.readyPlayURL = this.props.url;
      this.props.onReloadFolder(this.currentFolder);
      this.isChokReady = false;
      this.startWatcher(this.currentFolder, this.props);
    } else {
      console.log("Fell through");
    }
    console.log("End of Load Folder");
  }

  // Adds All Oral Annotations not Yet in Milestones into Milestones
  addNewMediaToMilestone() {
    this.props.annotMedia.forEach((mediaFile) => {
      if (
        mediaFile.isAnnotation &&
        !mediaFile.name.includes("oralAnnotation") &&
        !mediaFile.inMilestones &&
        !mediaFile.isMerged
      ) {
        // Define Fields for oralMilestone
        const splitPath = require("path").parse(mediaFile.path).name.split("_");
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
        this.props.addOralAnnotation(
          oralMilestone,
          getTimelineIndex(
            this.props.timeline,
            require("file-url")(
              mediaFile.path.substring(
                0,
                mediaFile.path.indexOf("_Annotations")
              )
            )
          )
        );
      }
    });
  }

  // Resets Electron Cache
  // https://github.com/electron/electron/issues/4903#issuecomment-201835018
  deleteChromeCache = () => {
    const fs = require("fs-extra");
    const path = require("path");
    const app = require("electron").remote.app;
    const chromeCacheDir = path.join(app.getPath("userData"), "Cache");
    if (fs.existsSync(chromeCacheDir)) {
      const files = fs.readdirSync(chromeCacheDir);
      for (let i = 0; i < files.length; i++) {
        const filename = path.join(chromeCacheDir, files[i]);
        if (fs.existsSync(filename)) {
          try {
            fs.unlinkSync(filename);
          } catch (e) {
            console.log(e);
          }
        }
      }
    }
  };

  // Merges Annotation Sound Files (Careful/Translation)
  // carefulOrTranslation: True -> careful, False -> Translation
  loadAnnot = (carefulOrTranslation: boolean) => {
    // Const Requires and Variables for Later Use
    const ctString = carefulOrTranslation ? "Careful" : "Translation";
    const ffmpegStaticElectron = require("ffmpeg-static-electron");
    const ffprobeStaticElectron = require("ffprobe-static-electron");

    // Set Up Fluent FFMpeg and its Associated Paths
    const fluentFfmpeg = require("fluent-ffmpeg");
    if (require("electron-is-dev")) {
      fluentFfmpeg.setFfmpegPath(`${process.cwd()}\\bin\\win\\x64\\ffmpeg.exe`);
      fluentFfmpeg.setFfprobePath(
        `${process.cwd()}\\bin\\win\\x64\\ffprobe.exe`
      );
    } else {
      fluentFfmpeg.setFfmpegPath(
        `${process.cwd()}/resources${ffmpegStaticElectron.path}`
      );
      fluentFfmpeg.setFfprobePath(
        `${process.cwd()}/resources${ffprobeStaticElectron.path}`
      );
    }

    // Sort FilteredAnnot Based on Start Time into InputFiles
    let annotDir = "";
    const path = require("path");
    const inputFiles: any[] = this.props.annotMedia
      .filter((am: any) => am.name.includes("_" + ctString))
      .sort((a1: any, a2: any) => {
        return (
          parseFloat(a1.name.substring(0, a1.name.indexOf("_"))) -
          parseFloat(a2.name.substring(0, a2.name.indexOf("_")))
        );
      })
      .map((a: any) => a.path);
    if (inputFiles.length > 0) {
      annotDir = inputFiles[0].substring(
        0,
        inputFiles[0].lastIndexOf(path.sep) + 1
      );

      // Builds MergedAudio Object with Inputs and the Concatenation Command.
      let mergedAudio = fluentFfmpeg();
      let cf = "";
      mergedAudio.options.stdoutLines = 0;
      mergedAudio.addInput(process.cwd() + "/public/silence.wav");
      inputFiles.forEach((v: string, idx: number) => {
        mergedAudio = mergedAudio.addInput(v);
        cf += `[${(
          idx + 1
        ).toString()}]loudnorm=I=-16:TP=-1.5:LRA=11[n];[n]silenceremove=start_periods=1:start_duration=0.1:start_threshold=-40dB[${
          idx ? "b" : "out"
        }];`;
        if (idx) cf += "[out][0][b]concat=v=0:n=3:a=1[out];";
        else cf += "[0][out]concat=v=0:a=1[out];";
        idx++;
      });
      cf = cf.substring(0, cf.lastIndexOf(";"));

      // Writes Concatenated Audio to Compressed MP3
      mergedAudio
        .format("mp3")
        .audioBitrate("128k")
        .audioChannels(1)
        .audioCodec("libmp3lame")
        .audioFrequency(44100)
        .outputOptions(["-map [out]", "-y", "-v verbose"])
        .complexFilter(cf)
        .on("start", (command: any) => {
          console.log("ffmpeg process started:", command);
          // Todo: Log IDs of FFMPEg Process so we can kill them FFMpeg on Unload.
          // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/138#issuecomment-53767068
          this.sendSnackbar(
            "Merging " +
              (carefulOrTranslation ? "Careful Speech" : "Translation") +
              " files."
          );
        })
        .on("error", (err: any) => {
          this.sendSnackbar(
            "File Access error: " + err.message,
            undefined,
            "error"
          );
        })
        .on("end", (err: any, stdout: any) => {
          const fileURL = require("file-url");
          const path = require("path");

          console.log("Merging finished!");
          const relevantlines: number[] = stdout
            .split("\n")
            .filter(
              (line: string) =>
                line.startsWith("[Parsed_concat") && line.includes("=")
            )
            .map((line: string) =>
              // Note: Conversion to MP3 always adds 0.05 second delay to start of audio and miniscule amount to end.
              // The below calculation accounts for it. The 0.1 seconds we are adding will help space them.
              roundIt(
                parseFloat(line.substring(line.indexOf("=") + 1)) / 1000000 +
                  0.05,
                3
              )
            );
          if (err) console.error(err);
          const timecodes: number[] = [];
          const len = relevantlines.length - 1;
          if (len >= 0) {
            for (let i = 0; i < len; i++) {
              if (relevantlines[i] !== relevantlines[i + 1]) {
                timecodes.push(relevantlines[i]);
              }
            }
            timecodes.push(relevantlines[len]);
          }

          // Creates and Add Oral Milestones to Timeline
          const TOGGLE_TIMES = true;
          let primaryIdx = 0;
          const inputTimes: any[] = [];
          mergedAudio._inputs.forEach((v: any, idx: number) => {
            if (!v.source.endsWith("silence.wav"))
              mergedAudio.ffprobe(idx, (err: any, metadata: any) => {
                // TODO: Async May Run Multiple Times in Else Statement Below

                // Store a Table of Contents in InputTimes for the Milestones
                const name = v.source.substring(
                  v.source.lastIndexOf(path.sep) + 1
                );
                inputTimes.push({
                  file: v.source,
                  name,
                  duration: roundIt(metadata.streams[0].duration, 3),
                  refStart: name.split("_")[0],
                  refStop: name.split("_")[2],
                });

                // Create Milestones if Last FFProbe Has Been Called
                primaryIdx++;
                if (primaryIdx === mergedAudio._inputs.length - 1) {
                  // Sort InputTimes Based on Start Time
                  inputTimes.sort((a: any, b: any) => a.refStart - b.refStart);

                  // Add All Oral Annotations of the Files
                  let oralMilestone: aTypes.Milestone;
                  for (let i = 0, l = inputTimes.length; i < l; i++) {
                    if (v.source.endsWith("silence.wav")) continue;
                    // Create Merged Audio Milestone
                    oralMilestone = {
                      annotationID: "",
                      data: [
                        {
                          channel: `${ctString}Merged`,
                          data: fileURL(`${annotDir}${ctString}_Merged.mp3`),
                          linguisticType: `${ctString}Merged`,
                          locale: "",
                          mimeType: "audio-mp3",
                          clipStart: TOGGLE_TIMES
                            ? i === 0
                              ? 0
                              : timecodes[2 * i - 1]
                            : timecodes[2 * i],
                          // Accounts for Excessive Time Padding
                          clipStop: timecodes[2 * i + 1],
                        },
                      ],
                      startTime: parseFloat(inputTimes[i].refStart),
                      stopTime: parseFloat(inputTimes[i].refStop),
                    };

                    // Add Milestone to Timeline
                    this.props.addOralAnnotation(
                      oralMilestone,
                      getTimelineIndex(
                        this.props.timeline,
                        fileURL(
                          annotDir.substring(
                            0,
                            annotDir.indexOf("_Annotations")
                          )
                        )
                      )
                    );
                    this.props.setTimelineChanged(true);
                  }
                }

                // ffProbe Error Handling
                if (err) {
                  console.log("Error: " + err);
                }
              });
          });

          this.sendSnackbar(
            (carefulOrTranslation ? "Careful Speech" : "Translation") +
              " annotations merged!"
          );
          this.props.setAnnotMediaWSAllowed(
            fileURL(annotDir + ctString + "_Merged.mp3")
          );
          this.setLocal(this.currentFolder);
        })
        .save(annotDir + ctString + "_Merged.mp3");
    }
  };

  // alert(result); // "done!"
  convertToMP3 = (path: string) => {
    // Set Up Fluent FFMpeg and its Associated Paths
    const ffmpegStaticElectron = require("ffmpeg-static-electron");
    const ffprobeStaticElectron = require("ffprobe-static-electron");
    const fluentFfmpeg = require("fluent-ffmpeg");

    // Determines Location for Ffmpeg and Ffprobe from environment variables.
    if (require("electron-is-dev")) {
      fluentFfmpeg.setFfmpegPath(process.cwd() + "\\bin\\win\\x64\\ffmpeg.exe");
      fluentFfmpeg.setFfprobePath(
        process.cwd() + "\\bin\\win\\x64\\ffprobe.exe"
      );
    } else {
      // https://stackoverflow.com/questions/33152533/bundling-precompiled-binary-into-electron-app Tsuringa's answer
      // Do I want a relative (__dirname) or absolute (process.cwd()) path?
      fluentFfmpeg.setFfmpegPath(
        process.cwd() + "/resources" + ffmpegStaticElectron.path
      );
      fluentFfmpeg.setFfprobePath(
        process.cwd() + "/resources" + ffprobeStaticElectron.path
      );
    }

    // Convert and Save File
    fluentFfmpeg()
      .addInput(path)
      .format("mp3")
      .audioBitrate("128k")
      .audioChannels(2)
      .audioCodec("libmp3lame")
      .audioFilters("loudnorm=I=-16:TP=-1.5:LRA=11")
      .outputOptions("-y")
      .on("start", (command: any) => {
        console.log("ffmpeg process started:", command);
        this.sendSnackbar("Converting Source Audio.");
      })
      .on("error", (err: any) => {
        console.log("An error occurred: " + err.message);
        this.sendSnackbar("An error occurred: " + err.message);
      })
      .on("end", () => {
        console.log("MP3 Conversion finished!");
        this.sendSnackbar("Source Audio Converted.");
        this.props.setSourceMediaWSAllowed(
          require("file-url")(
            path.substring(0, path.lastIndexOf(".")) + "_Normalized.mp3"
          )
        );
        this.setLocal(this.currentFolder);
      })
      .save(path.substring(0, path.lastIndexOf(".")) + "_Normalized.mp3");
  };

  callProcessEAF = (inputFile: string) => {
    this.processEAF(inputFile);
    console.log("#Scanning EAF", inputFile);
  };

  processEAF(path: string) {
    // Define Content
    let content: any = "";
    require("xml2js").parseString(
      require("fs-extra").readFileSync(path),
      function (err: Error, result: any) {
        if (!err) content = result;
        else console.log(err.stack);
      }
    );

    // Miscellaneous Local Variables
    const fileData = content.ANNOTATION_DOCUMENT;
    const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
    const miles: any[] = [];

    // Define SyncMedia for tempTimeline
    const parsedPath = require("path").parse(path);
    const fileURL = require("file-url");
    const syncMedia: string[] = [];
    for (let h = 0, l = fileData.HEADER[0].MEDIA_DESCRIPTOR.length; h < l; h++)
      syncMedia.push(
        fileURL(
          parsedPath.dir +
            "/" +
            fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL
        )
      );

    // Instantiate tempTimeline
    const tempTimeline = new Timelines({
      syncMedia: syncMedia,
      eafFile: fileURL(path),
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
                "startTime"
              ),
              stopId: refAnnPointer.$.TIME_SLOT_REF2,
              stopTime: findAnnotTime(
                refAnnPointer.$.ANNOTATION_REF,
                "stopTime"
              ),
              timeline: parsedPath.base,
            };
            tempTimeline.addMilestone(milestone2);
          }
        }
      }
    }

    // Push TempTimeline to Timeline
    // FIXME: ASYNC Unsafe
    this.props.pushTimeline(tempTimeline);
    console.log("EAF Processed");
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
      0
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

  exportSession = (parentThis: any) => {
    // Setting up Folder
    const fs = require("fs-extra");
    const dir = "public/savedSession/";
    console.log("yo");

    const savedAnnot = JSON.stringify(parentThis.props.annot, null, 2);
    fs.writeFile(dir + "annot.json", savedAnnot, (err: any) => {
      if (err) {
        console.log("Error Found:", err);
      }
    });

    const savedSourceMedia = JSON.stringify(
      parentThis.props.sourceMedia,
      null,
      2
    );
    fs.writeFile(dir + "sourceMedia.json", savedSourceMedia, (err: any) => {
      if (err) {
        console.log("Error Found:", err);
      }
      //TODO: Filter out wavs, copy the others.
    });

    const savedAnnotMedia = JSON.stringify(
      parentThis.props.annotMedia,
      null,
      2
    );
    fs.writeFile(dir + "annotMedia.json", savedAnnotMedia, (err: any) => {
      if (err) {
        console.log("Error Found:", err);
      }
      //TODO: Filter out wavs, copy the others.
    });

    /* const savedTimeline = JSON.stringify(parentThis.props.timeline, null, 2);
    fs.writeFile(dir + "Timeline.json", savedTimeline, (err: any) => {
      if (err) {
        console.log("Error Found:", err);
      }
    }); */
  };

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
  showPointer = (): string => {
    return this.props.url !== "" ? "" : "◎ ";
  };
  render() {
    if (this.props.env === "electron") {
      // https://jaketrent.com/post/select-directory-in-electron
      return (
        <div className="folder-selection">
          <span className="pointer">{this.showPointer()}</span>
          <input
            id="selectFolder"
            className="custom-file-input"
            ref={(node) => this._addDirectory(node)}
            type="file"
            placeholder="Select Folder"
          />
          <button
            onClick={() =>
              this.loadLocalFolder(document.querySelector("[id=selectFolder]"))
            }
          >
            {" "}
            Load Folder{" "}
          </button>{" "}
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
      closeSnackbar: actions.closeSnackbar,
      enqueueSnackbar: actions.enqueueSnackbar,
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
    dispatch
  ),
});
const withSnackbar = require("notistack").withSnackbar;
export default withSnackbar(
  connect(mapStateToProps, mapDispatchToProps)(SelectFolderZone)
);
