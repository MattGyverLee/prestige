import { createStore, combineReducers, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

import { systemReducer } from "./system/reducers";
import { treeReducer } from "./tree/reducers";
import { playerReducer } from "./player/reducers";
import { annotationReducer } from "./annotations/reducers";

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