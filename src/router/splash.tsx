import "./App.css";

import React from "react";
import logo from "./assets/icons/png/512x512.png";

const splash: React.FC = () => {
  return (
    <div className="App">
      <header className="AppHeader">
        <img src={logo} className="AppLogo" alt="logo" />
        <p>
          Welcome to <code>Prestige</code>.
        </p>
      </header>
    </div>
  );
};

export default splash;
