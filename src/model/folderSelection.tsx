import React, { Component } from "react";
import { connect } from 'react-redux'

interface FolderProps {
    env: string,
    folder: string,
    loaded: boolean,
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
        console.log(inputElement)
        }
    render() {
        if (this.props.env === "electron") {
            return (
               <div className="App-footer">
                    <input id = 'selectFolder'
                        className = "custom-file-input"
                        ref={node => this._addDirectory(node)}
                        type = 'file'
                        placeholder = 'Select Folder' />
                    <button onClick = {() => this.loadLocalFolder(this.refs.selectFolder)}> Load Folder </button>
                </div>
            )
        } else {
            return ""
        }   
    }

}

export default connect()(SelectFolderZone)