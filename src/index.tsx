import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Provider } from "react-redux";
import configureStore from "./store";

const store = configureStore();

console.log(`process.env: `, process.env);
if (process.env.REACT_APP_MODE === 'electron') {
    console.log(`Running in Electron: Filesystem access is enabled.`)
} else {
    console.log('Running on the Web, Filesystem access disabled.')
}

const Root = () => (
    <Provider store={store}>
      <App />
    </Provider>
  );

ReactDOM.render(<Root />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
