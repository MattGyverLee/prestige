import React, { Component } from "react";
import { connect } from 'react-redux'
import {Folders} from '../store/tree/types'
//import { updateActiveFolder } from "../store/tree/actions";

interface FolderProps {
    env: string,
    loaded: boolean,
    folderPath: string,
    folderName: string

    updateActiveFolder: (folder:Folders) => void;
  }
  //onUpdatePath: () => void;

class SelectFolderZone extends Component<FolderProps> {
    private _addDirectory(node: any): any {
        if (node) {
          node.directory = true;
          node.webkitdirectory = true;
        }
      }

    loadLocalFolder(inputElement: any) {
        console.log('Setting Folder to: '+ inputElement.files[0].path)
        this.props.updateActiveFolder({folderName: inputElement.files[0].name, folderPath: inputElement.files[0].path})
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

export default connect()(SelectFolderZone)