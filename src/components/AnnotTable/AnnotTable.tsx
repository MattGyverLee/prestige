import * as actions from "../../store";

import { AnnotationRow, LooseObject } from "../../store/annot/types";
import {
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
  TableColumnResizing,
  SearchState,
} from "@devexpress/dx-react-grid";
import {
  Grid,
  Table,
  TableHeaderRow,
  VirtualTable,
  Toolbar,
  SearchPanel,
} from "@devexpress/dx-react-grid-material-ui";
import React, { Component } from "react";

import Paper from "@material-ui/core/Paper";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getTimelineIndex } from "../globalFunctions";

const Root = (props: any) => (
  <Grid.Root
    {...props}
    style={{ minHeight: "50vh", height: "70vh", flexGrow: 1 }}
  />
  // 100
);

interface StateProps {
  timelines: LooseObject[];
  currentTimeline: number;
  prevTimeline: number;
  categories: string[];
  dimensions: LooseObject;
  annotationTable: AnnotationRow[];
  sourceMedia: LooseObject[];
  timelineChanged: boolean;
  timelinesInstantiated: boolean;
  url: string;
  duration: number;
}

interface DispatchProps {
  togglePlay: typeof actions.togglePlay;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
  updatePrevTimeline: typeof actions.updatePrevTimeline;
  setDispatch: typeof actions.setDispatch;
  setTimelineChanged: typeof actions.setTimelineChanged;
}

interface ComponentProps extends StateProps, DispatchProps {}

export class AnnotationTable extends Component<ComponentProps> {
  private redrawCount = 0;
  private defaultColumnWidths = [
    {
      columnName: "startTime",
      width: 90,
    },
    {
      columnName: "audCareful",
      width: 55,
    },
    {
      columnName: "txtTransl",
      width: 200,
    },
    {
      columnName: "txtTransc",
      width: 200,
    },
    {
      columnName: "audTransl",
      width: 55,
    },
  ];

  componentWillUnmount(): void {
    console.log("UnMounting Annot");
  }

  componentDidUpdate(): void {
    const newIndex = getTimelineIndex(this.props.timelines, this.props.url);
    if (
      this.props.timelinesInstantiated &&
      (this.props.currentTimeline !== this.props.prevTimeline ||
        this.props.timelineChanged)
    ) {
      this.formatTimeline(this.props.timelines[newIndex]);
      this.props.updatePrevTimeline(newIndex);
      this.setColumnWidths();
    }
  }

