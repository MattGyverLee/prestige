import { applyMiddleware, combineReducers, createStore } from "redux";

import { annotationReducer } from "./annot/reducers";
import { composeWithDevTools } from "redux-devtools-extension";
import { deeJayReducer } from "./deeJay/reducers";
import { playerReducer } from "./player/reducers";
import { systemReducer } from "./system/reducers";
import thunkMiddleware from "redux-thunk";
import { treeReducer } from "./tree/reducers";

// These are intentionally ordered
export const allReducers = combineReducers({
  system: systemReducer,
  tree: treeReducer,
  player: playerReducer,
  deeJay: deeJayReducer,
  annot: annotationReducer
});

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
