/**
 * AnnotationTable Component
 *
 * A React component that displays linguistic annotations in a table format.
 * This component has been migrated from a class-based to a function-based architecture
 * using the useAnnotationTable custom hook.
 *
 * Features:
 * - DevExtreme Grid integration with virtual scrolling
 * - Row selection, cell editing, sorting, and filtering
 * - Interactive cells with audio/video playback
 * - Dynamic column width management
 * - Timeline milestone visualization
 *
 * Migration Notes:
 * - Converted from class component to function component
 * - Extracted table logic into useAnnotationTable hook
 * - Replaced connect() with useSelector + useDispatch
 * - Converted lifecycle methods to useEffect
 * - Improved TypeScript typing
 *
 * @module features/annotations/components
 */

import React, { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IntegratedFiltering,
  IntegratedSorting,
  SortingState,
  TableColumnResizing,
  SearchState,
} from "@devexpress/dx-react-grid";
import {
  Grid,
  VirtualTable,
  TableHeaderRow,
  Toolbar,
  SearchPanel,
} from "@devexpress/dx-react-grid-material-ui";
import Paper from "@mui/material/Paper";

import * as actions from "../../../../store";
import { getTimelineIndex } from "../../../../components/globalFunctions";
import ResizableDiv from "../../../../components/resizableDiv";
import { useAnnotationTable } from "../../hooks/useAnnotationTable";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the AnnotationTable component
 */
export interface AnnotationTableProps {
  /**
   * Optional CSS class name
   */
  className?: string;
}

// ============================================================================
// COMPONENT HELPERS
// ============================================================================

/**
 * Custom Grid Root component with styling
 */
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
);

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AnnotationTable Component
 *
 * Displays linguistic annotations in an interactive table with:
 * - Start time with play button
 * - Careful voiceover audio clip button
 * - Transcription text (clickable to play)
 * - Translation voiceover audio clip button
 * - Translation text (clickable to play)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AnnotationTable />
 * ```
 *
 * @example
 * ```tsx
 * // With custom className
 * <AnnotationTable className="my-annotation-table" />
 * ```
 */
export function AnnotationTable({
  className,
}: AnnotationTableProps = {}): JSX.Element {
  // ============================================================================
  // REDUX STATE
  // ============================================================================

  const timelines = useSelector(
    (state: actions.StateProps) => state.annot.timeline,
  );
  const currentTimeline = useSelector(
    (state: actions.StateProps) => state.annot.currentTimeline,
  );
  const dimensions = useSelector(
    (state: actions.StateProps) => state.system.dimensions,
  );
  const annotationTable = useSelector(
    (state: actions.StateProps) => state.annot.annotationTable,
  );
  const sourceMedia = useSelector(
    (state: actions.StateProps) => state.tree.sourceMedia,
  );
  const timelineChanged = useSelector(
    (state: actions.StateProps) => state.annot.timelineChanged,
  );
  const timelinesInstantiated = useSelector(
    (state: actions.StateProps) => state.annot.timelinesInstantiated,
  );
  const url = useSelector((state: actions.StateProps) => state.player.url);

  // ============================================================================
  // REDUX DISPATCH
  // ============================================================================

  const dispatch = useDispatch();

  // ============================================================================
  // HOOK USAGE
  // ============================================================================

  /**
   * Initialize annotation table hook
   * Provides all table logic, cell components, and handlers
   */
  const {
    columns,
    columnWidths,
    handleColumnWidthsChange,
    TableRow,
    DataCell,
    HeaderCell,
    formatTimeline,
  } = useAnnotationTable({
    currentTimeline,
    dimensions,
    onDispatchAction: useCallback(
      (action) => {
        dispatch(actions.setDispatch(action));
      },
      [dispatch],
    ),
  });

  // ============================================================================
  // REFS
  // ============================================================================

  /**
   * Store previous values to detect changes
   * Used to implement componentDidUpdate logic
   */
  const prevTimelineIndexRef = useRef<number>(-1);
  const prevTimelineChangedRef = useRef<boolean>(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Handle timeline changes and format data
   *
   * Equivalent to componentDidUpdate in the class component.
   * Monitors timeline changes and triggers formatting when needed.
   */
  useEffect(() => {
    const newIndex = getTimelineIndex(timelines, url, sourceMedia);
    const prevIndex = prevTimelineIndexRef.current;
    const prevChanged = prevTimelineChangedRef.current;

    // Only update if the timeline actually changed
    if (
      timelinesInstantiated &&
      (newIndex !== prevIndex || (timelineChanged && !prevChanged))
    ) {
      // Format the timeline and update Redux store
      const formattedTable = formatTimeline(timelines[newIndex]);

      // Only update if the table actually changed
      if (JSON.stringify(annotationTable) !== JSON.stringify(formattedTable)) {
        dispatch(actions.pushAnnotationTable(formattedTable));
        dispatch(actions.setTimelineChanged(false));
      } else {
        console.log("Error: Timeline not different.");
        dispatch(actions.setTimelineChanged(false));
      }

      // Update prevTimeline in Redux
      dispatch(actions.updatePrevTimeline(newIndex));

      // Update column widths
      handleColumnWidthsChange(columnWidths);
    }

    // Store current values for next comparison
    prevTimelineIndexRef.current = newIndex;
    prevTimelineChangedRef.current = timelineChanged;
  }, [
    timelines,
    url,
    sourceMedia,
    timelinesInstantiated,
    timelineChanged,
    formatTimeline,
    dispatch,
    annotationTable,
    handleColumnWidthsChange,
    columnWidths,
  ]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log("UnMounting Annot");
    };
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ResizableDiv className="AnnotDiv" id="TranscriptionTableSpace">
      <Paper className={className || "annotation-table"}>
        <Grid rows={annotationTable} columns={columns} rootComponent={Root}>
          <SearchState />
          <IntegratedFiltering />
          <SortingState
            defaultSorting={[{ columnName: "startTime", direction: "asc" }]}
          />
          <IntegratedSorting />
          <VirtualTable rowComponent={TableRow} cellComponent={DataCell} />
          <TableColumnResizing
            columnWidths={columnWidths}
            minColumnWidth={50}
            onColumnWidthsChange={handleColumnWidthsChange as any}
          />
          <Toolbar />
          <TableHeaderRow cellComponent={HeaderCell} />
          <SearchPanel />
        </Grid>
      </Paper>
    </ResizableDiv>
  );
}

export default AnnotationTable;
