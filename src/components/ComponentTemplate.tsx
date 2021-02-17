import * as actions from "../store";

import React, { Component } from "react";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  // These come from the stores.
  // annotations: object;
}

interface DispatchProps {
  // These come from the actions
  // addCategory: typeof actions.addCategory;
}

interface ComponentProps extends StateProps, DispatchProps {
  // These come from the local functions
}

class ComponentZone extends Component<ComponentProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      open: false,
    };
  }

  componentDidMount() {
    // Runs on load
  }

  render() {
    return <div>Component</div>;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = (state: actions.StateProps): StateProps => ({
  // annotations: state.annot.annotations,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      // annotations: state.annot.annotations,
    },
    dispatch
  ),
});
export default connect(mapStateToProps, mapDispatchToProps)(ComponentZone);
