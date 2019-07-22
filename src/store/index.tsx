import { annCleanStore, annotationReducer } from "./annot/reducers";
import { applyMiddleware, combineReducers, createStore } from "redux";

import { composeWithDevTools } from "redux-devtools-extension";
import { deeJayReducer, deeJayCleanStore } from "./deeJay/reducers";
import { playerReducer, playerCleanStore } from "./player/reducers";
import { systemReducer } from "./system/reducers";
import thunkMiddleware from "redux-thunk";
import { treeReducer, treeCleanStore } from "./tree/reducers";

// These are intentionally ordered
export const appReducer = combineReducers({
  system: systemReducer,
  tree: treeReducer,
  player: playerReducer,
  deeJay: deeJayReducer,
  annot: annotationReducer
});

const allReducers = (state: any, action: any) => {
  if (
    action.type === ("ON_NEW_FOLDER" || "ON_RELOAD_FOLDER" || "HARD_RESET_APP")
  ) {
    state = {
      ...state,
      tree: treeCleanStore,
      annot: annCleanStore,
      deeJay: deeJayCleanStore,
      player: playerCleanStore
    };
  } else if (action.type === "RESET_DEE_JAY") {
    state = {
      ...state,
      deeJay: deeJayCleanStore
    };
  }
  return appReducer(state, action);
};

export type StateProps = ReturnType<typeof allReducers>;

export default function configureStore() {
  const middlewares = [thunkMiddleware];
  const middleWareEnhancer = applyMiddleware(...middlewares);

  const store = createStore(
    allReducers,
    composeWithDevTools(middleWareEnhancer)
  );

  return store;
}
// export * from "./allState/actions";
export * from "./annot/actions";
export * from "./system/actions";
export * from "./player/actions";
export * from "./tree/actions";
export * from "./deeJay/actions";
