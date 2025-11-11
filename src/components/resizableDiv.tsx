import React, { useEffect, useRef } from "react";
import { useResizeDetector } from "react-resize-detector";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import * as actions from "../store";
import { LooseObject } from "../store/annot/types";

interface StateProps {
  // These come from the stores.
  dimensions: LooseObject;
}

interface DispatchProps {
  // These come from the actions
  updateDimensions: typeof actions.updateDimensions;
}

interface ComponentProps extends StateProps, DispatchProps {
  // These come from the local functions
  children: any;
  style?: any;
  className: string;
  id?: string;
}

export const ResizableDiv: React.FC<ComponentProps> = ({
  children,
  className,
  dimensions,
  updateDimensions,
}) => {
  const { width = 0, height = 0, ref } = useResizeDetector({
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
        updateDimensions({
          width: roundedWidth,
          height: roundedHeight,
          target: className,
        });
        prevSizeRef.current = { width: roundedWidth, height: roundedHeight };
      }
    }
  }, [width, height, dimensions, className, updateDimensions]);

  return (
    <div ref={ref} className={className || ""}>
      {children}
    </div>
  );
};

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  dimensions: state.system.dimensions,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      updateDimensions: actions.updateDimensions,
    },
    dispatch,
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ResizableDiv);
