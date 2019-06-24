import * as types from "./types";

import { annCleanStore } from "../annotations/reducers";
import { playerCleanStore } from "../player/reducers";
import { systemCleanStore } from "../system/reducers";
import { treeCleanStore } from "../tree/reducers";

var emptyOverState: types.OverState = {
  name: "Prestige",
  system: undefined,
  tree: undefined,
  player: undefined,
  annotation: undefined
};
// Using a dummy property so that the rest can be undefined.
const initialOverState: types.OverState = {
  name: "Prestige",
  system: { ...systemCleanStore },
  tree: { ...treeCleanStore },
  player: { ...playerCleanStore },
  annotation: { ...annCleanStore }
};

export const rootReducer = (
  state: types.OverState = initialOverState,
  action: types.OverActionTypes
) => {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = emptyOverState;
      return {
        emptyOverState
      };
    }
    case types.ON_NEW_FOLDER: {
      let tempState = initialOverState;
      return {
        ...tempState,
        tree: { ...tempState.tree, folderPath: action.payload }
      };
    }
    default:
      return state;
  }
};
