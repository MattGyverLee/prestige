import * as actions from "../store";

import { AnnotationRow, LooseObject } from "../store/annotations/types";
import {
  FilteringState,
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
  TableColumnResizing
} from "@devexpress/dx-react-grid";
import {
  Grid,
  Table,
  TableFilterRow,
  TableHeaderRow,
  VirtualTable
} from "@devexpress/dx-react-grid-material-ui";
import React, { Component } from "react";

import Paper from "@material-ui/core/Paper";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getTimelineIndex } from "./globalFunctions";

// import folderSelection from "./folderSelection";
// import formatTimeline from "./folderSelection";

const Root = (props: any) => (
  <Grid.Root {...props} style={{ height: "100%" }} />
);

interface StateProps {
  timelines: LooseObject[];
  currentTimeline: number;
  prevTimeline: number;
  categories: string[];
  annotationTable: AnnotationRow[];
  sourceMedia: LooseObject[];
  timelineChanged: boolean;
  timelinesInstantiated: boolean;
  url: string;
  duration: number;
  durations: number[];
}

interface DispatchProps {
  play: typeof actions.play;
  setURL: typeof actions.setURL;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
  updatePrevTimeline: typeof actions.updatePrevTimeline;
  waveSurferPlayClip: typeof actions.waveSurferPlayClip;
  waveSurferPosChange: typeof actions.waveSurferPosChange;
  setSeek: typeof actions.setSeek;
}

interface ComponentProps extends StateProps, DispatchProps {
  // These come from the local functions
  // refresh: () => void;
}

