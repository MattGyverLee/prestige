import { applyMiddleware, combineReducers, createStore } from "redux";

import { annotationReducer } from "./annotations/reducers";
import { composeWithDevTools } from "redux-devtools-extension";
import { playerReducer } from "./player/reducers";
import { systemReducer } from "./system/reducers";
import thunkMiddleware from "redux-thunk";
import { treeReducer } from "./tree/reducers";

const rootReducer = combineReducers({
  system: systemReducer,
  tree: treeReducer,
  player: playerReducer,
  annotations: annotationReducer
});

export type AppState = ReturnType<typeof rootReducer>;

export default function configureStore() {
  const middlewares = [thunkMiddleware];
  const middleWareEnhancer = applyMiddleware(...middlewares);

  const store = createStore(
    rootReducer,
    composeWithDevTools(middleWareEnhancer)
  );

  return store;
}
export * from "./annotations/actions";
export * from "./system/actions";
export * from "./player/actions";
export * from "./tree/actions";
