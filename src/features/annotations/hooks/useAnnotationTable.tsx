/**
 * useAnnotationTable Hook
 *
 * Custom hook for managing the annotation table state and behavior.
 * Handles DevExtreme Grid configuration, timeline formatting, cell rendering,
 * and user interactions with annotation data.
 *
 * This hook abstracts the complex logic of:
 * - Converting timeline milestones into annotation table rows
 * - Managing column widths dynamically based on window dimensions
 * - Creating specialized cell components for different data types
 * - Dispatching playback actions for audio/video clips
 *
 * @module features/annotations/hooks
 */

import { useState, useCallback, useMemo } from "react";
import { Table, TableHeaderRow } from "@devexpress/dx-react-grid-material-ui";
import { AnnotationRow, LooseObject } from "../../../store/annot/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Column width configuration for the annotation table
 */
export interface ColumnWidth {
  columnName: string;
  width: number;
}

/**
 * Annotation column configuration
 */
export interface AnnotationColumn {
  name: string;
  title: string;
  wordWrapEnabled?: boolean;
  oneTwo: number;
}

/**
 * Dispatch action for wavesurfer playback
 */
export interface DispatchAction {
  dispatchType: "Clip" | "Seek";
  wsNum: number;
  wsNum2?: number;
  clipStart: number;
  clipStop?: number;
}

/**
 * Props required by the useAnnotationTable hook
 */
export interface UseAnnotationTableProps {
  /** Current timeline index */
  currentTimeline: number;
  /** Window/component dimensions for dynamic column sizing */
  dimensions: LooseObject;
  /** Callback to dispatch wavesurfer actions */
  onDispatchAction: (action: DispatchAction) => void;
}

/**
 * Return type for the useAnnotationTable hook
 */
export interface UseAnnotationTableReturn {
  /** Column configuration for the grid */
  columns: AnnotationColumn[];
  /** Current column widths */
  columnWidths: ColumnWidth[];
  /** Handler for column width changes */
  handleColumnWidthsChange: (widths: ColumnWidth[]) => void;
  /** Custom table row component */
  TableRow: React.ComponentType<any>;
  /** Custom data cell component */
  DataCell: React.ComponentType<any>;
  /** Custom header cell component */
  HeaderCell: React.ComponentType<any>;
  /** Format timeline into annotation rows */
  formatTimeline: (timeline: LooseObject) => AnnotationRow[];
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default column widths for the annotation table
 */
const DEFAULT_COLUMN_WIDTHS: ColumnWidth[] = [
  { columnName: "startTime", width: 90 },
  { columnName: "audCareful", width: 80 },
  { columnName: "txtTransl", width: 200 },
  { columnName: "audTransl", width: 80 },
  { columnName: "txtTransc", width: 200 },
];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing annotation table state and behavior
 *
 * Provides all the logic needed to render and interact with the annotation table:
 * - Dynamic column width calculations
 * - Timeline to table row conversion
 * - Custom cell components with click handlers
 * - Audio/video clip playback dispatch
 *
 * @param {UseAnnotationTableProps} props - Hook configuration
 * @returns {UseAnnotationTableReturn} Table configuration and handlers
 *
 * @example
 * ```tsx
 * function AnnotationTableComponent() {
 *   const dispatch = useDispatch();
 *   const currentTimeline = useSelector(state => state.annot.currentTimeline);
 *   const dimensions = useSelector(state => state.system.dimensions);
 *
 *   const {
 *     columns,
 *     columnWidths,
 *     handleColumnWidthsChange,
 *     TableRow,
 *     DataCell,
 *     HeaderCell,
 *     formatTimeline,
 *   } = useAnnotationTable({
 *     currentTimeline,
 *     dimensions,
 *     onDispatchAction: (action) => dispatch(setDispatch(action)),
 *   });
 *
 *   return (
 *     <Grid rows={rows} columns={columns}>
 *       <VirtualTable rowComponent={TableRow} cellComponent={DataCell} />
 *       <TableColumnResizing
 *         columnWidths={columnWidths}
 *         onColumnWidthsChange={handleColumnWidthsChange}
 *       />
 *     </Grid>
 *   );
 * }
 * ```
 */
export function useAnnotationTable({
  currentTimeline,
  dimensions,
  onDispatchAction,
}: UseAnnotationTableProps): UseAnnotationTableReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  /**
   * Track column widths for the table
   * Initialized with default widths, updated when window resizes
   */
  const [columnWidths, setColumnWidths] = useState<ColumnWidth[]>(
    DEFAULT_COLUMN_WIDTHS,
  );

  // ============================================================================
  // COLUMN CONFIGURATION
  // ============================================================================

  /**
   * Define annotation table columns
   * Memoized to prevent unnecessary re-renders
   */
  const columns = useMemo<AnnotationColumn[]>(
    () => [
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
    ],
    [],
  );

  // ============================================================================
  // TIMELINE FORMATTING
  // ============================================================================

  /**
   * Create an empty annotation row for display when no timeline is loaded
   */
  const createEmptyAnnotationRow = useCallback((): AnnotationRow => {
    return {
      id: 1,
      startTime: 0,
      stopTime: 0,
      audCareful: "",
      audTransl: "",
      txtTransc: "Not Loaded",
      txtTransl: "",
    };
  }, []);

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
  const fillRowWithMilestoneData = useCallback(
    (row: AnnotationRow, milestone: LooseObject): void => {
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
    },
    [],
  );

