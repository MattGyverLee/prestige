import * as actions from "../../store";

import React, { Component } from "react";
import { getSourceMedia, getTimelineIndex } from "../globalFunctions";

import { LooseObject } from "../../store/annot/types";
import Paper from "@material-ui/core/Paper";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  sourceMedia: LooseObject[];
  timeline: any[];
}

interface DispatchProps {
  togglePlay: typeof actions.togglePlay;
  setURL: typeof actions.setURL;
}

interface FileListProps extends StateProps, DispatchProps {}

export class FileList extends Component<FileListProps> {
  loadNewFile(blobURL: string) {
    this.props.togglePlay(true);
    this.props.setURL(blobURL, getTimelineIndex(this.props.timeline, blobURL));
  }

  componentWillUnmount() {
    console.log("UnMounting FileList");
  }

  render() {
    return (
      <div>
        <Paper>
          <ul data-testid="fileList.UL" className="list-group list-group-flush">
            {" "}
            {getSourceMedia(this.props.sourceMedia, false).map((d) => (
              <li
                key={d.blobURL}
                className={"list-group-item flex-container"}
                onClick={() => this.loadNewFile(d.blobURL)}
              >
                <div>
                  {d.mimeType.startsWith("audio") ? "🔊 — " : "🎬 — "} {d.name}
                </div>
              </li>
            ))}{" "}
          </ul>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  sourceMedia: state.tree.sourceMedia,
  timeline: state.annot.timeline,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      togglePlay: actions.togglePlay,
      setURL: actions.setURL,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(FileList);
