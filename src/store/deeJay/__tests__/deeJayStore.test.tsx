import * as actions from "../actions";
import * as types from "../types";

// import configureMockStore from "redux-mock-store";
// import thunk from "redux-thunk";

// const middlewares = [thunk];
// const mockStore = configureMockStore(middlewares);

/* const mockServiceCreator = (body: any, succeeds = true) => () => {
  new Promise((resolve, reject) => {
    setTimeout(() => (succeeds ? resolve(body) : reject(body)), 10);
  });
}; */

// https://willowtreeapps.com/ideas/best-practices-for-unit-testing-with-a-react-redux-approach
// https://redux.js.org/recipes/writing-tests

it("has a PlayPauseFunction and a resetDeeJay Action", () => {
  expect(types).toHaveProperty("PLAY_PAUSE");
  expect(actions).toHaveProperty("resetDeeJay");
});
