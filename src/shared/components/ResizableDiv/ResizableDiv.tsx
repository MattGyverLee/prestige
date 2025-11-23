import React, { useEffect, useRef, useCallback } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useDispatch } from "react-redux";
import * as actions from "../../../store";

export interface ResizableDivProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className: string;
  id?: string;
}

/**
 * ResizableDiv Component
 *
 * Tracks div dimensions and updates Redux store when they change.
 * Uses debounced resize detection to prevent excessive updates.
 *
 * Improvements:
 * - Fixed initialization bug (now dispatches on first render)
 * - Removed redundant dimension checks
 * - Better type safety (React.ReactNode instead of any)
 * - Optimized with useCallback
 * - Skips updates for 0-sized elements (unmounted/hidden)
 */
export const ResizableDiv: React.FC<ResizableDivProps> = ({
  children,
  className,
  style,
  id,
}) => {
  const dispatch = useDispatch();

  const {
    width = 0,
    height = 0,
    ref,
  } = useResizeDetector({
    handleHeight: true,
    refreshMode: "debounce",
    refreshRate: 16, // ~60fps
  });

  const prevSizeRef = useRef({ width: 0, height: 0 });

  const updateSize = useCallback(
    (newWidth: number, newHeight: number) => {
      const roundedWidth = Math.round(newWidth);
      const roundedHeight = Math.round(newHeight);

      // Skip if dimensions haven't changed
      if (
        prevSizeRef.current.width === roundedWidth &&
        prevSizeRef.current.height === roundedHeight
      ) {
        return;
      }

      // Skip if width or height is 0 (component not yet mounted/visible)
      if (roundedWidth === 0 || roundedHeight === 0) {
        return;
      }

      // Update Redux store
      dispatch(
        actions.updateDimensions({
          width: roundedWidth,
          height: roundedHeight,
          target: className,
        }),
      );

      // Update ref for next comparison
      prevSizeRef.current = { width: roundedWidth, height: roundedHeight };
    },
    [className, dispatch],
  );

  useEffect(() => {
    updateSize(width, height);
  }, [width, height, updateSize]);

  return (
    <div ref={ref} className={className || ""} style={style} id={id}>
      {children}
    </div>
  );
};

export default ResizableDiv;
