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
import ReactPlayer from "react-player";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

// import folderSelection from "./folderSelection";
// import formatTimeline from "./folderSelection";

interface StateProps {
  player: any;
  timelines: LooseObject[];
  currentTimeline: number;
  categories: string[];
  annotationTable: AnnotationRow[];
  sourceMedia: LooseObject[];
}

interface DispatchProps {
  play: typeof actions.play;
  setURL: typeof actions.setURL;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
}

interface ComponentProps extends StateProps, DispatchProps {
  // These come from the local functions
  // refresh: () => void;
}

class AnnotationTable extends Component<ComponentProps> {
  private prevTimeline = -1;

  constructor(props: any) {
    super(props);
    this.state = {
      open: false
    };
  }

  componentDidUpdate() {
    if (this.props.currentTimeline !== this.prevTimeline) {
      this.formatTimeline(this.props.timelines[this.props.currentTimeline]);
      this.prevTimeline = this.props.currentTimeline;
    }
  }

  formatTimeline = (timeline: LooseObject) => {
    if (timeline === undefined) {
      console.log("Undefined timeline.");
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
    // tslint:disable-next-line
    let focus = timeline["milestones"];
    // TODO 0 is Temporary
    // tslint:disable-next-line
    let table: AnnotationRow[] = [];
    let index = 1;
    focus.forEach((milestone: LooseObject) => {
      // console.log(milestone.data);
      // tslint:disable-next-line
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
          if (milestone["data"][d]["channel"] === "Careful") {
            row["audCareful"] = milestone["data"][d]["blobURL"];
          }
          if (milestone["data"][d]["channel"] === "Translation") {
            row["audTransl"] = milestone["data"][d]["blobURL"];
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
      <Table.Row
        {...restProps}
        onClick={() => seekToSec(this.props.player, row.startTime)}
      />
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
    // tslint:disable-next-line
    const HighlightedCell = ({ value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          // backgroundColor: value < 1000 ? 'lightpink' : undefined,
          ...style
        }}
      >
        <button
          onClick={() => this.props.setURL(value.toString())}
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
    // tslint:disable-next-line
    let annotDetails = this.props.annotationTable;

    // todo: map this
    // tslint:disable-next-line
    var Cell = (cellProps: any) => {
      const { column } = cellProps;
      if (column.name === "txtTransl") {
        // tslint:disable-next-line
        return <FlowingCellL {...cellProps} />;
      }
      if (column.name === "txtTransc") {
        // tslint:disable-next-line
        return <FlowingCellC {...cellProps} />;
      }
      if (column.name === "audCareful") {
        return <HighlightedCell {...cellProps} />;
      }
      if (column.name === "audTransl") {
        // tslint:disable-next-line
        return <HighlightedCell {...cellProps} />;
      }
      return <Table.Cell {...cellProps} />;
    };

    const annotCols = [
      {
        name: "startTime",
        title: "Start Time"
      },
      {
        name: "txtTransc",
        title: "Transcription",
        wordWrapEnabled: true
      },
      {
        name: "audCareful",
        title: "Careful Speech"
      },
      {
        name: "txtTransl",
        title: "Translation",
        wordWrapEnabled: true
      },
      {
        name: "audTransl",
        title: "Oral Translation"
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
    const seekToSec = (player: ReactPlayer, time: number) => {
      const length = this.props.player.getDuration();
      const newTime = time / length;
      player.seekTo(newTime);
      this.setState({ playing: true });
    };

    return (
      <Paper>
        <Grid rows={annotDetails} columns={annotCols}>
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
  // annotations: state.annotations.annotations,
  player: state.player.player,
  timelines: state.annotations.timeline, // ToDo: Un-Hardwire this
  categories: state.annotations.categories,
  annotationTable: state.annotations.annotationTable,
  sourceMedia: state.tree.sourceMedia,
  currentTimeline: state.annotations.currentTimeline
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      // annotations: state.annotations.annotations,
      play: actions.play,
      setURL: actions.setURL,
      pushAnnotationTable: actions.pushAnnotationTable
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnnotationTable);
