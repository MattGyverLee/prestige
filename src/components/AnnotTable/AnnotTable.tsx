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

import Paper from "@mui/material/Paper";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { getTimelineIndex } from "../globalFunctions";
import ResizableDiv from "../../components/resizableDiv";

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
const Root = (props: any) => (
  <Grid.Root
    {...props}
    style={{
      minHeight: "50vh",
      height: "90vh",
      flexGrow: 1,
      flexShrink: 1,
    }}
  />
  // 100
);

interface DispatchProps {
  togglePlay: typeof actions.togglePlay;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
  updatePrevTimeline: typeof actions.updatePrevTimeline;
  setDispatch: typeof actions.setDispatch;
  setTimelineChanged: typeof actions.setTimelineChanged;
}

interface ComponentProps extends StateProps, DispatchProps {}

interface ComponentState {
  columnWidths: Array<{ columnName: string; width: number }>;
}

export class AnnotationTable extends Component<ComponentProps, ComponentState> {
  private redrawCount = 0;
  private defaultColumnWidths = [
    {
      columnName: "startTime",
      width: 90,
    },
    {
      columnName: "audCareful",
      width: 80,
    },
    {
      columnName: "txtTransl",
      width: 200,
    },
    {
      columnName: "audTransl",
      width: 80,
    },
    {
      columnName: "txtTransc",
      width: 200,
    },
  ];

  constructor(props: ComponentProps) {
    super(props);
    this.state = {
      columnWidths: this.defaultColumnWidths,
    };
  }

  componentWillUnmount(): void {
    console.log("UnMounting Annot");
  }

  componentDidUpdate(prevProps: StateProps): void {
    const newIndex = getTimelineIndex(
      this.props.timelines,
      this.props.url,
      this.props.sourceMedia,
    );
    const prevIndex = getTimelineIndex(
      prevProps.timelines,
      prevProps.url,
      prevProps.sourceMedia,
    );

    // Only update if the timeline actually changed (comparing with prevProps, not internal state)
    if (
      this.props.timelinesInstantiated &&
      (newIndex !== prevIndex ||
        (this.props.timelineChanged && !prevProps.timelineChanged))
    ) {
      this.formatTimeline(this.props.timelines[newIndex]);
      this.props.updatePrevTimeline(newIndex);
      this.setColumnWidths();
    }
  }

  // ==================== Timeline Formatting Helpers ====================

  /**
   * Create an empty annotation row for display when no timeline is loaded
   */
  private createEmptyAnnotationRow = (): AnnotationRow => {
    return {
      id: 1,
      startTime: 0,
      stopTime: 0,
      audCareful: "",
      audTransl: "",
      txtTransc: "Not Loaded",
      txtTransl: "",
    };
  };

  /**
   * Fill a row with data from a milestone's data array
   *
   * Processes each data item and populates the appropriate row fields:
   * - Audio clips (Careful/Translation) with timecode fragments
   * - Text content (Transcription/Translation)
   *
   * @param row - The row to fill
   * @param milestone - The milestone containing data
   */
  private fillRowWithMilestoneData = (
    row: AnnotationRow,
    milestone: LooseObject,
  ): void => {
    for (let d = 0, l = milestone.data.length; d < l; d++) {
      const curr = milestone.data[d];
      if (curr.mimeType.startsWith("audio")) {
        if (curr.channel === "CarefulMerged") {
          row.audCareful =
            curr.data + "#t" + curr.clipStart + "," + curr.clipStop;
        } else if (curr.channel === "TranslationMerged") {
          row.audTransl =
            curr.data + "#t" + curr.clipStart + "," + curr.clipStop;
        }
      } else if (curr.mimeType.startsWith("string")) {
        if (curr.channel === "Transcription") {
          row.txtTransc = curr.data;
        } else if (curr.channel === "Translation") {
          row.txtTransl = curr.data;
        }
      }
    }
  };

