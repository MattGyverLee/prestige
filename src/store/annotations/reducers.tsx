import * as types from "./types";

import { getTimelineIndex } from "../../model/globalFunctions";

export const annCleanStore: types.AnnotationState = {
  annotations: [],
  annotationSet: [],
  annotationTable: [
    {
      id: 0,
      startTime: 0,
      txtTransc: "Not Loaded"
    }
  ],
  audCarefulMain: false,
  audTranslMain: false,
  categories: [],
  fileInfoMain: false,
  sayMoreMetaMain: false,
  timeline: [],
  currentTimeline: -1,
  prevTimeline: -1,
  txtTranscMain: false,
  txtTranscSubtitle: false,
  txtTranslMain: false,
  txtTranslSubtitle: false,
  timelineChanged: false,
  timelinesInstantiated: false
};

export function annotationReducer(
  state = annCleanStore,
  action: types.AnnotationActionTypes
): types.AnnotationState {
  switch (action.type) {
    case types.HARD_RESET_APP: {
      state = annCleanStore;
      return state;
    }
    case types.ON_NEW_FOLDER: {
      state = annCleanStore;
      return state;
    }
    case types.ON_RELOAD_FOLDER: {
      state = annCleanStore;
      return { ...state, timelineChanged: true };
    }
    case types.SET_URL: {
      const idx = getTimelineIndex(state.timeline, action.payload);
      return {
        ...state,
        currentTimeline: idx
      };
    }
    case types.ADD_ORAL_ANNOTATION: {
      if (action.payload.idx === -1) {
        let eafFile = action.payload.newMilestone.data[0].data;
        eafFile = eafFile.substring(0, eafFile.indexOf("_Annotations"));
        const syncMedia = eafFile;
        eafFile = eafFile.substring(0, eafFile.lastIndexOf(".")) + ".eaf";
        const timeline: types.LooseObject = {
          milestones: [action.payload.newMilestone],
          eafFile: eafFile,
          syncMedia: [syncMedia],
          instantiated: true
        };
        return { ...state, timeline: [...state.timeline, timeline] };
      }
      let added: boolean = false;
      let milestones = state.timeline[action.payload.idx].milestones.map(
        (m: types.LooseObject) => {
          if (
            m.startTime === action.payload.newMilestone.startTime &&
            m.stopTime === action.payload.newMilestone.stopTime
          ) {
            added = true;
            return {
              ...m,
              data: [...m.data, ...action.payload.newMilestone.data]
            };
          } else {
            return m;
          }
        }
      );
      const newM = action.payload.newMilestone;
      if (!added) {
        milestones = [...milestones, newM];
      }
      return {
        ...state,
        timeline: state.timeline.map((t: types.LooseObject, i: number) =>
          i === action.payload.idx ? { ...t, milestones } : t
        )
      };
    }
    case types.ADD_CATEGORY: {
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    }
    case types.PUSH_ANNOTATION: {
      return {
        ...state,
        annotations: [action.payload]
      };
    }
    case types.PUSH_ANNOTATION_TABLE: {
      return {
        ...state,
        annotationTable: action.payload,
        timelineChanged: false
      };
    }
    case types.PUSH_TIMELINE: {
      return {
        ...state,
        timeline: state.timeline.concat(action.payload.timeline),
        timelineChanged: true
      };
    }
    case types.ENABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_AUDCAREFUL_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTranslMain: true
      };
    }
    case types.DISABLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTranslMain: false
      };
    }
    case types.ENABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTranscMain: true
      };
    }
    case types.DISABLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTranscMain: false
      };
    }
    case types.ENABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case types.DISABLE_TRANSC_SUB: {
      return {
        ...state
      };
    }
    case types.ENABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_TXTTRANSL_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case types.DISABLE_AUDTRANSL_SUB: {
      return {
        ...state
      };
    }
    case types.ENABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case types.DISABLE_META_MAIN: {
      return {
        ...state
      };
    }
    case types.ENABLE_FILEINFO: {
      return {
        ...state
      };
    }
    case types.DISABLE_FILEINFO: {
      return {
        ...state
      };
    }
    case types.FILE_DELETED: {
      const tempTimeline = state.timeline
        .map(t => {
          let tempTimeline = {
            ...t,
            milestones: t.milestones
              .map((m: any) => {
                return {
                  ...m,
                  data: m.data.filter(
                    (md: any) =>
                      md.data !== action.payload &&
                      !(
                        t.eafFile === action.payload &&
                        !md.data.startsWith("file:///")
                      )
                  )
                };
              })
              .filter((m: any) => m.data.length !== 0),
            syncMedia: t.syncMedia.filter((s: any) => s !== action.payload)
          };
          return tempTimeline;
        })
        .filter((t: any) => t.milestones.length !== 0);
      return {
        ...state,
        annotationTable: state.annotationTable.map(annot => {
          if (annot.audCareful === action.payload) {
            return { ...annot, audCareful: "" };
          } else if (annot.audTransl === action.payload) {
            return { ...annot, audTransl: "" };
          }
          return annot;
        }),
        timeline: tempTimeline,
        timelineChanged: true
      };
    }
    case types.UPDATE_PREV_TIMELINE: {
      return { ...state, prevTimeline: action.payload, timelineChanged: false };
    }
    case types.SET_TIMELINES_INSTANTIATED: {
      return { ...state, timelinesInstantiated: action.payload };
    }
    case types.SET_TIMELINE_CHANGED: {
      return { ...state, timelineChanged: action.payload };
    }
    default:
      // console.log("Failed Tree Action", action);
      return state;
  }
}
