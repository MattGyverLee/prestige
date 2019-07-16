import "jest-dom/extend-expect";

import ConnectedApp, { App } from "../App";
import { Provider } from "react-redux";
import React from "react";
import { annCleanStore } from "../store/annot/reducers";
import configureMockStore from "redux-mock-store";
import { deeJayCleanStore } from "../store/deeJay/reducers";
import { playerCleanStore } from "../store/player/reducers";
import { systemCleanStore } from "../store/system/reducers";
import { treeCleanStore } from "../store/tree/reducers";

/*
import {
  cleanup,
  fireEvent,
  render,
  waitForElement
} from "@testing-library/react"; 
*/

const renderer = require("react-test-renderer");

declare global {
  interface Window {
    AudioContext: any;
  }
}
const store = configureMockStore([])({
  annot: { ...annCleanStore },
  deeJay: {
    ...deeJayCleanStore
  },
  player: { ...playerCleanStore },
  system: { ...systemCleanStore },
  tree: { ...treeCleanStore }
});

let appMaster: any;

jest.autoMockOn();

it("is true", () => true);

it("renders without crashing", () => {
  renderer.act(() => {
    appMaster = renderer.create(
      <Provider store={store}>
        <ConnectedApp />
      </Provider>
    );
  });
  expect(appMaster).toMatchSnapshot();
  const appHandle: App = appMaster.root.findByType(App).instance;
  expect(appHandle).toBeVisible();
});
