import React, { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../../../store";

export interface ResizableDivProps {
  children: any;
  style?: any;
  className: string;
  id?: string;
}

export const ResizableDiv: React.FC<ResizableDivProps> = ({
  children,
  className,
}) => {
  const dimensions = useSelector(
    (state: actions.StateProps) => state.system.dimensions,
  );
  const dispatch = useDispatch();

  const {
    width = 0,
    height = 0,
    ref,
  } = useResizeDetector({
    handleHeight: true,
    refreshMode: "debounce",
    refreshRate: 16,
  });

  const prevSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);

    if (
      dimensions[className] &&
      (dimensions[className].width !== roundedWidth ||
        dimensions[className].height !== roundedHeight)
    ) {
      // Only update if dimensions actually changed
      if (
        prevSizeRef.current.width !== roundedWidth ||
        prevSizeRef.current.height !== roundedHeight
      ) {
        dispatch(
          actions.updateDimensions({
            width: roundedWidth,
            height: roundedHeight,
            target: className,
          }),
        );
        prevSizeRef.current = { width: roundedWidth, height: roundedHeight };
      }
    }
  }, [width, height, dimensions, className, dispatch]);

  return (
    <div ref={ref} className={className || ""}>
      {children}
    </div>
  );
};

export default ResizableDiv;
