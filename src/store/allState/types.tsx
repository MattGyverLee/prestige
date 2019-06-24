import { Folders, TreeState } from "../tree/types";

import { AnnotationState } from "../annotations/types";
import { MediaPlayerState } from "../player/types";
import { SystemState } from "../system/types";

export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const TEMP_INIT = "TEMP_INIT";
export const HARD_RESET_APP = "HARD_RESET_APP";

export interface OverState {
  name: "Prestige";
  system?: SystemState;
  player?: MediaPlayerState;
  annotation?: AnnotationState;
  tree?: TreeState;
}

interface onNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: string;
}
interface tempInit {
  type: typeof TEMP_INIT;
  payload: string;
}
interface hardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

export type OverActionTypes = onNewFolder | tempInit | hardResetApp;
