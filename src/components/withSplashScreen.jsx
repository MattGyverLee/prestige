import React, {Component} from 'react';
import './splash-screen.css';
import logo from "../assets/icons/png/512x512.png";

function LoadingMessage() {
  return (
    <div className="splash-screen">
        <br/>
        <img src={logo} className="AppLogo" alt="logo" />
        <h1>
          Welcome to <code>Prestige</code>.
        </h1>
      <div className="loading-dot">.</div>
    </div>
  );
}

function withSplashScreen(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: true,
      };
    }

    async componentDidMount() {
      try {
        setTimeout(() => {
          this.setState({
            loading: false,
          });
        }, 1500)
      } catch (err) {
        console.log(err);
        this.setState({
          loading: false,
        });
      }
    }

    render() {
      // while checking user session, show "loading" message
      if (this.state.loading) return LoadingMessage();

      // otherwise, show the desired route
      return <WrappedComponent {...this.props} />;
    }
  };
}

export default withSplashScreen;