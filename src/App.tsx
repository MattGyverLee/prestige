
import * as React from 'react';
import { connect } from "react-redux";
import './App.css';
import { hot } from 'react-hot-loader'
import logo from './assets/icons/png/512x512.png';
import { AppState } from './store'
import { SystemState } from "./store/system/types";
import { updateSession } from "./store/system/actions";
import { ActiveFolderState } from "./store/tree/types";
import { updateActiveFolder } from "./store/tree/actions";
interface AppProps {
  system: SystemState,
  updateSession: typeof updateSession;
  activeFolder?: ActiveFolderState;
  updateActiveFolder: typeof updateActiveFolder;
}

class App extends React.Component<AppProps> {
  state = {
    message: ""
  };

  componentDidMount() {
    this.props.updateSession({
      loggedIn: true,
      session: "my_session",
      userName: "myName4",
      clicks: 0
    });
    this.props.updateActiveFolder({
      path: "bing",
      URI: "http.bing"
    });
  }

  render() {
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to <code>Prestige</code>.
          userName={this.props.system.userName}
        </p>
        <p>599</p>
      </header>
    </div>
    );
  }
};


const mapStateToProps = (state: AppState) => ({
  system: state.system,
  tree: state.tree
});

export default hot(module)(connect(
  mapStateToProps,
  { updateSession, updateActiveFolder }
)(App));