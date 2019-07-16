// This comment Allows me to put Jest Calls before Imports

import "jest-dom/extend-expect";

import ConnectedDeeJay, { DeeJay } from "../deeJay";

import { Provider } from "react-redux";
import React from "react";
import { annCleanStore } from "../../store/annot/reducers";
import { cleanup } from "@testing-library/react";
import configureMockStore from "redux-mock-store";
import { deeJayCleanStore } from "../../store/deeJay/reducers";
import { playerCleanStore } from "../../store/player/reducers";
import { systemCleanStore } from "../../store/system/reducers";
import { treeCleanStore } from "../../store/tree/reducers";

const renderer = require("react-test-renderer");

// jest.mock("wavesurfer.js");
jest.autoMockOn();

const store = configureMockStore([])({
  annot: { ...annCleanStore },
  deeJay: {
    ...deeJayCleanStore
  },
  player: { ...playerCleanStore },
  system: { ...systemCleanStore },
  tree: { ...treeCleanStore }
});

var deejayMaster: any;

// TODO: Constrain to Media Type

afterEach(cleanup);

const props = {
  dispatchSnackbar: jest.fn(),
  setWSVolume: jest.fn(),
  setWSDuration: jest.fn(),
  setSeek: jest.fn(),
  resetDeeJay: jest.fn(),
  setDispatch: jest.fn(),
  playerPlay: jest.fn(),
  waveformAdded: jest.fn(),
  volumes: [1, 0, 0]
};

afterEach(cleanup);

it("is true", () => true);

it("renders deeJay without crashing", () => {
  renderer.act(() => {
    deejayMaster = renderer.create(
      <Provider store={store}>
        <ConnectedDeeJay {...props} />
      </Provider>
    );
  });
  expect(deejayMaster).toMatchSnapshot();
  let deejayHandle: DeeJay = deejayMaster.root.findByType(DeeJay).instance;
  expect(deejayHandle).toBeVisible();
});
