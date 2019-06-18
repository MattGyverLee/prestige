import * as actions from "../store";

import { FileDesc, Folders } from "../store/tree/types";
import React, { Component } from "react";

import { LooseObject } from "../store/annotations/types";
import { Milestone } from "../store/annotations/types";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

//import { Middleware } from "redux";

var oldPath = "";
interface IStateProps {
  annotations: object;
  availableFiles: Array<LooseObject>;
  availableMedia: Array<LooseObject>;
  categories: Array<string>;
  env: string;
  folderName: string;
  folderPath: string;
  loaded: boolean;
}

interface IDispatchProps {
  addCategory: typeof actions.addCategory;
  addOralAnnotation: typeof actions.addOralAnnotation;
  fileAdded: typeof actions.fileAdded;
  fileChanged: typeof actions.fileChanged;
  fileDeleted: typeof actions.fileDeleted;
  mediaAdded: typeof actions.mediaAdded;
  mediaChanged: typeof actions.mediaChanged;
  updateActiveFolder: typeof actions.updateActiveFolder;
  addAnnotation: typeof actions.addAnnotation;
  pushAnnotation: typeof actions.pushAnnotation;
  pushTimeline: typeof actions.pushTimeline;
}

interface FolderProps extends IStateProps, IDispatchProps {
  callProcessEAF: (inPath: string) => void;
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
      const blobURL = fileUrl(path);
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
      const fileDef: LooseObject = {
        annotationRef: "",
        blobURL: fileUrl(path),
        extension: parsedPath.ext,
        hasAnnotation: false,
        isAnnotation: isAnnotation,
        inMilestones: false,
        mimeType: tempMime,
        name: parsedPath.base,
        path: path
      };

      if (tempMime.endsWith("eaf")) {
        console.log(parsedPath.base, tempMime);
        props.callProcessEAF(path);
      }
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
    const chokReady = () => {
      //todo: copy files to timeline.
      this.addNewMediaToMilestones();
      console.log(`Initial scan complete. Ready for changes`);
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
  addNewMediaToMilestones = () => {
    this.props.availableMedia.forEach(mediaFile => {
      const parentThis = this;
      if (mediaFile.isAnnotation && !mediaFile.inMilestones) {
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
        if (parentThis.props.categories.indexOf(refType) == -1) {
          parentThis.props.addCategory(refType);
        }
        var fileDef: LooseObject = {};
        fileDef["isAnnotation"] = true;
        //todo: the following line is cheating redux
        mediaFile["inMilestones"] = true;
        fileDef["linguisticType"] = tier;
        fileDef["channel"] = refType;
        fileDef["minmeType"] = mediaFile.mimeType;
        fileDef["name"] = mediaFile.name;
        fileDef["blobURL"] = mediaFile.blobURL;
        var oralMilestone: LooseObject = {
          annotationID: "",
          annotationRef: refFile,
          data: fileDef,
          startTime: refStart,
          stopTime: refStop,
          timeline: parsedPath.base
        };
        mediaFile.inMilestones = true;
        parentThis.props.addOralAnnotation(oralMilestone);
      }
      //console.log(media.name);

      console.log("this.props.tree.availableMedia.length()");

      /*

        
        
        props.AddOralAnnotationToTimeline();
      }*/
    });
  };
  /* export function formatTimeline(path: string) {
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
 */
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
//todo: Define state: Istate from https://github.com/sillsdev/web-transcriber-admin/blob/develop/src/model/state.tsx
const mapStateToProps = (state: actions.AppState): IStateProps => ({
  annotations: state.annotations.annotations,
  availableFiles: state.tree.availableFiles,
  availableMedia: state.tree.availableMedia,
  categories: state.annotations.categories,
  env: state.tree.env,
  folderName: state.tree.folderName,
  folderPath: state.tree.folderPath,
  loaded: state.tree.loaded
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      addCategory: actions.addCategory,
      addOralAnnotation: actions.addOralAnnotation,
      fileAdded: actions.fileAdded,
      fileChanged: actions.fileChanged,
      fileDeleted: actions.fileDeleted,
      mediaAdded: actions.mediaAdded,
      mediaChanged: actions.mediaChanged,
      updateActiveFolder: actions.updateActiveFolder,
      addAnnotation: actions.addAnnotation,
      pushAnnotation: actions.pushAnnotation,
      pushTimeline: actions.pushTimeline
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectFolderZone);
//export default connect(null,mapDispatchToProps)(SelectFolderZone)
