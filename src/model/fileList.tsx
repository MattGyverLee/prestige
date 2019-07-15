import * as actions from "../store";

import React, { Component } from "react";

import { LooseObject } from "../store/annot/types";
import Paper from "@material-ui/core/Paper";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getSourceMedia } from "./globalFunctions";

interface StateProps {
  sourceMedia: LooseObject[];
}

interface DispatchProps {
  play: typeof actions.play;
  setURL: typeof actions.setURL;
}

interface FileListProps extends StateProps, DispatchProps {}

export class FileList extends Component<FileListProps> {
  loadNewFile(blobURL: string) {
    this.props.play();
    this.props.setURL(blobURL);
  }

  render() {
    return (
      <div>
        <Paper>
          <ul data-testid="fileList.UL" className="list-group list-group-flush">
            {" "}
            {getSourceMedia(this.props.sourceMedia, false).map(d => (
              <li
                key={d.blobURL}
                className="list-group-item flex-container"
                onClick={() => this.loadNewFile(d.blobURL)}
              >
                <div> {d.name} </div>
              </li>
            ))}{" "}
          </ul>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  sourceMedia: state.tree.sourceMedia
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      play: actions.play,
      setURL: actions.setURL
    },
    dispatch
  )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FileList);
