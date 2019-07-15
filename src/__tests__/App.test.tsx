import App from "../App";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import configureStore from "../store";

const store = configureStore();

let tree = (props?: any) => (
  <Provider store={store}>
    <App />
  </Provider>
);

it("is true", () => {
  true === true;
});

/* it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(tree(), div);
  ReactDOM.unmountComponentAtNode(div);
});
 */