  // Loads Annotation Table Based on Timeline
  formatTimeline = (timeline: LooseObject): void => {
    // Fill Annotation Table with Annotation Rows by Milestone
    const table: AnnotationRow[] = [];
    if (timeline === undefined || timeline === null) {
      const row: AnnotationRow = {
        id: 1,
        startTime: 0,
        stopTime: 0,
        audCareful: "",
        audTransl: "",
        txtTransc: "Not Loaded",
        txtTransl: "",
      };
      table.push(row);
    } else {
      timeline.milestones.forEach((milestone: LooseObject, idx: number) => {
        // Create Each Row
        const row: AnnotationRow = {
          id: idx + 1,
          startTime: milestone.startTime,
          stopTime: milestone.stopTime,
          audCareful: "",
          audTransl: "",
          txtTransc: "",
          txtTransl: "",
        };

        // Fill Row with Data
        for (let d = 0, l = milestone.data.length; d < l; d++) {
          const curr = milestone.data[d];
          if (curr.mimeType.startsWith("audio")) {
            if (curr.channel === "CarefulMerged")
              row.audCareful =
                curr.data + "#t" + curr.clipStart + "," + curr.clipStop;
            else if (curr.channel === "TranslationMerged")
              row.audTransl =
                curr.data + "#t" + curr.clipStart + "," + curr.clipStop;
          } else if (curr.mimeType.startsWith("string")) {
            if (curr.channel === "Transcription") row.txtTransc = curr.data;
            else if (curr.channel === "Translation") row.txtTransl = curr.data;
          }
        }

        // Push Row to Table
        table.push(row);
      });
    }
    // Set AnnotationTable to Newly Created Table
    if (this.props.annotationTable !== table) {
      this.props.pushAnnotationTable(table);
      this.props.setTimelineChanged(false);
    } else {
      console.log("Error: Timeline not different.");
      this.props.setTimelineChanged(false);
    }
  };
  setColumnWidths = (
    columnWidths: LooseObject[] = this.defaultColumnWidths
  ) => {
    // this.props.getSize();
    const lastCol =
      this.props.dimensions.AppDetails.width -
      columnWidths[0].width -
      columnWidths[1].width -
      columnWidths[3].width -
      columnWidths[4].width -
      5;
    columnWidths[2].width = lastCol;
    this.setState({ columnWidths });
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
          ...style,
        }}
        onClick={
          this.props.currentTimeline === -1
            ? () => console.log("Empty Timeline Click")
            : () =>
                this.props.setDispatch({
                  dispatchType: "Clip",
                  wsNum: 0,
                  clipStart: row.startTime,
                  clipStop: row.stopTime,
                })
        }
      >
        <span
          style={{
            color:
              value !== "" ? (oneTwo === 1 ? "darkgreen" : "black") : undefined,
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
          ...style,
        }}
      >
        <button
          onClick={() => {
            const parsedURL = value.split("#");
            if (parsedURL.length > 1) {
              const splitParsed = parsedURL[1].split(",");
              if (splitParsed.length === 1)
                this.props.setDispatch({
                  dispatchType: "Seek",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1)),
                });
              else
                this.props.setDispatch({
                  dispatchType: "Clip",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1)),
                  clipStop: parseFloat(splitParsed[1]),
                });
            }
          }}
          style={{
            display: value < 1000 ? "none" : undefined,
            // color: value !="" ? 'lightgreen' : undefined,
          }}
        >
          Play{" "}
        </button>
      </Table.Cell>
    );
    const emptyHeaderCell = (cellProps: any) => {
      // const { column } = cellProps;
      return <TableHeaderRow.Cell {...cellProps}>&nbsp;</TableHeaderRow.Cell>;
    };
    // Cells Based on Column Data
    const dataCell = (cellProps: any) => {
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
        title: "Start",
        oneTwo: -1,
      },
      {
        name: "audCareful",
        title: "Careful Clip",
        oneTwo: 1,
      },
      {
        name: "txtTransc",
        title: "Transcription",
        wordWrapEnabled: true,
        oneTwo: 1,
      },
      {
        name: "audTransl",
        title: "Trans. Clip",
        oneTwo: 2,
      },
      {
        name: "txtTransl",
        title: "Translation",
        wordWrapEnabled: true,
        oneTwo: 2,
      },
    ];

    /*     // Column Names and Widths
    const defaultColumnWidths = [
      {
        columnName: "startTime",
        width: 90
      },
      {
        columnName: "audCareful",
        width: 55
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
        width: 55
      }
    ]; */
    return (
      <div id="TranscriptionTableSpace">
        <Paper className="annotation-table">
          <Grid
            rows={this.props.annotationTable}
            columns={annotCols}
            rootComponent={Root}
          >
            <SearchState />
            <IntegratedFiltering />
            <SortingState
              defaultSorting={[{ columnName: "startTime", direction: "asc" }]}
            />
            <IntegratedSorting />
            <VirtualTable rowComponent={TableRow} cellComponent={dataCell} />
            <TableColumnResizing
              defaultColumnWidths={this.defaultColumnWidths}
              minColumnWidth={50}
              onColumnWidthsChange={this.setColumnWidths}
            />
            <Toolbar />
            <TableHeaderRow cellComponent={emptyHeaderCell} />
            <SearchPanel />
          </Grid>
        </Paper>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  annotationTable: state.annot.annotationTable,
  categories: state.annot.categories,
  currentTimeline: state.annot.currentTimeline,
  duration: state.player.duration,
  dimensions: state.system.dimensions,
  prevTimeline: state.annot.prevTimeline,
  sourceMedia: state.tree.sourceMedia,
  timelineChanged: state.annot.timelineChanged,
  timelines: state.annot.timeline,
  timelinesInstantiated: state.annot.timelinesInstantiated,
  url: state.player.url,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      togglePlay: actions.togglePlay,
      pushAnnotationTable: actions.pushAnnotationTable,
      updatePrevTimeline: actions.updatePrevTimeline,
      setDispatch: actions.setDispatch,
      setTimelineChanged: actions.setTimelineChanged,
    },
    dispatch
  ),
});
export default connect(mapStateToProps, mapDispatchToProps)(AnnotationTable);
