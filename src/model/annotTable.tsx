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
  setDispatch: typeof actions.setDispatch;
}

interface ComponentProps extends StateProps, DispatchProps {}

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

  // Loads Annotation Table Based on Timeline
  formatTimeline = (timeline: LooseObject) => {
    // Create Blank Timeline if Undefined
    if (timeline === undefined) {
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

    // Fill Annotation Table with Annotation Rows by Milestone
    let table: AnnotationRow[] = [];
    timeline["milestones"].forEach((milestone: LooseObject, idx: number) => {
      // Create Each Row
      let row: AnnotationRow = {
        id: idx + 1,
        startTime: milestone["startTime"],
        stopTime: milestone["stopTime"],
        audCareful: "",
        audTransl: "",
        txtTransc: "",
        txtTransl: ""
      };

      // Fill Row with Data
      for (let d = 0, l = milestone["data"].length; d < l; d++) {
        let curr = milestone["data"][d];
        if (curr["mimeType"].startsWith("audio")) {
          if (curr["channel"] === "CarefulMerged")
            row["audCareful"] =
              curr["data"] + "#t" + curr["clipStart"] + "," + curr["clipStop"];
          else if (curr["channel"] === "TranslationMerged")
            row["audTransl"] =
              curr["data"] + "#t" + curr["clipStart"] + "," + curr["clipStop"];
        } else if (curr["mimeType"].startsWith("string")) {
          if (curr["channel"] === "Transcription")
            row["txtTransc"] = curr["data"];
          else if (curr["channel"] === "Translation")
            row["txtTransl"] = curr["data"];
        }
      }

      // Push Row to Table
      table.push(row);
    });

    // Set AnnotationTable to Newly Created Table
    this.props.pushAnnotationTable(table);
  };

  render() {
    // Table Values
    const TableRow = ({ row, ...restProps }: any) => (
      <Table.Row {...restProps} />
    );

    // Text Cells
    // oneOrTwo: One => Transcription, One => Translation
    const FlowingCell = ({ oneTwo, value, style, row, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style
        }}
        onClick={() =>
          this.props.setDispatch({
            dispatchType: "Clip",
            wsNum: 0,
            clipStart: row.startTime,
            clipStop: row.stopTime
          })
        }
      >
        <span
          style={{
            color:
              value !== "" ? (oneTwo === 1 ? "darkgreen" : "black") : undefined
          }}
        >
          {value}
        </span>
      </Table.Cell>
    );

    // Play Button Cells
    // oneOrTwo: One => Careful, Two => Translation
    const HighlightedCell = ({ oneTwo, value, style, ...restProps }: any) => (
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
            if (parsedURL.length > 1) {
              let splitParsed = parsedURL[1].split(",");
              if (splitParsed.length === 1)
                this.props.setDispatch({
                  dispatchType: "Seek",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1))
                });
              else
                this.props.setDispatch({
                  dispatchType: "Clip",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1)),
                  clipStop: parseFloat(splitParsed[1])
                });
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

    // Cells Based on Column Data
    var Cell = (cellProps: any) => {
      const { column } = cellProps;
      if (column.name === "txtTransl")
        return <FlowingCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "txtTransc")
        return <FlowingCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "audCareful")
        return <HighlightedCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "audTransl")
        return <HighlightedCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      return <Table.Cell {...cellProps} />;
    };

    // Annotation Column Names, Titles, and Nums
    const annotCols = [
      {
        name: "startTime",
        title: "Start Time",
        oneTwo: -1
      },
      {
        name: "txtTransc",
        title: "Transcription",
        wordWrapEnabled: true,
        oneTwo: 1
      },
      {
        name: "audCareful",
        title: "Careful Speech",
        oneTwo: 1
      },
      {
        name: "txtTransl",
        title: "Translation",
        wordWrapEnabled: true,
        oneTwo: 2
      },
      {
        name: "audTransl",
        title: "Oral Translation",
        oneTwo: 2
      }
    ];

    // Column Names and Widths
    const defaultColumnWidths = [
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

    return (
      <Paper className="annotation-table">
        <Grid
          rows={this.props.annotationTable}
          columns={annotCols}
          rootComponent={Root}
        >
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
      setDispatch: actions.setDispatch
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnnotationTable);
