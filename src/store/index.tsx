import { annCleanStore, annotationReducer } from "./annot/reducers";
import { combineReducers, createStore } from "redux";
import { deeJayCleanStore, deeJayReducer } from "./deeJay/reducers";
import { playerCleanStore, playerReducer } from "./player/reducers";
import { treeCleanStore, treeReducer } from "./tree/reducers";

// import { composeWithDevTools } from "redux-devtools-extension";
import { systemReducer } from "./system/reducers";
// import thunkMiddleware from "redux-thunk";

// These are intentionally ordered
export const appReducer = combineReducers({
  system: systemReducer,
  tree: treeReducer,
  player: playerReducer,
  deeJay: deeJayReducer,
  annot: annotationReducer,
});

const allReducers = (state: any, action: any) => {
  if (
    action.type === "ON_NEW_FOLDER" ||
    action.types === "ON_RELOAD_FOLDER" ||
    action.type === "HARD_RESET_APP"
  ) {
    state = {
      ...state,
      tree: treeCleanStore,
      annot: annCleanStore,
      deeJay: deeJayCleanStore,
      player: playerCleanStore,
    };
  } else if (action.type === "RESET_DEE_JAY") {
    state = {
      ...state,
      deeJay: deeJayCleanStore,
    };
  }
  return appReducer(state, action);
};

export type StateProps = ReturnType<typeof allReducers>;

export default function configureStore() {
  // const middlewares = [thunkMiddleware];
  // const middleWareEnhancer = applyMiddleware(...middlewares);

  const store = createStore(
    allReducers
    // composeWithDevTools(middleWareEnhancer)
  );

  return store;
}
// export * from "./allState/actions";
export * from "./annot/actions";
export * from "./system/actions";
export * from "./player/actions";
export * from "./tree/actions";
export * from "./deeJay/actions";
