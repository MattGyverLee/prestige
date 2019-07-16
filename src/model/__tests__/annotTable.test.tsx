// This comment Allows me to put Jest Calls before Imports

import "jest-dom/extend-expect";

import ConnectedAnnotationTable, { AnnotationTable } from "../annotTable";
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

var annotationTableMaster: any;

// TODO: Constrain to Media Type

afterEach(cleanup);

const props = {};

afterEach(cleanup);

it("is true", () => true);

it("renders annotTable without crashing", () => {
  renderer.act(() => {
    annotationTableMaster = renderer.create(
      <Provider store={store}>
        <ConnectedAnnotationTable {...props} />
      </Provider>
    );
  });
  expect(annotationTableMaster).toMatchSnapshot();
  const annotationTableHandle: AnnotationTable = annotationTableMaster.root.findByType(
    AnnotationTable
  ).instance;
  expect(annotationTableHandle).toBeVisible();
});
