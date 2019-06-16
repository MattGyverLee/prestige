import { FileDesc, Folders } from "../store/tree/types";
import React, { Component } from "react";

import { Milestone } from "../store/annotations/types";
import Timelines from "./Timeline";
import { connect } from "react-redux";
import { string } from "prop-types";

var oldPath = "";
interface FolderProps {
  annotations: object;
  availableFiles: Array<File>;
  availableMedia: Array<File>;
  env: string;
  folderName: string;
  folderPath: string;
  loaded: boolean;

  fileAdded: (inFile: FileDesc) => void;
  fileChanged: (inFile: FileDesc) => void;
  fileDeleted: (inFile: string) => void;
  mediaAdded: (inFile: FileDesc) => void;
  mediaChanged: (inFile: FileDesc) => void;
  updateActiveFolder: (folder: Folders) => void;
  addAnnotation: (inMilestone: Milestone) => void;
}
//onUpdatePath: () => void;

class SelectFolderZone extends Component<FolderProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      open: false
    };
  }

  componentDidMount() {
    /*     storage.get('watch_folder', (error: Error, data: any) => {
        if (data)
        this.StartWatcher(data.path, this.props);
    }); */
  }

  processEAF(file: any, path: string, parentThis: any) {
    var parseString = require("xml2js").parseString;
    var content = "";
    parseString(file, function(err: Error, result: string) {
      content = result;
    });
    const fileData = content.ANNOTATION_DOCUMENT;
    //RealValues
    //var timeStamp =  []
    var alAnnot = [];
    var refAnnot = [];
    // Temp Values
    var timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
    //parentThis.timeline = this.state.timeline
    var whichTimeline = [];
    var f, g, h, i, j, k;

    for (h = 0; h < fileData.HEADER[0].MEDIA_DESCRIPTOR.length; h++) {
      var refMedia = fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL;
      for (g = 0; g < this.state.availableMedia.length; g++) {
        if (this.state.availableMedia[g].name == refMedia) {
          this.state.availableMedia[g]["hasAnnotation"] = true;
          this.state.availableMedia[g]["annotationRef"] = path;
        }
      }
    }
    //Instantiate Timeline if needed
    if (whichTimeline.length == 0) {
      whichTimeline = [refMedia];
    } else {
      whichTimeline.push(refMedia);
    }
    var annotationIndex = -1;
    if (parentThis.timeline["timeline"][0]["instantiated"] == false) {
      parentThis.timeline = new Timelines(whichTimeline);
      annotationIndex = 0;
    } else {
      annotationIndex = parentThis.timeline.getIndexOfMedia(whichTimeline);
      if (whichTimeline.length > 1) {
        parentThis.timeline.addFilenamesToIndex(whichTimeline);
      }
      if (annotationIndex < 0) {
        annotationIndex = parentThis.timeline.addNewTimeline(whichTimeline);
      }
    }

    for (j = 0; j < fileData.TIER.length; j++) {
      for (k = 0; k < fileData.TIER[j].ANNOTATION.length; k++) {
        if ("ALIGNABLE_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
          const alAnnPointer =
            fileData.TIER[j].ANNOTATION[k].ALIGNABLE_ANNOTATION[0];

          const findStartTime = (myRef: string) => {
            var startTime = -1;
            for (i = 0; i < timeSlotPointer.length; i++) {
              if (timeSlotPointer[i].$.TIME_SLOT_ID == myRef) {
                startTime = timeSlotPointer[i].$.TIME_VALUE;
              }
            }
            return startTime;
          };

          const findStopTime = (myRef2: string) => {
            var stopTime = -1;
            for (i = 0; i < timeSlotPointer.length; i++) {
              if (timeSlotPointer[i].$.TIME_SLOT_ID == myRef2) {
                stopTime = timeSlotPointer[i].$.TIME_VALUE;
                console.log(stopTime);
              }
            }
            return stopTime;
          };
          //need to count id's
          const thisStartTime = findStartTime(alAnnPointer.$.TIME_SLOT_REF1);
          const thisStopTime = findStopTime(alAnnPointer.$.TIME_SLOT_REF2);

          var milestone = {
            startTime: thisStartTime / 1000,
            stopTime: thisStopTime / 1000,
            annotationID: alAnnPointer.$.ANNOTATION_ID,
            data: {
              channel: fileData.TIER[j].$.TIER_ID,
              locale: fileData.TIER[j].$.DEFAULT_LOCALE,
              linguisticType: fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text",
              mimeType: "string",
              data: alAnnPointer.ANNOTATION_VALUE[0]
            }
          };
          const tier = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
          if (parentThis.category.indexOf(tier) == -1) {
            parentThis.category = [...parentThis.category, tier];
          }
          /*           alAnnot.push([
            fileData.TIER[j].$.TIER_ID,
            alAnnPointer.$.ANNOTATION_ID,
            thisStartTime,
            thisStopTime,
            alAnnPointer.ANNOTATION_VALUE[0]
          ]) */

          parentThis.timeline.addMilestone(annotationIndex, milestone);
        }
        if ("REF_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
          const refAnnPointer =
            fileData.TIER[j].ANNOTATION[k].REF_ANNOTATION[0];
          if (refAnnPointer.ANNOTATION_VALUE[0] != "") {
            var tier3 = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
            if (parentThis.category.indexOf(tier3) == -1) {
              parentThis.category = [...parentThis.category, tier3];
            }

            const findAnnotStart = (parentThis: any, myRef: string) => {
              var startTime = -1;
              var i;
              for (
                i = 0;
                i < parentThis.timeline["timeline"][0]["milestones"].length;
                i++
              ) {
                if (
                  parentThis.timeline["timeline"][0]["milestones"][i][
                    "annotationID"
                  ] == myRef
                ) {
                  startTime =
                    parentThis.timeline["timeline"][0]["milestones"][i][
                      "startTime"
                    ];
                  //TODO 0 is temporary
                  return startTime;
                }
              }
            };

            const findAnnotStop = (parentThis: any, myRef: string) => {
              var i;
              var stopTime = -1;
              for (
                i = 0;
                i < parentThis.timeline["timeline"][0]["milestones"].length;
                i++
              ) {
                if (
                  parentThis.timeline["timeline"][0]["milestones"][i][
                    "annotationID"
                  ] == myRef
                ) {
                  stopTime =
                    parentThis.timeline["timeline"][0]["milestones"][i][
                      "stopTime"
                    ];
                  //TODO 0 is temporary
                  //console.log(startTime)
                  return stopTime;
                }
              }
            };
            const annotStartTime = findAnnotStart(
              parentThis,
              refAnnPointer.$.ANNOTATION_REF
            );
            const annotStopTime = findAnnotStop(
              parentThis,
              refAnnPointer.$.ANNOTATION_REF
            );
            var milestone2 = {
              startTime: annotStartTime,
              stopTime: annotStopTime,
              data: {
                linguisticType: fileData.TIER[j].$.TIER_ID,
                locale: fileData.TIER[j].$.DEFAULT_LOCALE,
                channel: fileData.TIER[j].$.LINGUISTIC_TYPE_REF,
                mimeType: "string",
                data: refAnnPointer.ANNOTATION_VALUE[0]
              }
            };
            var tier2 = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
            if (parentThis.category.indexOf(tier2) == -1) {
              parentThis.category = [...parentThis.category, tier2];
            }
            refAnnot.push([
              fileData.TIER[j].$.TIER_ID,
              refAnnPointer.$.ANNOTATION_REF,
              refAnnPointer.ANNOTATION_VALUE[0]
            ]);
            parentThis.timeline.addMilestone(annotationIndex, milestone2);
          }
        }
      }
    }
    this.setState({
      rawAnnotations: [...this.state.rawAnnotations, [alAnnot, refAnnot, path]]
    });
    this.setState({ category: parentThis.category });
    //-----------------------------------------
    this.state.rawAnnotationLoaded = true;
    this.formatTimeline(path);
  }
  formatTimeline(path: string) {
    console.log("Starting");
    const focus = this.timeline["timeline"][0]["milestones"];
    //TODO 0 is Temporary
    var table = [];
    focus.forEach(milestone => {
      console.log(milestone.data);
      var row = {
        id: milestone["id"],
        startTime: milestone["startTime"],
        stopTime: milestone["stopTime"],
        audCareful: "",
        audTransl: "",
        txtTransc: "",
        txtTransl: ""
      };
      var c, d;
      for (c = 0; c < this.state.category.length; c++) {
        for (d = 0; d < milestone["data"].length; d++) {
          console.log(this.state.category[c]);
          console.log(milestone["data"][d]);

          if (
            milestone["data"][d]["mimeType"].startsWith("audio") &&
            this.state.category[c].endsWith("audio")
          ) {
            console.log("Audio");
            if (milestone["data"][d]["refType"] == "Careful") {
              row["audCareful"] = milestone["data"][d]["blobURL"];
            }
            if (milestone["data"][d]["refType"] == "Translation") {
              row["audTransl"] = milestone["data"][d]["blobURL"];
            }
          }
          if (
            milestone["data"][d]["mimeType"].startsWith("string") &&
            this.state.category[c].endsWith("text")
          ) {
            console.log("Text");
            if (milestone["data"][d]["channel"] == "Transcription") {
              row["txtTransc"] = milestone["data"][d]["data"];
            }
            if (milestone["data"][d]["channel"] == "Translation") {
              row["txtTransl"] = milestone["data"][d]["data"];
            }
          }
        }
      }
      table.push(row);
    });
    console.log(table);
    this.setState(
      {
        annotations: [
          ...this.state.annotations,
          {
            eaf: path,
            times: table
          }
        ]
      },
      function() {
        this.setState({ annotationLoaded: true });
        console.log("TimelineAnnotations Set");
      }
    );
  }

  StartWatcher = (path: string, props: any) => {
    var chokidar = require("chokidar");
    var watcher = chokidar.watch(path, {
      ignored: /[/\\]\./,
      persistent: true,
      ignoreInitial: false
    });
    /*         function fileHasChanged() {
          props.fileChange();
        } */
    const parentThis = this;

    function chocFileDescribe(path: string) {
      const fileUrl = require("file-url");
      const pathParse = require("path");
      const parsedPath = pathParse.parse(path);
      var mime = require("mime");
      //let folder = fs.readdirSync(parentThis.props.folderPath)
      //let fileStat = fs.statSync(path)
      //var fileDef = {}
      const blobURL = fileUrl(path);
      //let filename = ""
      var tempMime = "";
      if (mime.getType(path) != null) {
        tempMime = mime.getType(path);
      } else {
        tempMime = "file/" + parsedPath.ext;
      }
      //Try converting MTS files:
      if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
        try {
          var ffmpeg = require("ffmpeg");
          var process = new ffmpeg(blobURL);
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
                    //todo: update Blob
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
      var isAnnotation = false;
      if (parsedPath.dir.endsWith("_Annotations")) {
        isAnnotation = true;
      }
      const fileDef = {
        blobURL: fileUrl(path),
        extension: parsedPath.ext,
        hasAnnotation: false,
        isAnnotation: isAnnotation,
        mimeType: tempMime,
        name: parsedPath.base,
        path: path
      };
      return fileDef;
    }

    function chokFileadd(path: string) {
      //const fs = require('fs-extra')
      const fileDef = chocFileDescribe(path);
      let fileDesc: FileDesc = { file: fileDef };
      if (
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio")
        /*||
                fileDef['type'].startsWith("video") ||
                fileDef['type'].startsWith("audio")*/
      ) {
        parentThis.props.mediaAdded(fileDesc);
        //fileDef['blobURL'] =  URL.createObjectURL(fs.readFileSync(localFolder + '/' + file))
        //fileDef['blobURL'] =  URL.createObjectURL(fileDef)
      } else {
        parentThis.props.fileAdded(fileDesc);
      }
      console.log(`File ${path} has been added`);
    }
    function choKAddDir(path: string) {
      console.log(`Directory ${path} has been added`);
    }
    function chokChange(path: string) {
      const fileDef = chocFileDescribe(path);
      let fileDesc: FileDesc = { file: fileDef };
      if (
        fileDef.mimeType.startsWith("video") ||
        fileDef.mimeType.startsWith("audio")
        /*||
              fileDef['type'].startsWith("video") ||
              fileDef['type'].startsWith("audio")*/
      ) {
        parentThis.props.mediaChanged(fileDesc);
        //fileDef['blobURL'] =  URL.createObjectURL(fs.readFileSync(localFolder + '/' + file))
        //fileDef['blobURL'] =  URL.createObjectURL(fileDef)
      } else {
        parentThis.props.fileChanged(fileDesc);
      }
      console.log(`File ${path} has been changed`);
    }
    function chokUnlink(path: string) {
      const pathParse = require("path");
      const parsedPath = pathParse.parse(path);
      parentThis.props.fileDeleted(parsedPath.base);
      console.log(`File ${path} has been removed`);
    }
    function chokUnlinkDir(path: string) {
      console.log(`Directory ${path} has been removed`);
    }
    function chokError(error: Error) {
      console.log(`Watcher error: ${error}`);
    }
    function chokReady() {
      console.log(`Initial scan complete. Ready for changes`);
    }

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
    if (
      inputElement.files[0].path !== undefined &&
      inputElement.files[0].path !== oldPath
    ) {
      console.log("Setting Folder to: " + inputElement.files[0].path);
      this.props.updateActiveFolder({
        folderName: inputElement.files[0].name,
        folderPath: inputElement.files[0].path
      });
      //toDo: Make this Fire on Update
      let path = inputElement.files[0].path.toString();
      if (path !== "" && path !== oldPath) {
        this.StartWatcher(path, this.props);
        oldPath = path;
      }
    }
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
//const mapDispatchToProps = (dispatch: any) => { return { fileChange: () => fileChange(dispatch) } }
export default connect()(SelectFolderZone);
//export default connect(null,mapDispatchToProps)(SelectFolderZone)
