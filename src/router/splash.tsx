import React from 'react';
import logo from './assets/icons/png/512x512.png';
import './App.css';

const splash: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to <code>Prestige</code>.
        </p>
      </header>
    </div>
  );
}

export default splash;
