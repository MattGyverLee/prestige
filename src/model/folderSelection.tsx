import * as actions from "../store";
import * as types from "../store/annotations/types";

import React, { Component } from "react";
import { getTimelineIndex, sourceMedia } from "./globalFunctions";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { isForXStatement } from "@babel/types";

var watcherRef: any;
interface StateProps {
  annotMedia: types.LooseObject[];
  annotations: object;
  availableFiles: types.LooseObject[];
  categories: string[];
  env: string;
  folderName: string;
  folderPath: string;
  loaded: boolean;
  prevPath: string;
  sourceMedia: types.LooseObject[];
  timeline: types.LooseObject[];
  url: string;
}

interface DispatchProps {
  // updateActiveFolder: typeof actions.updateActiveFolder;
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  annotMediaAdded: typeof actions.annotMediaAdded;
  annotMediaChanged: typeof actions.annotMediaChanged;
  changePrevPath: typeof actions.changePrevPath;
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
}

interface FolderProps extends StateProps, DispatchProps {
  callProcessEAF: (inPath: string) => void;
}
// onUpdatePath: () => void;

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
        (parsedPath.dir.endsWith("_Annotations") ||
          parsedPath.base.includes("oralAnnotations")) &&
        !isMerged;

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
        annotationRef: "",
        blobURL: blobURL,
        extension: parsedPath.ext,
        hasAnnotation: false,
        isAnnotation: isAnnotation,
        isMerged: isMerged,
        inMilestones: false,
        mimeType: tempMime,
        name: parsedPath.base,
        path: path
      };
    };

    //
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
          fileDef["isAnnotation"]
            ? props.annotMediaAdded({ file: fileDef })
            : props.sourceMediaAdded({ file: fileDef });
        } else {
          props.fileAdded({ file: fileDef });
        }
      }

      // Log the Added File
      console.log(`File ${path} has been added`);
    };

    //
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
          fileDef["isAnnotation"]
            ? props.annotMediaChanged({ file: fileDef })
            : props.sourceMediaChanged({ file: fileDef });
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

    const chokUnlinkDir = (path: string) => {
      console.log(`Directory ${path} has been removed`);
    };

    const chokError = (error: Error) => {
      console.log(`Watcher error: ${error}`);
    };

    // Plays the First URL
    const chokReady = () => {
      // Adds All Annotations to Milestones
      this.addNewMediaToMilestone();

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
        !mediaFile.inMilestones
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
          annotationRef: fileURL(tempMatch),
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

  // TODO: put this in FolderSelection with other local operations
  // carefulOrTranslation: True -> careful, False -> Translation
  loadAnnot = (carefulOrTranslation: boolean) => {
    const isDev = require("electron-is-dev");
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
    let fluentFfmpeg = require("fluent-ffmpeg");
    fluentFfmpeg.setFfmpegPath(ffmpegPath);
    fluentFfmpeg.setFfprobePath(ffprobePath);
    let ffprobe = require("ffprobe");
    let fs = require("fs-extra");
    let filteredAnnot: any[] = this.props.annotMedia.filter((am: any) =>
      am.name.includes(carefulOrTranslation ? "_Careful" : "_Translation")
    );
    let i = filteredAnnot.length;
    let j, k;
    let path = require("path");
    let previous = -1;
    let inputFiles: any[] = [];
    let inputTimes: any[] = [];
    let dir = "";
    let lastTime = 0;
    const currentDuration = (metadata: any): number => {
      return metadata.streams[0].duration;
    };
    const roundIt = (value: number, decimals: number): number => {
      return Number(
        Math.round(Number(value + "e" + decimals)) + "e-" + decimals
      );
    };
    for (k = 0; k < i; k++) {
      let idx = 0;
      let lowest = -1;
      // loops through Annotations to fin lext Chronological Annotation
      for (j = 0; j < i; j++) {
        let curr = filteredAnnot[j];

        if (
          (lowest === -1 ||
            lowest >
              parseFloat(curr.name.substring(0, curr.name.indexOf("_")))) &&
          parseFloat(curr.name.substring(0, curr.name.indexOf("_"))) >= previous
        ) {
          lowest = parseFloat(curr.name.substring(0, curr.name.indexOf("_")));
          idx = j;
        }
      }
      let curr = filteredAnnot[idx];
      dir = curr.path.substring(0, curr.path.lastIndexOf(path.sep) + 1);
      previous = parseFloat(curr.name.split("_")[2]);
      // Logs this Annotation in an array
      inputFiles.push(curr.path);
    }
    // Builds MergedAudio object with list of inputs.
    let mergedAudio = fluentFfmpeg();
    let cf = "";
    let idx = 0;
    inputFiles.forEach((v: string) => {
      mergedAudio = mergedAudio.addInput(v);
      let letter = idx ? "b" : "out";
      cf +=
        "[" +
        idx.toString() +
        "]loudnorm=I=-16:TP=-1.5:LRA=11[" +
        letter +
        "];";
      if (idx) {
        cf += "[out][b]concat=v=0:a=1[out];";
      }
      idx += 1;
    });
    cf = cf.substring(0, cf.lastIndexOf(";"));

    let primaryIdx = 0;
    if (inputFiles.length > 0) {
      mergedAudio._inputs.forEach((v: any, idx: number) => {
        mergedAudio.ffprobe(idx, (err: any, metadata: any) => {
          const name = v.source.substring(v.source.lastIndexOf(path.sep) + 1);
          // Keeps a table of contents
          inputTimes.push({
            file: v.source,
            name,
            duration: roundIt(currentDuration(metadata), 3),
            refStart: name.split("_")[0],
            refStop: name.split("_")[2]
          });

          /*
          this.props.setAnnotMediaInMilestones(mediaFile.blobURL);
          */

          // TODO: Async May Run Multiple Times in Else Statement Below
          primaryIdx += 1;

          if (err) {
            console.error("Oops");
          } else {
            if (primaryIdx === mergedAudio._inputs.length) {
              inputTimes = inputTimes.sort((a: any, b: any) => {
                return b.refStart - a.refStart;
              });
              let i;
              let lastTime = 0;
              let oralMilestone: types.Milestone;
              for (i = 0; i < inputTimes.length; i++) {
                oralMilestone = {
                  annotationID: "",
                  // TODO: Remove annotationRef
                  annotationRef: "",
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
                      clipStart: lastTime,
                      clipStop: lastTime + inputTimes[i].duration
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
          }
        });
      });
      // Writes concatenated audio to compressed MP3
      mergedAudio
        .format("mp3")
        .audioBitrate("128k")
        .audioChannels(1)
        .audioCodec("libmp3lame")
        .outputOptions(["-map [out]", "-y"])
        .complexFilter(cf)
        .on("start", function(command: any) {
          console.log("ffmpeg process started:", command);
        })
        .on("error", function(err: any) {
          console.log("An error occurred: " + err.message);
        })
        .on("end", function() {
          console.log("Merging finished!");
        })
        .save(
          "" +
            dir +
            (carefulOrTranslation ? "Careful" : "Translation") +
            "_Merged.mp3"
        );
    }
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
  loaded: state.tree.loaded,
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
      setTimelineChanged: actions.setTimelineChanged
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFolderZone);
