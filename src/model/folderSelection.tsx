import React, { Component } from "react";
import { connect } from 'react-redux'
import {Folders, FileDesc} from '../store/tree/types'
//import { fileChange, updateActiveFolder } from '../store/tree/actions'
//const storage = require('electron-json-storage');
//const ipcRenderer = require('electron').ipcRenderer;
//const remote = require('electron').remote;
var oldPath = ""
interface FolderProps {
    env: string,
    loaded: boolean,
    folderPath: string,
    folderName: string,
    availableFiles: Array<File>,
    availableMedia: Array<File>,

    updateActiveFolder: (folder:Folders) => void;
    fileAdded: (inFile: FileDesc) => void;
    mediaAdded: (inFile: FileDesc) => void;
    fileChanged: (inFile: FileDesc) => void;
    mediaChanged: (inFile: FileDesc) => void;
    fileDeleted: (inFile: string) => void;
  }
  //onUpdatePath: () => void;

class SelectFolderZone extends Component<FolderProps> {
    constructor(props:any) {
        super(props);
        this.state = {
          open: false,
        };
        
      }
    
    componentDidMount() {

/*     storage.get('watch_folder', (error: Error, data: any) => {
        if (data)
        this.StartWatcher(data.path, this.props);
    }); */
    
    }
    
    StartWatcher = (path: string, props:any) => {
        var chokidar = require("chokidar");
        var watcher = chokidar.watch(path, {
          ignored: /[/\\]\./,
          persistent: true,
          ignoreInitial: false
        });
/*         function fileHasChanged() {
          props.fileChange();
        } */
        const parentThis = this

        function chocFileDescribe(path: string) {
          const fileUrl = require('file-url');
          const pathParse = require('path')
          const parsedPath = pathParse.parse(path)
          var mime = require('mime')
          //let folder = fs.readdirSync(parentThis.props.folderPath)
          //let fileStat = fs.statSync(path)
          //var fileDef = {}
          const blobURL = fileUrl(path)
          //let filename = ""
          var tempMime = ""
          if (mime.getType(path) != null) {tempMime = mime.getType(path)} else {tempMime = "file/" + parsedPath.ext}
          //Try converting MTS files:
          if (tempMime.startsWith("model") && tempMime.endsWith(".mts")) {
            try {
              var ffmpeg = require('ffmpeg');
              var process = new ffmpeg(blobURL);
              process.then(function (video: any) {
                // Callback mode
                video
                .setVideoSize('640x?', true, true, '#fff')
                    .setAudioCodec('libfaac')
                    .setAudioChannels(2)
                    .save(parsedPath.dir + '\\'+ parsedPath.name +'.avi', function (error: Error, file: File) {
                  if (!error)
                    console.log('New video file: ' + file);
                    //todo: update Blob
                });
              }, function (err: Error) {
                console.log('Error: ' + err);
              });
            } catch (e) {
              console.log(e.code);
              console.log(e.msg);
              tempMime = "video/MP2T"
            }
            
          }
          var isAnnotation = false
          if (parsedPath.dir.endsWith("_Annotations")) {
            isAnnotation = true
          }
          const fileDef = {
              name: parsedPath.base, 
              extension: parsedPath.ext, 
              path: path,
              blobURL: fileUrl(path),
              hasAnnotation: false,
              mimeType: tempMime,
              isAnnotation: isAnnotation
          }
          return fileDef
        }

        function chokFileadd(path:string) {
            //const fs = require('fs-extra')
            const fileDef = chocFileDescribe(path)
            let fileDesc: FileDesc = {file: fileDef}
            if (
                fileDef.mimeType.startsWith("video") ||
                fileDef.mimeType.startsWith("audio") 
                /*||
                fileDef['type'].startsWith("video") ||
                fileDef['type'].startsWith("audio")*/
              ) {
                parentThis.props.mediaAdded(fileDesc)
                //fileDef['blobURL'] =  URL.createObjectURL(fs.readFileSync(localFolder + '/' + file))
                //fileDef['blobURL'] =  URL.createObjectURL(fileDef)
              } 
              else 
              {
                parentThis.props.fileAdded(fileDesc)
              }
            console.log(`File ${path} has been added`)

            
          }
        function choKAddDir(path:string) {
            console.log(`Directory ${path} has been added`)
            }
        function chokChange(path:string) {
          const fileDef = chocFileDescribe(path)
          let fileDesc: FileDesc = {file: fileDef}
          if (
              fileDef.mimeType.startsWith("video") ||
              fileDef.mimeType.startsWith("audio") 
              /*||
              fileDef['type'].startsWith("video") ||
              fileDef['type'].startsWith("audio")*/
            ) {
              parentThis.props.mediaChanged(fileDesc)
              //fileDef['blobURL'] =  URL.createObjectURL(fs.readFileSync(localFolder + '/' + file))
              //fileDef['blobURL'] =  URL.createObjectURL(fileDef)
            } 
            else 
            {
              parentThis.props.fileChanged(fileDesc)
            }
            console.log(`File ${path} has been changed`)
        }
        function chokUnlink(path:string) {
          const pathParse = require('path')
          const parsedPath = pathParse.parse(path)
          parentThis.props.fileDeleted(parsedPath.base)
          console.log(`File ${path} has been removed`)
        }
        function chokUnlinkDir(path:string) {
            console.log(`Directory ${path} has been removed`)
        }
        function chokError(error: Error) {
            console.log(`Watcher error: ${error}`)
        }
            function chokReady() {
        console.log(`Initial scan complete. Ready for changes`)
        }
        
        // Declare the listeners of the watcher
        watcher
          .on('add', (path:string) => chokFileadd(path))
          .on('addDir', (path:string) => choKAddDir(path))
          .on('change', (path:string) => chokChange(path))
          .on('unlink', (path:string) => chokUnlink(path))
          .on('unlinkDir', (path:string) => chokUnlinkDir(path))
          .on('error', (error: Error) => chokError(error))
          .on('ready', () => chokReady())
    
      }


    
    private _addDirectory(node: any): any {
        if (node) {
          node.directory = true;
          node.webkitdirectory = true;
        }
      }

    loadLocalFolder(inputElement: any) {
        console.log('Setting Folder to: '+ inputElement.files[0].path)
        this.props.updateActiveFolder({folderName: inputElement.files[0].name, folderPath: inputElement.files[0].path})
        //toDo: Fire on Update
        //storage.get(inputElement.files[0].path, (error: Error, data: any) => {
        let path = inputElement.files[0].path.toString()
        if ((path !== "") && (path !== oldPath)) {
            this.StartWatcher(path, this.props);
            oldPath = path
        }
        }
    render() {
        if (this.props.env === "electron") {
            return (
               <div className="folder-selection">
                    <input id = 'selectFolder'
                        className = "custom-file-input"
                        ref={node => this._addDirectory(node)}
                        type = 'file'
                        placeholder = 'Select Folder' />
                    <button onClick = {() => this.loadLocalFolder(document.querySelector("[id=selectFolder]"))}> Load Folder </button>
                </div>
            )
        } else {
            return ""
        }   
    }

}
//const mapDispatchToProps = (dispatch: any) => { return { fileChange: () => fileChange(dispatch) } } 
export default connect()(SelectFolderZone)
//export default connect(null,mapDispatchToProps)(SelectFolderZone)