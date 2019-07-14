import * as aTypes from "../store/annot/types";
import * as actions from "../store";
import * as tTypes from "../store/tree/types";

import React, { Component } from "react";
import { getTimelineIndex, roundIt, sourceMedia } from "./globalFunctions";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";

var watcherRef: any;

interface StateProps {
  annotMedia: aTypes.LooseObject[];
  annotations: object;
  availableFiles: aTypes.LooseObject[];
  categories: string[];
  env: string;
  folderName: string;
  folderPath: string;
  prevPath: string;
  sourceMedia: aTypes.LooseObject[];
  timeline: aTypes.LooseObject[];
  url: string;
  annot: aTypes.AnnotationState;
  tree: tTypes.TreeState;
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
  loadAnnot: typeof actions.loadAnnot;
  loadTree: typeof actions.loadTree;
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
  private parentThis = this;
  private usingStoredData = false;

  // Starts the Chokidar File Watcher
  startWatcher = (path: string, props: any, ignoreInitial: boolean = false) => {
    // Closes Existing Watcher
    if (watcherRef !== undefined) watcherRef.close();

    // Creates a Watcher to Watch Input Path
    const watcher = require("chokidar").watch(path, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: ignoreInitial
    });
    watcherRef = watcher;

    // Adds a Directory Detected by Chokidar
    const choKAddDir = (path: string) => {
      console.log(`Directory ${path} has been added`);
    };