  /**
   * Create an annotation row from a milestone
   *
   * @param milestone - The milestone to convert to a row
   * @param idx - Index of the milestone (used for row ID)
   * @returns Populated annotation row
   */
  private createAnnotationRowFromMilestone = (
    milestone: LooseObject,
    idx: number,
  ): AnnotationRow => {
    const row: AnnotationRow = {
      id: idx + 1,
      startTime: milestone.startTime,
      stopTime: milestone.stopTime,
      audCareful: "",
      audTransl: "",
      txtTransc: "",
      txtTransl: "",
    };

    this.fillRowWithMilestoneData(row, milestone);
    return row;
  };

  // ==================== Timeline Formatting ====================

  /**
   * Format timeline into annotation table rows
   *
   * Converts a timeline's milestones into a table format suitable for display.
   * If no timeline is loaded, shows a "Not Loaded" placeholder row.
   *
   * @param timeline - The timeline to format
   */
  formatTimeline = (timeline: LooseObject): void => {
    const table: AnnotationRow[] = [];

    if (timeline === undefined || timeline === null) {
      table.push(this.createEmptyAnnotationRow());
    } else {
      timeline.milestones.forEach((milestone: LooseObject, idx: number) => {
        const row = this.createAnnotationRowFromMilestone(milestone, idx);
        table.push(row);
      });
    }

    // Update Redux store
    if (this.props.annotationTable !== table) {
      this.props.pushAnnotationTable(table);
      this.props.setTimelineChanged(false);
    } else {
      console.log("Error: Timeline not different.");
      this.props.setTimelineChanged(false);
    }
  };
  setColumnWidths = (
    columnWidths: LooseObject[] = this.defaultColumnWidths,
  ) => {
    // Create a copy to avoid mutating the input array
    const newColumnWidths = [...columnWidths];

    // Defensive check for dimensions
    if (
      this.props.dimensions &&
      this.props.dimensions.AppDetails &&
      typeof this.props.dimensions.AppDetails.width === "number"
    ) {
      const lastCol =
        this.props.dimensions.AppDetails.width -
        newColumnWidths[0].width -
        newColumnWidths[1].width -
        newColumnWidths[3].width -
        newColumnWidths[4].width -
        5;

      // Ensure lastCol is a valid positive number
      if (lastCol > 50) {
        newColumnWidths[2].width = lastCol;
      }
    }

    this.setState({ columnWidths: newColumnWidths });
  };

  // ==================== Table Cell Component Creators ====================

  /**
   * Dispatch a clip action to play a specific time range
   *
   * @param wsNum - Primary wavesurfer number (0 for source)
   * @param wsNum2 - Secondary wavesurfer number (1 or 2 for annotations)
   * @param clipStart - Start time in seconds
   * @param clipStop - Stop time in seconds
   */
  private dispatchClipAction = (
    wsNum: number,
    wsNum2: number | undefined,
    clipStart: number,
    clipStop: number,
  ): void => {
    if (this.props.currentTimeline === -1) {
      console.log("Empty Timeline Click");
    } else {
      this.props.setDispatch({
        dispatchType: "Clip",
        wsNum,
        wsNum2,
        clipStart,
        clipStop,
      });
    }
  };

  /**
   * Create table row component
   */
  private createTableRow = () => {
    return ({ ...restProps }: any) => <Table.Row {...restProps} />;
  };

