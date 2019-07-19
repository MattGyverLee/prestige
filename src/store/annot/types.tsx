export interface LooseObject extends Object {
  [key: string]: any;
}

export interface AnnotationRow {
  id: number;
  startTime: number;
  stopTime: number;
  audCareful: string;
  audTransl: string;
  txtTransc: string;
  txtTransl: string;
}

export interface Milestone {
  annotationID: string;
  data: {
    channel: string;
    data: any;
    linguisticType: string;
    locale: string;
    mimeType: string;
    clipStart?: number;
    clipStop?: number;
    duration?: number;
  }[];
  startTime: number;
  stopTime: number;
}

export interface AnnotationState {
  annotationSet: any[];
  annotationTable: any[];
  annotations: any[];
  audCarefulMain: boolean;
  audTranslMain: boolean;
  categories: string[];
  currentTimeline: number;
  fileInfoMain: boolean;
  prevTimeline: number;
  sayMoreMetaMain: boolean;
  timeline: LooseObject[];
  timelineChanged: boolean;
  timelinesInstantiated: boolean;
  txtTranscMain: boolean;
  txtTranscSubtitle: boolean;
  txtTranslMain: boolean;
  txtTranslSubtitle: boolean;
}

// Describing the different ACTION NAMES available
export const ADD_CATEGORY = "ADD_CATEGORY";
export const ADD_ORAL_ANNOTATION = "ADD_ORAL_ANNOTATION";
export const FILE_DELETED = "FILE_DELETED";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const LOAD_ANNOT = "LOAD_ANNOT";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const ON_RELOAD_FOLDER = "ON_RELOAD_FOLDER";
export const PUSH_ANNOTATION = "REMOVE_ANNOTATION";
export const PUSH_ANNOTATION_TABLE = "PUSH_ANNOTATION_TABLE";
export const PUSH_TIMELINE = "PUSH_TIMELINE";
export const RESET_ANNOTATION_SESSION = "RESET_ANNOTATION_SESSION";
export const SET_TIMELINES_INSTANTIATED = "SET_TIMELINES_INSTANTIATED";
export const SET_TIMELINE_CHANGED = "SET_TIMELINE_CHANGED";
export const SET_URL = "SET_URL";
export const TOGGLE_AUDCAREFUL_MAIN = "TOGGLE_AUDCAREFUL_MAIN";
export const TOGGLE_AUDTRANSC_MAIN = "TOGGLE_AUDTRANSC_MAIN";
export const TOGGLE_AUDTRANSL_MAIN = "TOGGLE_AUDTRANSL_MAIN";
export const TOGGLE_AUDTRANSL_SUB = "TOGGLE_AUDTRANSL_SUB";
export const TOGGLE_FILEINFO = "TOGGLE_FILEINFO";
export const TOGGLE_META_MAIN = "TOGGLE_META_MAIN";
export const TOGGLE_TRANSC_SUB = "DISABLE_TRANSC_SUB";
export const TOGGLE_TXTTRANSL_MAIN = "TOGGLE_TXTTRANSL_MAIN";
export const UPDATE_PREV_TIMELINE = "UPDATE_PREV_TIMELINE";

interface LoadAnnot {
  type: typeof LOAD_ANNOT;
  payload: AnnotationState;
}

interface HardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface OnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { inString: string; blobURL?: string };
}

interface OnReloadFolder {
  type: typeof ON_RELOAD_FOLDER;
  payload: { inString: string; blobURL?: string };
}

interface AddOralAnnotation {
  type: typeof ADD_ORAL_ANNOTATION;
  payload: LooseObject;
}

interface PushAnnotation {
  type: typeof PUSH_ANNOTATION;
  payload: Milestone[];
}

interface PushAnnotationTable {
  type: typeof PUSH_ANNOTATION_TABLE;
  payload: AnnotationRow[];
}

interface PushTimeline {
  type: typeof PUSH_TIMELINE;
  payload: LooseObject;
}

interface AddCategory {
  type: typeof ADD_CATEGORY;
  payload: string;
}

interface ToggleAudcarefulMain {
  type: typeof TOGGLE_AUDCAREFUL_MAIN;
  payload?: boolean;
}

interface ToggleAudtranslMain {
  type: typeof TOGGLE_AUDTRANSL_MAIN;
  payload?: boolean;
}

interface ToggleAudtranscMain {
  type: typeof TOGGLE_AUDTRANSC_MAIN;
  payload?: boolean;
}

interface ToggleTranscSub {
  type: typeof TOGGLE_TRANSC_SUB;
  payload?: boolean;
}

interface ToggleTxttranslMain {
  type: typeof TOGGLE_TXTTRANSL_MAIN;
  payload?: boolean;
}

interface ToggleAudtranslSub {
  type: typeof TOGGLE_AUDTRANSL_SUB;
  payload?: boolean;
}

interface ToggleMetaMain {
  type: typeof TOGGLE_META_MAIN;
  payload?: boolean;
}

interface ToggleFileinfo {
  type: typeof TOGGLE_FILEINFO;
  payload?: boolean;
}

interface SetURL {
  type: typeof SET_URL;
  payload: { blobURL: string; timelineIndex: number };
}

interface FileDeleted {
  type: typeof FILE_DELETED;
  payload: string;
}

interface UpdatePrevTimeline {
  type: typeof UPDATE_PREV_TIMELINE;
  payload: number;
}

interface SetTimelinesInstantiated {
  type: typeof SET_TIMELINES_INSTANTIATED;
  payload: boolean;
}

interface SetTimelineChanged {
  type: typeof SET_TIMELINE_CHANGED;
  payload: boolean;
}

export type AnnotationActionTypes =
  | AddCategory
  | AddOralAnnotation
  | FileDeleted
  | HardResetApp
  | LoadAnnot
  | OnNewFolder
  | OnReloadFolder
  | PushAnnotation
  | PushAnnotationTable
  | PushTimeline
  | SetTimelineChanged
  | SetTimelinesInstantiated
  | SetURL
  | ToggleAudcarefulMain
  | ToggleAudtranscMain
  | ToggleAudtranslMain
  | ToggleAudtranslSub
  | ToggleFileinfo
  | ToggleMetaMain
  | ToggleTranscSub
  | ToggleTxttranslMain
  | UpdatePrevTimeline;
