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
  annotationRef: string;
  data: {
    channel: string;
    data: any;
    linguisticType: string;
    locale: string;
    mimeType: string;
  }[];
  startTime: number;
  stopTime: number;
}

export interface AnnotationState {
  annotations: any[];
  annotationSet: any[];
  annotationTable: any[];
  audCarefulMain: boolean;
  audTranslMain: boolean;
  categories: string[];
  fileInfoMain: boolean;
  sayMoreMetaMain: boolean;
  timeline: LooseObject[];
  currentTimeline: number;
  prevTimeline: number;
  txtTranscMain: boolean;
  txtTranscSubtitle: boolean;
  txtTranslMain: boolean;
  txtTranslSubtitle: boolean;
}

// Describing the different ACTION NAMES available
export const ADD_ANNOTATIONSET = "ADD_ANNOTATIONSET";
export const ADD_ORAL_ANNOTATION = "ADD_ORAL_ANNOTATION";
export const ADD_CATEGORY = "ADD_CATEGORY";
export const DISABLE_AUDCAREFUL_MAIN = "DISABLE_AUDCAREFUL_MAIN";
export const DISABLE_AUDTRANSC_MAIN = "DISABLE_AUDTRANSC_MAIN";
export const DISABLE_AUDTRANSL_MAIN = "DISABLE_AUDTRANSL_MAIN";
export const DISABLE_AUDTRANSL_SUB = "DISABLE_AUDTRANSL_SUB";
export const DISABLE_FILEINFO = "DISABLE_FILEINFO";
export const DISABLE_META_MAIN = "DISABLE_META_MAIN";
export const DISABLE_TRANSC_SUB = "DISABLE_TRANSC_SUB";
export const DISABLE_TXTTRANSL_MAIN = "DISABLE_TXTTRANSL_MAIN";
export const ENABLE_AUDCAREFUL_MAIN = "ENABLE_AUDCAREFUL_MAIN";
export const ENABLE_AUDTRANSC_MAIN = "ENABLE_AUDTRANSC_MAIN";
export const ENABLE_AUDTRANSL_MAIN = "ENABLE_AUDTRANSL_MAIN";
export const ENABLE_FILEINFO = "ENABLE_FILEINFO";
export const ENABLE_META_MAIN = "ENABLE_META_MAIN";
export const ENABLE_TRANSC_SUB = "ENABLE_TRANSC_SUB";
export const ENABLE_TXTTRANSL_MAIN = "ENABLE_TXTTRANSL_MAIN";
export const ENABLE_AUDTRANSL_SUB = "ENABLE_AUDTRANSL_SUB";
export const PUSH_ANNOTATION = "REMOVE_ANNOTATION";
export const PUSH_TIMELINE = "PUSH_TIMELINE";
export const PUSH_ANNOTATION_TABLE = "PUSH_ANNOTATION_TABLE";
export const PUSH_WHICH_TIMELINE = "PUSH_WHICH_TIMELINE";
export const REMOVE_ANNOTATION = "REMOVE_ANNOTATION";
export const REMOVE_ANNOTATIONSET = "REMOVE_ANNOTATIONSET";
export const RESET_ANNOTATION_SESSION = "RESET_ANNOTATION_SESSION";
export const UPDATE_ANNOTATION = "UPDATE_ANNOTATION";
export const UPDATE_ANNOTATIONSET = "UPDATE_ANNOTATIONSET";
export const WIPE_ANNOTATION_SESSION = "WIPE_ANNOTATION_SESSION";
export const HARD_RESET_APP = "HARD_RESET_APP";
export const ON_NEW_FOLDER = "ON_NEW_FOLDER";
export const SET_URL = "SET_URL";
export const FILE_DELETED = "FILE_DELETED";
export const UPDATE_PREV_TIMELINE = "UPDATE_PREV_TIMELINE";

interface HardResetApp {
  type: typeof HARD_RESET_APP;
  payload: string;
}

interface OnNewFolder {
  type: typeof ON_NEW_FOLDER;
  payload: { inString: string; blobURL?: string };
}

