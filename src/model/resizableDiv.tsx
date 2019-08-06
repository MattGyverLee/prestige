import React, { Component } from "react";
import { withSize } from "react-sizeme";
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
  size: { width: number; height: number };
  style?: any;
  monitorHeight?: boolean;
  className: string;
  id?: string;
  refreshMode?: string;
}

export class ResizableDiv extends Component<ComponentProps> {
  componentDidUpdate() {
    if (
      this.props.dimensions[this.props.className].width !==
        Math.round(this.props.size.width) ||
      this.props.dimensions[this.props.className].height !==
        Math.round(this.props.size.height)
    ) {
      this.props.updateDimensions({
        width: Math.round(this.props.size.width),
        height: Math.round(this.props.size.height),
        target: this.props.className
      });
    }
  }

  render() {
    return (
      /* The inside of this section is temporary */
      /* {Math.round(this.props.size.width)}x
        {Math.round(this.props.size.height)}
        <br /> */
      <div className={this.props.className || ""}>{this.props.children}</div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  dimensions: state.system.dimensions
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      updateDimensions: actions.updateDimensions
    },
    dispatch
  )
});

export default withSize({
  monitorHeight: true,
  refreshMode: "debounce"
})(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ResizableDiv)
);
