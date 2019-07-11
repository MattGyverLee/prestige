import * as actions from "../store";

import React, { Component } from "react";

import Styles from "./snackbar.module.css";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

interface StateProps {
  isActive: boolean;
}

interface DispatchProps {
  snackbarToggleActive: typeof actions.snackbarToggleActive;
}

interface SnackbarProps extends StateProps, DispatchProps {}

export class Snackbar extends Component<SnackbarProps> {
  // TODO: consider Notistack
  // https://iamhosseindhv.com/notistack/demos#redux-/-mobx-example
  message = "";

  openSnackBar = (message = "Something went wrong...") => {
    this.message = message;
    this.props.snackbarToggleActive(true);
    setTimeout(() => {
      this.props.snackbarToggleActive(false);
    }, 2000);
  };

  render() {
    const isActive = this.props.isActive;
    return (
      <div
        className={
          isActive ? [Styles.snackbar, Styles.show].join(" ") : Styles.snackbar
        }
      >
        {this.message}
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  isActive: state.system.snackbarIsActive
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      snackbarToggleActive: actions.snackbarToggleActive
    },
    dispatch
  )
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Snackbar);