  /**
   * Create start time cell with play button
   *
   * Displays the start time and a play button that triggers playback of the milestone.
   */
  private createStartCell = () => {
    return ({ value, style, row, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style,
        }}
        onClick={() => {
          this.dispatchClipAction(0, undefined, row.startTime, row.stopTime);
        }}
      >
        <span
          style={{
            color: "lightblue",
          }}
        >
          {value}:{"  "}
          <button
            onClick={() => {
              this.dispatchClipAction(
                0,
                undefined,
                row.startTime,
                row.stopTime,
              );
            }}
          >
            {" "}
            ▶{" "}
          </button>
        </span>
      </Table.Cell>
    );
  };

  /**
   * Create flowing text cell for transcription/translation
   *
   * Displays text content that can wrap and be clicked to play the corresponding audio.
   *
   * @param oneTwo - Audio track number (1 for Careful, 2 for Translation)
   */
  private createFlowingCell = () => {
    return ({ oneTwo, value, style, row, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style,
        }}
        onClick={() => {
          this.dispatchClipAction(0, oneTwo, row.startTime, row.stopTime);
        }}
      >
        <span
          style={{
            color:
              value !== ""
                ? oneTwo === 1
                  ? "lightgreen"
                  : "white"
                : undefined,
            fontSize: "16px",
          }}
        >
          {value}
        </span>
      </Table.Cell>
    );
  };

  /**
   * Create play button cell for audio clips
   *
   * Displays a play button that triggers playback of a specific audio clip
   * (Careful or Translation) with timecode fragments.
   *
   * @param oneTwo - Audio track number (1 for Careful, 2 for Translation)
   */
  private createHighlightedCell = () => {
    return ({ oneTwo, value, style, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          ...style,
        }}
      >
        <button
          onClick={() => {
            const parsedURL = value.split("#");
            if (parsedURL.length > 1) {
              const splitParsed = parsedURL[1].split(",");
              if (splitParsed.length === 1) {
                this.props.setDispatch({
                  dispatchType: "Seek",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1)),
                });
              } else {
                this.dispatchClipAction(
                  oneTwo,
                  undefined,
                  parseFloat(splitParsed[0].substring(1)),
                  parseFloat(splitParsed[1]),
                );
              }
            }
          }}
          style={{
            display: value < 1000 ? "none" : undefined,
          }}
        >
          ▶{" "}
        </button>
      </Table.Cell>
    );
  };

  /**
   * Create empty header cell component
   */
  private createEmptyHeaderCell = () => {
    return (cellProps: any) => {
      return <TableHeaderRow.Cell {...cellProps} />;
    };
  };

  /**
   * Create data cell router
   *
   * Routes to the appropriate cell component based on column name.
   */
  private createDataCell = () => {
    const FlowingCell = this.createFlowingCell();
    const HighlightedCell = this.createHighlightedCell();
    const StartCell = this.createStartCell();

    return (cellProps: any) => {
      const { column } = cellProps;
      if (column.name === "txtTransl")
        return <FlowingCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "txtTransc")
        return <FlowingCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "audCareful")
        return <HighlightedCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "audTransl")
        return <HighlightedCell {...{ oneTwo: column.oneTwo, ...cellProps }} />;
      else if (column.name === "startTime")
        return <StartCell {...{ ...cellProps }} />;
      return <Table.Cell {...cellProps} />;
    };
  };

  /**
   * Get annotation column configuration
   *
   * Defines columns for the annotation table: start time, audio clips, and text fields.
   */
  private getAnnotationColumns = () => {
    return [
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
  };

  // ==================== Render Method ====================

  render() {
    // Create component functions
    const TableRow = this.createTableRow();
    const dataCell = this.createDataCell();
    const emptyHeaderCell = this.createEmptyHeaderCell();
    const annotCols = this.getAnnotationColumns();

    return (
      <ResizableDiv className="AnnotDiv" id="TranscriptionTableSpace">
        <Paper className="annotation-table">
          {/* @ts-expect-error - DevExpress Grid types don't properly define children */}
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
              columnWidths={this.state.columnWidths}
              minColumnWidth={50}
              onColumnWidthsChange={this.setColumnWidths}
            />
            <Toolbar />
            <TableHeaderRow cellComponent={emptyHeaderCell} />
            <SearchPanel />
          </Grid>
        </Paper>
      </ResizableDiv>
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
    dispatch,
  ),
});
export default connect(mapStateToProps, mapDispatchToProps)(AnnotationTable);
