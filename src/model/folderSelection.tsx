import * as actions from "../store";
import * as types from "../store/annotations/types";

import React, { Component } from "react";
import { getTimelineIndex, sourceMedia } from "./globalFunctions";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";

var watcherRef: any;

interface StateProps {
  annotMedia: types.LooseObject[];
  annotations: object;
  availableFiles: types.LooseObject[];
  categories: string[];
  env: string;
  folderName: string;
  folderPath: string;
  prevPath: string;
  sourceMedia: types.LooseObject[];
  timeline: types.LooseObject[];
  url: string;
}

interface DispatchProps {
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  annotMediaAdded: typeof actions.annotMediaAdded;
  annotMediaChanged: typeof actions.annotMediaChanged;
  changePrevPath: typeof actions.changePrevPath;
  dispatchSnackbar: typeof actions.dispatchSnackbar;
  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  onNewFolder: typeof actions.onNewFolder;
  onReloadFolder: typeof actions.onReloadFolder;
  pushAnnotation: typeof actions.pushAnnotation;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
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

interface FolderProps extends StateProps, DispatchProps {
  callProcessEAF: (inPath: string) => void;
}

class SelectFolderZone extends Component<FolderProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      prevPath: "",
      open: false
    };
  }

  private isChokReady: boolean = false;
  private currentFolder: any;
  private readyPlayURL: string = "";

  // Starts the Chokidar File Watcher
  startWatcher = (path: string, props: any) => {
    // Closes Existing Watcher
    if (watcherRef !== undefined) {
      watcherRef.close();
    }

    // Creates a Watcher to Watch Input Path
    const watcher = require("chokidar").watch(path, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: false
    });
    watcherRef = watcher;

    // Adds a Directory Detected by Chokidar
    const choKAddDir = (path: string) => {
      console.log(`Directory ${path} has been added`);
    };

    // Processes File (Convert Media or Process EAF) and Returns File Definition
    const chocFileDescribe = (path: string): types.LooseObject => {
      // Define Fields for Returned FileDef
      const blobURL = require("file-url")(path);
      const parsedPath = require("path").parse(path);
      const isMerged = parsedPath.base.includes("_Merged");
      const isAnnotation =
        parsedPath.dir.endsWith("_Annotations") ||
        parsedPath.base.includes("oralAnnotations") ||
        isMerged;

      // Get Temporary Mime Type of File
      const mime = require("mime");
      let tempMime = "file/" + parsedPath.ext;
      if (mime.getType(path) !== null) {
        tempMime = mime.getType(path);
      }

      // If ".mts" File => Convert
      // -> If ".eaf" File => Process
      if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
        require("ffmpeg")(blobURL).then(
          // Converts Video
          function(video: any) {
            // Callback mode
            video
              .setVideoSize("640x?", true, true, "#fff")
              .setAudioCodec("libfaac")
              .setAudioChannels(2)
              .save(parsedPath.dir + "\\" + parsedPath.name + ".avi", function(
                error: Error,
                file: File
              ) {
                if (!error) console.log("New video file: " + file);
                // todo: update/replace Blob on conversion
              });
          },
          // Reports on Video Conversion Errors
          function(err: Error) {
            console.log("Video Conversion Error: " + err);
          }
        );
      } else if (tempMime.endsWith("eaf")) {
        console.log(parsedPath.base, tempMime);
        props.callProcessEAF(path);
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
        wsAllowed: false
      };
    };

    // Adds a File Detected by Chokidar
    const chokFileAdd = (path: string) => {
      // Show Timeline Has Changed
      this.props.setTimelineChanged(true);

      // If Chokidar is Ready and New File is ".eaf" => Reload Current Folder
      // -> Add File to annotMedia, sourceMedia, or availableFiles According to its Type
      if (this.isChokReady && path.endsWith(".eaf")) {
        // Uninstantiate Timelines and Reset Chok Readiness
        this.props.setTimelinesInstantiated(false);
        this.isChokReady = false;

        this.loadLocalFolder(this.currentFolder);
      } else {
        const fileDef = chocFileDescribe(path);
        const isAudVid =
          fileDef.mimeType.startsWith("video") ||
          fileDef.mimeType.startsWith("audio");
        if (isAudVid) {
          if (fileDef["isAnnotation"]) {
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

      // Log the Added File
      console.log(`File ${path} has been added`);
    };

    // Processes a File Change Detected by Chokidar
    const chokChange = (path: string) => {
      // Show Timeline Has Changed
      this.props.setTimelineChanged(true);

      // If Chokidar is Ready and New File is ".eaf" => Reload Current Folder
      // -> Add File to annotMedia, sourceMedia, or availableFiles According to its Type
      if (this.isChokReady && path.endsWith(".eaf")) {
        // Uninstantiate Timelines and Reset Chok Readiness
        this.props.setTimelinesInstantiated(false);
        this.isChokReady = false;

        this.loadLocalFolder(this.currentFolder);
      } else {
        const fileDef = chocFileDescribe(path);
        const isAudVid =
          fileDef.mimeType.startsWith("video") ||
          fileDef.mimeType.startsWith("audio");
        if (isAudVid) {
          if (fileDef["isAnnotation"]) {
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
      // Grabs and Sets First URL If it Exists
      if (this.readyPlayURL !== "") {
        props.setURL(this.readyPlayURL);
        this.readyPlayURL = "";
      } else if (this.props.sourceMedia.length !== 0) {
        this.loadAnnot(true);
        this.loadAnnot(false);
        props.setURL(sourceMedia(this.props.sourceMedia, false)[0].blobURL);
        console.log(`Initial scan complete. Ready for changes`);
      } else {
        console.log("Empty Directory");
      }

      // Notifies that Chok is Ready and the Timelines are Instantiated
      this.isChokReady = true;
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

  // Loads a Local Folder from its Path
  loadLocalFolder(inputElement: any) {
    // Reset the Current Folder
    this.currentFolder = inputElement;

    // If Undefined Selection => Log
    // -> If First Path Not Same as Previous => Start
    // -> If First Path Same as Previous and Chok => Start
    if (inputElement.files.length === 0) {
      console.log("Undefined Directory Selected");
    } else if (inputElement.files[0].path !== this.props.prevPath) {
      console.log("Setting Folder to: " + inputElement.files[0].path);

      this.props.onNewFolder(inputElement.files[0].path);
      const path = inputElement.files[0].path.toString();
      if (path !== "" && path !== this.props.prevPath) {
        this.startWatcher(path, this.props);
        this.props.changePrevPath(path);
      }
    } else if (
      inputElement.files[0].path === this.props.prevPath &&
      !this.isChokReady
    ) {
      this.readyPlayURL = this.props.url;
      this.props.onReloadFolder(inputElement.files[0].path);
      this.startWatcher(inputElement.files[0].path.toString(), this.props);
    }
  }

  // Adds All Oral Annotations not Yet in Milestones into Milestones
  addNewMediaToMilestone() {
    this.props.annotMedia.forEach(mediaFile => {
      if (
        mediaFile.isAnnotation &&
        !mediaFile.name.includes("oralAnnotation") &&
        !mediaFile.inMilestones &&
        !mediaFile.isMerged
      ) {
        // Define Fields for oralMilestone
        const parsedPath = require("path").parse(mediaFile.path);
        const splitPath = parsedPath.name.split("_");
        const tempMatch = parsedPath.dir.match(
          /[^\\/\n\r]*(?=_Annotations)/
        )[0];
        const fileURL = require("file-url");
        const tier = splitPath[3] + "_audio";
        if (this.props.categories.indexOf(tier) === -1) {
          this.props.addCategory(tier);
        }

        // Create oralMilestone
        const oralMilestone: types.Milestone = {
          annotationID: "",
          data: [
            {
              channel: splitPath[3],
              data: mediaFile.blobURL,
              linguisticType: tier,
              locale: "",
              mimeType: mediaFile.mimeType
            }
          ],
          startTime: parseFloat(splitPath[0]),
          stopTime: parseFloat(splitPath[2])
        };

        // Set mediaFile in Milestones and Add oralMilestone to OralAnnotations
        this.props.setAnnotMediaInMilestones(mediaFile.blobURL);
        const blobURL = fileURL(
          mediaFile.path.substring(0, mediaFile.path.indexOf("_Annotations"))
        );
        this.props.addOralAnnotation(
          oralMilestone,
          getTimelineIndex(this.props.timeline, blobURL)
        );
      }
    });
  }

  // Resets Electron Cache
  // https://github.com/electron/electron/issues/4903#issuecomment-201835018
  deleteChromeCache = () => {
    const fs = require("fs-extra");
    const path = require("path");
    const remote = require("electron").remote;
    const app = remote.app;
    var chromeCacheDir = path.join(app.getPath("userData"), "Cache");
    if (fs.existsSync(chromeCacheDir)) {
      var files = fs.readdirSync(chromeCacheDir);
      for (var i = 0; i < files.length; i++) {
        var filename = path.join(chromeCacheDir, files[i]);
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
    // Rounding Function to be Used Later
    const roundIt = (value: number, decimals: number): number => {
      return Number(
        Math.round(Number(value + "e" + decimals)) + "e-" + decimals
      );
    };

    // Set Up Fluent FFMpeg and its Associated Paths
    const isDev = require("electron-is-dev");
    let fluentFfmpeg = require("fluent-ffmpeg");
    let ffmpegPath = "";
    let ffprobePath = "";

    // Determines Location for Ffmpeg and Ffprobe from environment variables.
    if (isDev) {
      ffmpegPath = process.cwd() + "\\bin\\win\\x64\\ffmpeg.exe";
      ffprobePath = process.cwd() + "\\bin\\win\\x64\\ffprobe.exe";
    } else {
      // https://stackoverflow.com/questions/33152533/bundling-precompiled-binary-into-electron-app Tsuringa's answer
      // Do I want a relative (__dirname) or absolute (process.cwd()) path?
      ffmpegPath =
        process.cwd() + "/resources" + require("ffmpeg-static-electron").path;
      // __dirname + "resources" + require("ffmpeg-static-electron").path;
      ffprobePath =
        process.cwd() + "/resources" + require("ffprobe-static-electron").path;
      // __dirname + "resources" + require("ffprobe-static-electron").path;
    }

    // Sets Determiend Paths for Fluent FFMpeg
    fluentFfmpeg.setFfmpegPath(ffmpegPath);
    fluentFfmpeg.setFfprobePath(ffprobePath);

    // Sort FilteredAnnot Based on Start Time into InputFiles
    let dir = "";
    let path = require("path");
    let inputFiles: any[] = this.props.annotMedia
      .filter((am: any) =>
        am.name.includes(carefulOrTranslation ? "_Careful" : "_Translation")
      )
      .sort((a1: any, a2: any) => {
        return (
          parseFloat(a1.name.substring(0, a1.name.indexOf("_"))) -
          parseFloat(a2.name.substring(0, a2.name.indexOf("_")))
        );
      })
      .map((a: any) => a.path);
    dir = inputFiles[0].substring(0, inputFiles[0].lastIndexOf(path.sep) + 1);

    // Builds MergedAudio Object with Inputs and the Concatenation Command.
    let mergedAudio = fluentFfmpeg();
    let cf = "";
    let idx = 0;
    inputFiles.forEach((v: string) => {
      mergedAudio = mergedAudio.addInput(v);
      cf +=
        "[" +
        idx.toString() +
        "]loudnorm=I=-16:TP=-1.5:LRA=11[" +
        (idx ? "b" : "out") +
        "];";
      if (idx) {
        cf += "[out][b]concat=v=0:a=1[out];";
      }
      idx += 1;
    });
    cf = cf.substring(0, cf.lastIndexOf(";"));

    //
    let primaryIdx = 0;
    let inputTimes: any[] = [];
    mergedAudio._inputs.forEach((v: any, idx: number) => {
      mergedAudio.ffprobe(idx, (err: any, metadata: any) => {
        // TODO: Async May Run Multiple Times in Else Statement Below
        // Store a Table of Contents in InputTimes for the Milestones
        const name = v.source.substring(v.source.lastIndexOf(path.sep) + 1);
        inputTimes.push({
          file: v.source,
          name,
          duration: roundIt(metadata.streams[0].duration, 3),
          refStart: name.split("_")[0],
          refStop: name.split("_")[2]
        });

        primaryIdx += 1;
        if (primaryIdx === mergedAudio._inputs.length) {
          inputTimes = inputTimes.sort((a: any, b: any) => {
            return a.refStart - b.refStart;
          });
          let i;
          let lastTime = 0;
          let oralMilestone: types.Milestone;
          for (i = 0; i < inputTimes.length; i++) {
            oralMilestone = {
              annotationID: "",
              data: [
                {
                  channel: carefulOrTranslation
                    ? "CarefulMerged"
                    : "TranslationMerged",
                  data: require("file-url")(
                    dir +
                      (carefulOrTranslation ? "Careful" : "Translation") +
                      "_Merged.mp3"
                  ),
                  linguisticType: carefulOrTranslation
                    ? "CarefulMerged"
                    : "TranslationMerged",
                  locale: "",
                  mimeType: "audio-mp3",
                  clipStart: roundIt(lastTime, 3),
                  clipStop: roundIt(lastTime + inputTimes[i].duration, 3)
                }
              ],
              startTime: parseFloat(inputTimes[i].refStart),
              stopTime: parseFloat(inputTimes[i].refStop)
            };

            const blobURL = require("file-url")(
              dir.substring(0, dir.indexOf("_Annotations"))
            );
            this.props.addOralAnnotation(
              oralMilestone,
              getTimelineIndex(this.props.timeline, blobURL)
            );

            lastTime += inputTimes[i].duration;
          }
        }

        // ffProbe Error Handling
        if (err) {
          console.log("Error: " + err);
        }
      });
    });

    // Writes Concatenated Audio to Compressed MP3
    mergedAudio
      .format("mp3")
      .audioBitrate("128k")
      .audioChannels(1)
      .audioCodec("libmp3lame")
      .outputOptions(["-map [out]", "-y"])
      .complexFilter(cf)
      .on("start", (command: any) => {
        console.log("ffmpeg process started:", command);
        this.props.dispatchSnackbar(
          "Merging " +
            (carefulOrTranslation ? "Careful Speech" : "Translation") +
            " files."
        );
      })
      .on("error", function(err: any) {
        console.log("An error occurred: " + err.message);
      })
      .on("end", () => {
        console.log("Merging finished!");
        this.props.dispatchSnackbar(
          (carefulOrTranslation ? "Careful Speech" : "Translation") +
            " annotations merged!"
        );
        this.props.setAnnotMediaWSAllowed(
          require("file-url")(
            dir +
              (carefulOrTranslation ? "Careful" : "Translation") +
              "_Merged.mp3"
          )
        );
      })
      .save(
        dir + (carefulOrTranslation ? "Careful" : "Translation") + "_Merged.mp3"
      );
  };

  convertToMP3 = (path: string) => {
    // Set Up Fluent FFMpeg and its Associated Paths
    const isDev = require("electron-is-dev");
    let fluentFfmpeg = require("fluent-ffmpeg");
    let ffmpegPath = "";
    let ffprobePath = "";

    // Determines Location for Ffmpeg and Ffprobe from environment variables.
    if (isDev) {
      ffmpegPath = process.cwd() + "\\bin\\win\\x64\\ffmpeg.exe";
      ffprobePath = process.cwd() + "\\bin\\win\\x64\\ffprobe.exe";
    } else {
      // https://stackoverflow.com/questions/33152533/bundling-precompiled-binary-into-electron-app Tsuringa's answer
      // Do I want a relative (__dirname) or absolute (process.cwd()) path?
      ffmpegPath =
        process.cwd() + "/resources" + require("ffmpeg-static-electron").path;
      // __dirname + "resources" + require("ffmpeg-static-electron").path;
      ffprobePath =
        process.cwd() + "/resources" + require("ffprobe-static-electron").path;
      // __dirname + "resources" + require("ffprobe-static-electron").path;
    }

    // Sets Determiend Paths for Fluent FFMpeg
    fluentFfmpeg.setFfmpegPath(ffmpegPath);
    fluentFfmpeg.setFfprobePath(ffprobePath);

    let toMP3 = fluentFfmpeg().addInput(path);
    toMP3
      .format("mp3")
      .audioBitrate("128k")
      .audioChannels(2)
      .audioCodec("libmp3lame")
      .audioFilters("loudnorm=I=-16:TP=-1.5:LRA=11")
      .on("start", (command: any) => {
        console.log("ffmpeg process started:", command);
        this.props.dispatchSnackbar("Converting Source Audio.");
      })
      .on("error", (err: any) => {
        console.log("An error occurred: " + err.message);
        this.props.dispatchSnackbar("An error occurred: " + err.message);
      })
      .on("end", () => {
        console.log("MP3 Conversion finished!");
        this.props.dispatchSnackbar("Source Audio Converted.");
        this.props.setSourceMediaWSAllowed(
          require("file-url")(
            path.substring(0, path.lastIndexOf(".")) + "_Normalized.mp3"
          )
        );
      })
      .save(path.substring(0, path.lastIndexOf(".")) + "_Normalized.mp3");
  };

  render() {
    if (this.props.env === "electron") {
      return (
        <div className="folder-selection">
          <input
            id="selectFolder"
            className="custom-file-input"
            ref={node => this._addDirectory(node)}
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
  annotations: state.annotations.annotations,
  availableFiles: state.tree.availableFiles,
  categories: state.annotations.categories,
  env: state.tree.env,
  folderName: state.tree.folderName,
  folderPath: state.tree.folderPath,
  prevPath: state.tree.prevPath,
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annotations.timeline,
  url: state.player.url
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      // updateActiveFolder: actions.updateActiveFolder,
      addCategory: actions.addCategory,
      addOralAnnotation: actions.addOralAnnotation,
      annotMediaAdded: actions.annotMediaAdded,
      annotMediaChanged: actions.annotMediaChanged,
      changePrevPath: actions.changePrevPath,
      dispatchSnackbar: actions.dispatchSnackbar,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      onNewFolder: actions.onNewFolder,
      onReloadFolder: actions.onReloadFolder,
      pushAnnotation: actions.pushAnnotation,
      pushAnnotationTable: actions.pushAnnotationTable,
      pushTimeline: actions.pushTimeline,
      setURL: actions.setURL,
      sourceMediaAdded: actions.sourceMediaAdded,
      sourceMediaChanged: actions.sourceMediaChanged,
      setAnnotMediaInMilestones: actions.setAnnotMediaInMilestones,
      setTimelinesInstantiated: actions.setTimelinesInstantiated,
      setTimelineChanged: actions.setTimelineChanged,
      setAnnotMediaWSAllowed: actions.setAnnotMediaWSAllowed,
      setSourceMediaWSAllowed: actions.setSourceMediaWSAllowed
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFolderZone);
