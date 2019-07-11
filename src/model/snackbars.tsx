import React, { PureComponent } from "react";

import Styles from "./snackbar.module.css";

export class Snackbar extends PureComponent {
  // todo: consider Notistack
  // https://iamhosseindhv.com/notistack/demos#redux-/-mobx-example
  message = "";

  state = {
    isActive: false
  };
  isActive = () => this.state.isActive;

  openSnackBar = (message = "Something went wrong...") => {
    this.message = message;
    this.setState({ isActive: true }, () => {
      setTimeout(() => {
        this.setState({ isActive: false });
      }, 2000);
    });
  };

  render() {
    const { isActive } = this.state;
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