class AnnotationTable extends Component<ComponentProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      open: false
    };
  }

  componentDidUpdate() {
    const newIndex = getTimelineIndex(this.props.timelines, this.props.url);
    if (
      this.props.timelinesInstantiated &&
      (this.props.currentTimeline !== this.props.prevTimeline ||
        this.props.timelineChanged)
    ) {
      this.formatTimeline(this.props.timelines[newIndex]);
      this.props.updatePrevTimeline(newIndex);
    }
  }

  formatTimeline = (timeline: LooseObject) => {
    if (timeline === undefined) {
      // console.log("Undefined timeline.");
      this.props.pushAnnotationTable([
        {
          id: 0,
          startTime: 0,
          stopTime: 0,
          txtTransc: "Not Loaded",
          audCareful: "",
          audTransl: "",
          txtTransl: "Not Loaded"
        }
      ]);
      return;
    }
    // console.log("Starting");
    // eslint:disable-next-line
    let focus = timeline["milestones"];
    // eslint:disable-next-line
    let table: AnnotationRow[] = [];
    let index = 1;
    focus.forEach((milestone: LooseObject) => {
      // console.log(milestone.data);
      // eslint:disable-next-line
      let row: AnnotationRow = {
        id: index,
        startTime: milestone["startTime"],
        stopTime: milestone["stopTime"],
        audCareful: "",
        audTransl: "",
        txtTransc: "",
        txtTransl: ""
      };
      index++;
      let d;
      for (d = 0; d < milestone["data"].length; d++) {
        if (milestone["data"][d]["mimeType"].startsWith("audio")) {
          // console.log("Audio");
          if (milestone["data"][d]["channel"] === "CarefulMerged") {
            row["audCareful"] =
              milestone["data"][d]["data"] +
              "#t" +
              milestone["data"][d]["clipStart"] +
              "," +
              milestone["data"][d]["clipStop"];
          }
          if (milestone["data"][d]["channel"] === "TranslationMerged") {
            row["audTransl"] =
              milestone["data"][d]["data"] +
              "#t" +
              milestone["data"][d]["clipStart"] +
              "," +
              milestone["data"][d]["clipStop"];
          }
        }
        if (milestone["data"][d]["mimeType"].startsWith("string")) {
          // console.log("Text");
          if (milestone["data"][d]["channel"] === "Transcription") {
            row["txtTransc"] = milestone["data"][d]["data"];
          }
          if (milestone["data"][d]["channel"] === "Translation") {
            row["txtTransl"] = milestone["data"][d]["data"];
          }
        }
      }

      table.push(row);
    });
    this.props.pushAnnotationTable(table);
  };

  render() {
    // Table Values
    const TableRow = ({ row, ...restProps }: any) => (
      <Table.Row {...restProps} onClick={() => seekToSec(0, row.startTime)} />
    );
    const FlowingCellC = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style
        }}
      >
        <span
          style={{
            color: value !== "" ? "darkgreen" : undefined
            // "font-size": "1.5em"
          }}
        >
          {value}
        </span>
      </Table.Cell>
    );
    // Translation
    const FlowingCellL = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style
        }}
      >
        <span
          style={{
            color: value !== "" ? "black" : undefined
            // "font-style": "italic",
            // "font-size": "1.5em"
          }}
        >
          {value}
        </span>
      </Table.Cell>
    );
    /* const DisabledCellL = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          backgroundColor: value < 1000 ? "lightpink" : undefined,
          ...style
        }}
      >
        <span>{value}</span>
      </Table.Cell>
    ); */
    // eslint:disable-next-line

    // eslint:disable-next-line
    const HighlightedCellCareful = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          // backgroundColor: value < 1000 ? 'lightpink' : undefined,
          ...style
        }}
      >
        <button
          onClick={() => {
            const parsedURL = value.split("#");
            if (parsedURL.length > 1)
              if (parsedURL[1].split(",").length === 1) {
                seekToSec(
                  1,
                  parseFloat(parsedURL[1].split(",")[0].substring(1))
                );
              } else {
                this.props.waveSurferPlayClip(
                  1,
                  parseFloat(parsedURL[1].split(",")[0].substring(1)),
                  parseFloat(parsedURL[1].split(",")[1])
                );
              }
          }}
          style={{
            display: value < 1000 ? "none" : undefined
            // color: value !="" ? 'lightgreen' : undefined,
          }}
        >
          Play{" "}
        </button>
      </Table.Cell>
    );

    // eslint:disable-next-line
    const HighlightedCellTransl = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          // backgroundColor: value < 1000 ? 'lightpink' : undefined,
          ...style
        }}
      >
        <button
          onClick={() => {
            const parsedURL = value.split("#");
            if (parsedURL.length > 1)
              if (parsedURL[1].split(",").length === 1) {
                seekToSec(
                  2,
                  parseFloat(parsedURL[1].split(",")[0].substring(1))
                );
              } else {
                this.props.waveSurferPlayClip(
                  2,
                  parseFloat(parsedURL[1].split(",")[0].substring(1)),
                  parseFloat(parsedURL[1].split(",")[1])
                );
              }
          }}
          style={{
            display: value < 1000 ? "none" : undefined
            // color: value !="" ? 'lightgreen' : undefined,
          }}
        >
          Play{" "}
        </button>
      </Table.Cell>
    );
    // const currentAnnotationID = this.state.annotationShowing;
    // eslint:disable-next-line
    let annotDetails = this.props.annotationTable;

    // eslint:disable-next-line
    var Cell = (cellProps: any) => {
      const { column } = cellProps;
      if (column.name === "txtTransl") {
        // cellProps.waveSurfNum = 0;
        // eslint:disable-next-line
        return <FlowingCellL {...cellProps} />;
      }
      if (column.name === "txtTransc") {
        // cellProps.waveSurfNum = 0;
        // eslint:disable-next-line
        return <FlowingCellC {...cellProps} />;
      }
      if (column.name === "audCareful") {
        // cellProps.waveSurfNum = 1;
        return <HighlightedCellCareful {...cellProps} />;
      }
      if (column.name === "audTransl") {
        // cellProps["waveSurfNum"] = 2;
        // eslint:disable-next-line
        return <HighlightedCellTransl {...cellProps} />;
      }
      return <Table.Cell {...cellProps} />;
    };

    const annotCols = [
      {
        name: "startTime",
        title: "Start Time",
        waveSurferNum: -1
      },
      {
        name: "txtTransc",
        title: "Transcription",
        wordWrapEnabled: true,
        waveSurferNum: 0
      },
      {
        name: "audCareful",
        title: "Careful Speech",
        waveSurferNum: 1
      },
      {
        name: "txtTransl",
        title: "Translation",
        wordWrapEnabled: true,
        waveSurferNum: 0
      },
      {
        name: "audTransl",
        title: "Oral Translation",
        waveSurferNum: 2
      }
    ];

    const defaultColumnWidths = [
      // { columnName: 'id', width: 50 },
      {
        columnName: "startTime",
        width: 100
      },
      {
        columnName: "audCareful",
        width: 100
      },
      {
        columnName: "txtTransl",
        width: 200
      },
      {
        columnName: "txtTransc",
        width: 200
      },
      {
        columnName: "audTransl",
        width: 100
      }
    ];

    // End Table Values
    const seekToSec = (waveSurfNum: number, time: number) => {
      const length = this.props.duration;
      const newTime = time / length;
      this.props.setSeek(newTime, time, waveSurfNum);
      this.setState({ playing: true });
    };

    /*     const playClip = (
      waveSurfNum: number,
      startTime: number,
      stopTime?: number
    ) => {
      this.props.waveSurferPlayClip(waveSurfNum, startTime, stopTime);
    }; */

    return (
      <Paper className="annotation-table">
        <Grid rows={annotDetails} columns={annotCols} rootComponent={Root}>
          <FilteringState defaultFilters={[]} />
          <IntegratedFiltering />
          <SortingState
            defaultSorting={[{ columnName: "startTime", direction: "asc" }]}
          />
          <IntegratedSorting />
          <VirtualTable rowComponent={TableRow} cellComponent={Cell} />
          <TableColumnResizing
            defaultColumnWidths={defaultColumnWidths}
            minColumnWidth={50}
          />
          <TableHeaderRow />
          <TableFilterRow />
        </Grid>
      </Paper>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotationTable: state.annotations.annotationTable,
  categories: state.annotations.categories,
  currentTimeline: state.annotations.currentTimeline,
  duration: state.player.duration,
  durations: state.deeJay.durations,
  prevTimeline: state.annotations.prevTimeline,
  sourceMedia: state.tree.sourceMedia,
  timelineChanged: state.annotations.timelineChanged,
  timelines: state.annotations.timeline,
  timelinesInstantiated: state.annotations.timelinesInstantiated,
  url: state.player.url
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      play: actions.play,
      setURL: actions.setURL,
      pushAnnotationTable: actions.pushAnnotationTable,
      updatePrevTimeline: actions.updatePrevTimeline,
      waveSurferPlayClip: actions.waveSurferPlayClip,
      waveSurferPosChange: actions.waveSurferPosChange,
      setSeek: actions.setSeek
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnnotationTable);