    // Processes File (Convert Media or Process EAF) and Returns File Definition
    const chocFileDescribe = (path: string): aTypes.LooseObject => {
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
      if (mime.getType(path) !== null) tempMime = mime.getType(path);

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
                // TODO: update/replace Blob on conversion
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
        wsAllowed: false,
        waveform: ""
      };
    };

    // Adds a File Detected by Chokidar
    const chokFileAdd = (path: string) => {
      // Show Timeline Has Changed
      this.props.setTimelineChanged(true);

      // If Chokidar is Ready and New File is ".eaf" => Reload Current Folder
      // -> Add File to annotMedia, sourceMedia, or availableFiles According to its Type
      if (this.isChokReady && path.endsWith(".eaf") && !this.usingStoredData) {
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
      this.testDir(this, this.currentFolder.files[0].path);
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
      this.testDir(this, this.currentFolder.files[0].path);
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
      } else {
        props.setURL(sourceMedia(this.props.sourceMedia, false)[0].blobURL);
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
    let fs = require("fs");
    let path = require("path");
    const walkSync = (inDir: string, filelist = []) =>
      fs
        .readdirSync(inDir)
        .map((file: any) =>
          fs.statSync(path.join(inDir, file)).isDirectory()
            ? walkSync(path.join(inDir, file), filelist)
            : filelist.concat(
                path.join(inDir, file) +
                  [", "] +
                  fs.statSync(path.join(inDir, file)).mtime
              )[0]
        );
    return JSON.stringify(walkSync(dir));
  }
  private testDir(parentThis: any, dir: string, initial: boolean = true): any {
    // returns True if dir has changed (or no data stored), otherwise False
    const currentDir = this.dirSnapshot(dir);
    if (
      localStorage.getItem("Prestige." + dir) !== null &&
      localStorage.getItem("Prestige." + dir) === currentDir &&
      localStorage.getItem("Prestige.annot." + dir) !== null &&
      localStorage.getItem("Prestige.tree." + dir) !== null &&
      this.props.annot.timeline.length === 0
    ) {
      const inAnnot = localStorage.getItem("Prestige.annot." + dir) + "";
      parentThis.props.loadAnnot(JSON.parse(inAnnot));

      const inTree = localStorage.getItem("Prestige.tree." + dir) + "";
      parentThis.props.loadTree(JSON.parse(inTree));

      this.usingStoredData = true;

      // The Folder is unchanged. No need to scan.
      return false;
    } else {
      if (
        this.props.annot.timeline.length !== 0 &&
        this.props.tree.sourceMedia.length !== 0
      ) {
        localStorage.setItem("Prestige." + dir, currentDir);
        localStorage.setItem(
          "Prestige.tree." + dir,
          JSON.stringify(this.props.tree)
        );
        localStorage.setItem(
          "Prestige.annot." + dir,
          JSON.stringify(this.props.annot)
        );
        let time = Date.now() + 0;
        let timeString = time.toString();
        localStorage.setItem("Prestige.time", timeString);
        return true;
      }
      // The Folder is different. Save State and Dir and load folder
      return true;
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
      // here
      if (!this.testDir(this, this.currentFolder.files[0].path, false)) {
        // Setting up imported State
        const path = inputElement.files[0].path.toString();
        if (path !== "" && path !== this.props.prevPath) {
          this.startWatcher(path, this.props, true);
        }
        this.readyPlayURL = path;
      } else {
        this.props.onNewFolder(inputElement.files[0].path);
        const path = inputElement.files[0].path.toString();
        if (path !== "" && path !== this.props.prevPath) {
          this.startWatcher(path, this.props);
          this.props.changePrevPath(path);
        }
        /// /////////////////////////////////////////////////////////////////////////
      }
    } else if (
      inputElement.files[0].path === this.props.prevPath &&
      !this.isChokReady
    ) {
      // folder Reloading
      this.readyPlayURL = this.props.url;
      this.props.onReloadFolder(inputElement.files[0].path);
      this.startWatcher(inputElement.files[0].path.toString(), this.props);
    } else {
      console.log("fell through");
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
        const splitPath = require("path")
          .parse(mediaFile.path)
          .name.split("_");
        const tier = splitPath[3] + "_audio";

        // Create oralMilestone
        const oralMilestone: aTypes.Milestone = {
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
    // Const Requires and Variables for Later Use
    const ctString = carefulOrTranslation ? "Careful" : "Translation";
    const fileURL = require("file-url");
    const ffmpegStaticElectron = require("ffmpeg-static-electron");

    // Set Up Fluent FFMpeg and its Associated Paths
    let fluentFfmpeg = require("fluent-ffmpeg");
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
      // __dirname + "resources" + require("ffmpeg-static-electron").path;
      fluentFfmpeg.setFfprobePath(
        process.cwd() + "/resources" + ffmpegStaticElectron.path
      );
      // __dirname + "resources" + require("ffprobe-static-electron").path;
    }

    // Sort FilteredAnnot Based on Start Time into InputFiles
    let dir = "";
    let path = require("path");
    let inputFiles: any[] = this.props.annotMedia
      .filter((am: any) => am.name.includes("_" + ctString))
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
      if (idx) cf += "[out][b]concat=v=0:a=1[out];";
      idx++;
    });
    cf = cf.substring(0, cf.lastIndexOf(";"));

    // Creates and Add Oral Milestones to Timeline
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

        // Create Milestones if Last FFProbe Has Been Called
        primaryIdx++;
        if (primaryIdx === mergedAudio._inputs.length) {
          // Sort InputTimes Based on Start Time
          inputTimes.sort((a: any, b: any) => a.refStart - b.refStart);

          // Add All Oral Annotations of the Files
          let lastTime = 0;
          let oralMilestone: aTypes.Milestone;
          for (let i = 0, l = inputTimes.length; i < l; i++) {
            // Create Merged Audio Milestone
            oralMilestone = {
              annotationID: "",
              data: [
                {
                  channel: ctString + "Merged",
                  data: fileURL(dir + ctString + "_Merged.mp3"),
                  linguisticType: ctString + "Merged",
                  locale: "",
                  mimeType: "audio-mp3",
                  clipStart: roundIt(lastTime, 3),
                  clipStop: roundIt(lastTime + inputTimes[i].duration, 3)
                }
              ],
              startTime: parseFloat(inputTimes[i].refStart),
              stopTime: parseFloat(inputTimes[i].refStop)
            };

            // Add Milestone to Timeline
            this.props.addOralAnnotation(
              oralMilestone,
              getTimelineIndex(
                this.props.timeline,
                fileURL(dir.substring(0, dir.indexOf("_Annotations")))
              )
            );

            // Increment Last Time for Next Clip Start/Stop Times
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
          fileURL(dir + ctString + "_Merged.mp3")
        );
        this.updateLS();
      })
      .save(dir + ctString + "_Merged.mp3");
  };
  updateLS = async () => {
    let promise = new Promise((resolve, reject) => {
      setTimeout(() => resolve("done!"), 1000);
    });

    let result = await promise; // wait till the promise resolves (*)
    this.testDir(this, this.currentFolder.files[0].path);
    // alert(result); // "done!"
  };
  convertToMP3 = (path: string) => {
    // Set Up Fluent FFMpeg and its Associated Paths
    const ffmpegStaticElectron = require("ffmpeg-static-electron");
    let fluentFfmpeg = require("fluent-ffmpeg");

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
      // __dirname + "resources" + require("ffmpeg-static-electron").path;
      fluentFfmpeg.setFfprobePath(
        process.cwd() + "/resources" + ffmpegStaticElectron.path
      );
      // __dirname + "resources" + require("ffprobe-static-electron").path;
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
        this.updateLS();
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
  annotations: state.annot.annotations,
  availableFiles: state.tree.availableFiles,
  categories: state.annot.categories,
  env: state.tree.env,
  folderName: state.tree.folderName,
  folderPath: state.tree.folderPath,
  prevPath: state.tree.prevPath,
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annot.timeline,
  url: state.player.url,
  annot: state.annot,
  tree: state.tree
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
      loadAnnot: actions.loadAnnot,
      loadTree: actions.loadTree,
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
