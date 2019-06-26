import * as actions from "../store";
import * as types from "../store/annotations/types";

import React, { Component } from "react";
import { getTimelineIndex, sourceMedia } from "./globalFunctions";

import { FileDesc } from "../store/tree/types";
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
  loaded: boolean;
  prevPath: string;
  sourceMedia: types.LooseObject[];
  timeline: types.LooseObject[];
}

interface DispatchProps {
  // updateActiveFolder: typeof actions.updateActiveFolder;
  addAnnotation: typeof actions.addAnnotation;
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  annotMediaAdded: typeof actions.annotMediaAdded;
  annotMediaChanged: typeof actions.annotMediaChanged;
  changePrevPath: typeof actions.changePrevPath;
  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  onNewFolder: typeof actions.onNewFolder;
  pushAnnotation: typeof actions.pushAnnotation;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
  pushTimeline: typeof actions.pushTimeline;
  resetAnnotationAction: typeof actions.resetAnnotationAction;
  setURL: typeof actions.setURL;
  sourceMediaAdded: typeof actions.sourceMediaAdded;
  sourceMediaChanged: typeof actions.sourceMediaChanged;
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

  startWatcher = (path: string, props: any) => {
    if (watcherRef !== undefined) {
      watcherRef.close();
    }
    const watcher = require("chokidar").watch(path, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: false
    });
    watcherRef = watcher;
    const chocFileDescribe = (path: string) => {
      const fileUrl = require("file-url");
      const parsedPath = require("path").parse(path);
      const mime = require("mime");
      const blobURL = fileUrl(path);
      let tempMime = "";
      // eslint:disable-next-line
      if (mime.getType(path) !== null) {
        tempMime = mime.getType(path);
      } else {
        tempMime = "file/" + parsedPath.ext;
      }
      // Try converting MTS files:
      if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
        try {
          const ffmpeg = require("ffmpeg");

          // eslint-disable-next-line
          const process = new ffmpeg(blobURL);
          process.then(
            function(video: any) {
              // Callback mode
              video
                .setVideoSize("640x?", true, true, "#fff")
                .setAudioCodec("libfaac")
                .setAudioChannels(2)
                .save(
                  parsedPath.dir + "\\" + parsedPath.name + ".avi",
                  function(error: Error, file: File) {
                    if (!error) console.log("New video file: " + file);
                    // todo: update/replace Blob on conversion
                  }
                );
            },
            function(err: Error) {
              console.log("Error: " + err);
            }
          );
        } catch (e) {
          console.log(e.code);
          console.log(e.msg);
          tempMime = "video/MP2T";
        }
      }
      let isAnnotation = false;
      if (
        parsedPath.dir.endsWith("_Annotations") ||
        parsedPath.base.includes("oralAnnotations")
      ) {
        isAnnotation = true;
      }
      const fileDef: types.LooseObject = {
        annotationRef: "",
        blobURL: fileUrl(path),
        extension: parsedPath.ext,
        hasAnnotation: false,
        isAnnotation: isAnnotation,
        inMilestones: false,
        mimeType: tempMime,
        name: parsedPath.base,
        // eslint:disable-next-line
        path: path
      };

