import * as React from 'react';
import { connect } from "react-redux";
import './App.css';
import { AppState } from './store'

import { SystemState } from "./store/system/types";
import { updateSession } from "./store/system/actions";

interface AppProps {
  system: SystemState,
  updateSession: typeof updateSession;
}


class App extends React.Component<AppProps> {
  state = {
    message: ""
  };

  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "myName"
    });
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <p>
          Welcome to <code>Prestige</code>.
          userName={this.props.system.userName}
        </p>
      </header>
    </div>
    );
  }
};

/*
const { default: installExtension, REACT_DEVELOPER_TOOLS } = require("electron-devtools-installer")

installExtension(REACT_DEVELOPER_TOOLS).then((name:string) => {
  console.log(`Added extension ${name}`);
}).catch((err:any) => {
  //todo, sort errors
  console.log("An error occured", err);
})
*/

const mapStateToProps = (state: AppState) => ({
  system: state.system
});

export default connect(
  mapStateToProps,
  { updateSession }
)(App);

