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

/* 
let store: any;
// set up a fake store for all our tests
beforeEach(() => {
  store = mockStore({ Playing: false });
}); */

/* it("has a PlayPauseFunction", () => {
  expect(types).toHaveProperty("PLAY_PAUSE");
  expect(store.dispatch(playPause(), mockStore)).toContain(types.PLAY_PAUSE);
});

it("dispatches playPause action", () => {
  expect(actions).toContainEqual({
    type: types.PLAY_PAUSE
  });
  expect(actions).toContainEqual({ type: types.PLAY_PAUSE });
}); */

/*   describe('when a user logs in', () => {
      it('fires a play/pause action', () =>
        store
          .dispatch(playPause(),
            mockServiceCreator(types.PLAY_PAUSE),
          ))
          .then(() => expect(store.getActions()).toEqual(true));



describe("actions", () => {
  it("should toggle PlayPause", () => {
    expect(playPause()).toEqual(true);
  });
}); */
