import { configureStore as toolkitConfigureStore } from "@reduxjs/toolkit";
import { annCleanStore, annotationReducer } from "./annot/reducers";
import { deeJayCleanStore, deeJayReducer } from "./deeJay/reducers";
import { playerCleanStore, playerReducer } from "./player/reducers";
import { treeCleanStore, treeReducer } from "./tree/reducers";
import { systemReducer } from "./system/reducers";

// Root reducer with reset logic
const rootReducer = (state: any, action: any) => {
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

  return {
    system: systemReducer(state?.system, action),
    tree: treeReducer(state?.tree, action),
    player: playerReducer(state?.player, action),
    deeJay: deeJayReducer(state?.deeJay, action),
    annot: annotationReducer(state?.annot, action),
  };
};

export type StateProps = ReturnType<typeof rootReducer>;

export default function configureStore() {
  const store = toolkitConfigureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable if you have non-serializable data
      }),
    devTools: process.env.NODE_ENV !== "production",
  });

  return store;
}
// export * from "./allState/actions";
export * from "./annot/actions";
export * from "./system/actions";
export * from "./player/actions";
export * from "./tree/actions";
export * from "./deeJay/actions";
