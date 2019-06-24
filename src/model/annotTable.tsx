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
  // These come from the stores.
  // annotations: object;
  vidPlayerRef: any;
  timeline: LooseObject;
  categories: string[];
  annotationTable: AnnotationRow[];
}

interface DispatchProps {
  // These come from the actions
  // addCategory: typeof actions.addCategory;
  play: typeof actions.play;
  setURL: typeof actions.setURL;
  pushAnnotationTable: typeof actions.pushAnnotationTable;
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

  componentDidMount() {
    // Runs on load
  }

  render() {
    // Table Values

    // tslint:disable-next-line
    const TableRow = ({ row, ...restProps }: any) => (
      <Table.Row
        {...restProps}
        onClick={() => seekToSec(this.props.vidPlayerRef, row.startTime)}
      />
    );
    // tslint:disable-next-line
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
    // tslint:disable-next-line
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
          onClick={() => actions.setURL(value.toString())}
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
      const length = this.props.vidPlayerRef.getDuration();
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
  vidPlayerRef: state.player.vidPlayerRef,
  timeline: state.annotations.timeline[0], // ToDo: Un-Hardwire this
  categories: state.annotations.categories,
  annotationTable: state.annotations.annotationTable
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