      if (tempMime.endsWith("eaf")) {
        console.log(parsedPath.base, tempMime);
        props.callProcessEAF(path);
      }
      return fileDef;
    };

    const chokFileadd = (path: string) => {
      // Todo: If Chokidar.notready, go on, otherwise add annotation.
      const fileDef = chocFileDescribe(path);
      const fileDesc: FileDesc = { file: fileDef };
      if (
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio")
      ) {
        if (fileDef["isAnnotation"]) {
          props.annotMediaAdded(fileDesc);
        } else {
          props.sourceMediaAdded(fileDesc);
        }
      } else {
        props.fileAdded(fileDesc);
      }
      console.log(`File ${path} has been added`);
    };
    const choKAddDir = (path: string) => {
      console.log(`Directory ${path} has been added`);
    };
    const chokChange = (path: string) => {
      const fileDef = chocFileDescribe(path);
      const fileDesc: FileDesc = { file: fileDef };
      if (
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio")
      ) {
        props.mediaChanged(fileDesc);
      } else {
        props.fileChanged(fileDesc);
      }
      console.log(`File ${path} has been changed`);
    };
    const chokUnlink = (path: string) => {
      const pathParse = require("path");
      const parsedPath = pathParse.parse(path);
      props.fileDeleted(parsedPath.base);
      console.log(`File ${path} has been removed`);
    };
    const chokUnlinkDir = (path: string) => {
      console.log(`Directory ${path} has been removed`);
    };
    const chokError = (error: Error) => {
      console.log(`Watcher error: ${error}`);
    };
    const chokReady = () => {
      this.addNewMediaToMilestone();
      if (this.props.sourceMedia.length !== 0) {
        props.setURL(sourceMedia(this.props.sourceMedia)[0].blobURL);
        console.log(`Initial scan complete. Ready for changes`);
      } else {
        console.log("Empty Directory");
      }
    };

    // Declare the listeners of the watcher
    watcher
      .on("add", (path: string) => chokFileadd(path))
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
    if (inputElement.files.length === 0) {
      console.log("Undefined Directory Selected");
    } else if (
      inputElement.files[0].path !== undefined &&
      inputElement.files[0].path !== this.props.prevPath
    ) {
      console.log("Setting Folder to: " + inputElement.files[0].path);
      this.props.onNewFolder(inputElement.files[0].path);
      const path = inputElement.files[0].path.toString();
      if (path !== "" && path !== this.props.prevPath) {
        this.startWatcher(path, this.props);
        this.props.changePrevPath(path);
      }
    }
  }
  addNewMediaToMilestone() {
    this.props.annotMedia.forEach(mediaFile => {
      if (
        mediaFile.isAnnotation &&
        !mediaFile.name.includes("oralAnnotation") &&
        !mediaFile.inMilestones
      ) {
        const pathParse = require("path");
        const parsedPath = pathParse.parse(mediaFile.path);
        const splitPath = parsedPath.name.split("_");
        const tempMatch = parsedPath.dir.match(
          /[^\\/\n\r]*(?=_Annotations)/
        )[0];
        const refFile = tempMatch;
        const refStart = parseFloat(splitPath[0]);
        const refStop = parseFloat(splitPath[2]);
        const refType = splitPath[3];
        const tier = refType + "_audio";
        if (this.props.categories.indexOf(tier) === -1) {
          this.props.addCategory(tier);
        }

        const fileDef: types.LooseObject = {};
        fileDef["isAnnotation"] = true;
        // todo: the following line is cheating redux
        mediaFile["inMilestones"] = true;
        fileDef["linguisticType"] = tier;
        fileDef["channel"] = refType;
        fileDef["mimeType"] = mediaFile.mimeType;
        fileDef["name"] = mediaFile.name;
        fileDef["blobURL"] = mediaFile.blobURL;
        const oralMilestone: types.Milestone = {
          annotationID: "",
          annotationRef: refFile,
          data: {
            channel: fileDef["channel"],
            data: fileDef["blobURL"],
            linguisticType: fileDef["linguisticType"],
            locale: fileDef["locale"],
            mimeType: fileDef["mimeType"]
          },
          startTime: refStart,
          stopTime: refStop
        };
        mediaFile.inMilestones = true;
        const fileURL = require("file-url");
        const blobURL = fileURL(
          mediaFile.path.substring(0, mediaFile.path.indexOf("_Annotations"))
        );
        this.props.addOralAnnotation(
          oralMilestone,
          getTimelineIndex(this.props.timeline, blobURL)
        );
      }
    });
    // Do here:
  }

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
  timeline: state.annotations.timeline
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      // updateActiveFolder: actions.updateActiveFolder,
      addAnnotation: actions.addAnnotation,
      addCategory: actions.addCategory,
      addOralAnnotation: actions.addOralAnnotation,
      annotMediaAdded: actions.annotMediaAdded,
      annotMediaChanged: actions.annotMediaChanged,
      changePrevPath: actions.changePrevPath,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      onNewFolder: actions.onNewFolder,
      pushAnnotation: actions.pushAnnotation,
      pushAnnotationTable: actions.pushAnnotationTable,
      pushTimeline: actions.pushTimeline,
      resetAnnotationAction: actions.resetAnnotationAction,
      setURL: actions.setURL,
      sourceMediaAdded: actions.sourceMediaAdded,
      sourceMediaChanged: actions.sourceMediaChanged
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFolderZone);