  /**
   * Create an annotation row from a milestone
   *
   * @param milestone - The milestone to convert to a row
   * @param idx - Index of the milestone (used for row ID)
   * @returns Populated annotation row
   */
  const createAnnotationRowFromMilestone = useCallback(
    (milestone: LooseObject, idx: number): AnnotationRow => {
      const row: AnnotationRow = {
        id: idx + 1,
        startTime: milestone.startTime,
        stopTime: milestone.stopTime,
        audCareful: "",
        audTransl: "",
        txtTransc: "",
        txtTransl: "",
      };

      fillRowWithMilestoneData(row, milestone);
      return row;
    },
    [fillRowWithMilestoneData],
  );

  /**
   * Format timeline into annotation table rows
   *
   * Converts a timeline's milestones into a table format suitable for display.
   * If no timeline is loaded, shows a "Not Loaded" placeholder row.
   *
   * @param timeline - The timeline to format
   * @returns Array of annotation rows
   */
  const formatTimeline = useCallback(
    (timeline: LooseObject): AnnotationRow[] => {
      const table: AnnotationRow[] = [];

      if (timeline === undefined || timeline === null) {
        table.push(createEmptyAnnotationRow());
      } else {
        timeline.milestones.forEach((milestone: LooseObject, idx: number) => {
          const row = createAnnotationRowFromMilestone(milestone, idx);
          table.push(row);
        });
      }

      return table;
    },
    [createEmptyAnnotationRow, createAnnotationRowFromMilestone],
  );

  // ============================================================================
  // COLUMN WIDTH MANAGEMENT
  // ============================================================================

  /**
   * Handle column width changes
   *
   * Calculates dynamic width for the txtTransl column based on available space.
   * Other columns maintain their specified widths.
   *
   * @param widths - New column widths from DevExtreme
   */
  const handleColumnWidthsChange = useCallback(
    (widths: ColumnWidth[]) => {
      const newColumnWidths = [...widths];

      // Defensive check for dimensions
      if (
        dimensions &&
        dimensions.AppDetails &&
        typeof dimensions.AppDetails.width === "number"
      ) {
        const lastCol =
          dimensions.AppDetails.width -
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

      setColumnWidths(newColumnWidths);
    },
    [dimensions],
  );

  // ============================================================================
  // PLAYBACK DISPATCH
  // ============================================================================

  /**
   * Dispatch a clip action to play a specific time range
   *
   * @param wsNum - Primary wavesurfer number (0 for source)
   * @param wsNum2 - Secondary wavesurfer number (1 or 2 for annotations)
   * @param clipStart - Start time in seconds
   * @param clipStop - Stop time in seconds
   */
  const dispatchClipAction = useCallback(
    (
      wsNum: number,
      wsNum2: number | undefined,
      clipStart: number,
      clipStop: number,
    ): void => {
      if (currentTimeline === -1) {
        console.log("Empty Timeline Click");
      } else {
        onDispatchAction({
          dispatchType: "Clip",
          wsNum,
          wsNum2,
          clipStart,
          clipStop,
        });
      }
    },
    [currentTimeline, onDispatchAction],
  );

  // ============================================================================
  // CELL COMPONENT CREATORS
  // ============================================================================

  /**
   * Create table row component
   */
  const TableRow = useMemo(() => {
    return ({ ...restProps }: any) => <Table.Row {...restProps} />;
  }, []);

  /**
   * Create start time cell with play button
   *
   * Displays the start time and a play button that triggers playback of the milestone.
   */
  const createStartCell = useCallback(() => {
    return ({ value, style, row, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style,
        }}
        onClick={() => {
          dispatchClipAction(0, undefined, row.startTime, row.stopTime);
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
              dispatchClipAction(0, undefined, row.startTime, row.stopTime);
            }}
          >
            {" "}
            ▶{" "}
          </button>
        </span>
      </Table.Cell>
    );
  }, [dispatchClipAction]);

  /**
   * Create flowing text cell for transcription/translation
   *
   * Displays text content that can wrap and be clicked to play the corresponding audio.
   *
   * @param oneTwo - Audio track number (1 for Careful, 2 for Translation)
   */
  const createFlowingCell = useCallback(() => {
    return ({ oneTwo, value, style, row, ...restProps }: any) => (
      <Table.Cell
        {...restProps}
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
          ...style,
        }}
        onClick={() => {
          dispatchClipAction(0, oneTwo, row.startTime, row.stopTime);
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
  }, [dispatchClipAction]);

  /**
   * Create play button cell for audio clips
   *
   * Displays a play button that triggers playback of a specific audio clip
   * (Careful or Translation) with timecode fragments.
   *
   * @param oneTwo - Audio track number (1 for Careful, 2 for Translation)
   */
  const createHighlightedCell = useCallback(() => {
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
                onDispatchAction({
                  dispatchType: "Seek",
                  wsNum: oneTwo,
                  clipStart: parseFloat(splitParsed[0].substring(1)),
                });
              } else {
                dispatchClipAction(
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
  }, [dispatchClipAction, onDispatchAction]);

  /**
   * Create data cell router
   *
   * Routes to the appropriate cell component based on column name.
   */
  const DataCell = useMemo(() => {
    const FlowingCell = createFlowingCell();
    const HighlightedCell = createHighlightedCell();
    const StartCell = createStartCell();

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
  }, [createFlowingCell, createHighlightedCell, createStartCell]);

  /**
   * Create empty header cell component
   */
  const HeaderCell = useMemo(() => {
    return (cellProps: any) => {
      return <TableHeaderRow.Cell {...cellProps} />;
    };
  }, []);

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    columns,
    columnWidths,
    handleColumnWidthsChange,
    TableRow,
    DataCell,
    HeaderCell,
    formatTimeline,
  };
}
