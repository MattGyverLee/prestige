
import * as React from 'react';
import { connect } from "react-redux";
import './App.css';
import logo from './assets/icons/png/512x512.png';
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
      userName: "myName3",
      clicks: 5
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
      </header>
    </div>
    );
  }
};






const mapStateToProps = (state: AppState) => ({
  system: state.system
});

export default connect(
  mapStateToProps,
  { updateSession }
)(App);