interface ResetAnnotationAction {
  type: typeof RESET_ANNOTATION_SESSION;
  payload: AnnotationState;
}

interface WipeAnnotationAction {
  type: typeof WIPE_ANNOTATION_SESSION;
  payload: AnnotationState;
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
interface PushWhichTimeline {
  type: typeof PUSH_WHICH_TIMELINE;
  payload: LooseObject;
}
interface PushTimeline {
  type: typeof PUSH_TIMELINE;
  payload: LooseObject;
}
interface AddCategory {
  type: typeof ADD_CATEGORY;
  payload: string;
}
interface UpdateAnnotation {
  type: typeof UPDATE_ANNOTATION;
  payload: AnnotationState;
}
interface RemoveAnnotation {
  type: typeof REMOVE_ANNOTATION;
  payload: AnnotationState;
}
interface AddAnnotationset {
  type: typeof ADD_ANNOTATIONSET;
  payload: AnnotationState;
}
interface UpdateAnnotationset {
  type: typeof UPDATE_ANNOTATIONSET;
  payload: AnnotationState;
}
interface RemoveAnnotationset {
  type: typeof REMOVE_ANNOTATIONSET;
  payload: AnnotationState;
}
interface EnableAudcarefulMain {
  type: typeof ENABLE_AUDCAREFUL_MAIN;
}
interface DisableAudcarefulMain {
  type: typeof DISABLE_AUDCAREFUL_MAIN;
}
interface EnableAudtranslMain {
  type: typeof ENABLE_AUDTRANSL_MAIN;
}
interface DisableAudtranslMain {
  type: typeof DISABLE_AUDTRANSL_MAIN;
}
interface EnableAudtranscMain {
  type: typeof ENABLE_AUDTRANSC_MAIN;
}
interface DisableAudtranscMain {
  type: typeof DISABLE_AUDTRANSC_MAIN;
}
interface EnableTranscSub {
  type: typeof ENABLE_TRANSC_SUB;
}
interface DisableTranscSub {
  type: typeof DISABLE_TRANSC_SUB;
}
interface EnableTxttranslMain {
  type: typeof ENABLE_TXTTRANSL_MAIN;
}
interface DisableTxttranslMain {
  type: typeof DISABLE_TXTTRANSL_MAIN;
}
interface EnableAudtranslSub {
  type: typeof ENABLE_AUDTRANSL_SUB;
}
interface DisableAudtranslSub {
  type: typeof DISABLE_AUDTRANSL_SUB;
}
interface EnableMetaMain {
  type: typeof ENABLE_META_MAIN;
}
interface DisableMetaMain {
  type: typeof DISABLE_META_MAIN;
}
interface EnableFileinfo {
  type: typeof ENABLE_FILEINFO;
}
interface DisableFileinfo {
  type: typeof DISABLE_FILEINFO;
}
interface SetURL {
  type: typeof SET_URL;
  payload: string;
}
interface FileDeleted {
  type: typeof FILE_DELETED;
  payload: string;
}
interface UpdatePrevTimeline {
  type: typeof UPDATE_PREV_TIMELINE;
  payload: number;
}

export type AnnotationActionTypes =
  | AddOralAnnotation
  | AddAnnotationset
  | AddCategory
  | DisableAudcarefulMain
  | DisableAudtranscMain
  | DisableAudtranslMain
  | DisableAudtranslSub
  | DisableFileinfo
  | DisableMetaMain
  | DisableTranscSub
  | DisableTxttranslMain
  | EnableAudcarefulMain
  | EnableAudtranscMain
  | EnableAudtranslMain
  | EnableAudtranslSub
  | EnableFileinfo
  | EnableMetaMain
  | EnableTranscSub
  | EnableTxttranslMain
  | PushAnnotation
  | PushAnnotationTable
  | PushTimeline
  | PushWhichTimeline
  | RemoveAnnotation
  | RemoveAnnotationset
  | ResetAnnotationAction
  | UpdateAnnotation
  | UpdateAnnotationset
  | WipeAnnotationAction
  | HardResetApp
  | OnNewFolder
  | SetURL
  | FileDeleted
  | UpdatePrevTimeline;
