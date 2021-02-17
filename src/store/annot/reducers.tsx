import * as types from "./types";

export const annCleanStore: types.AnnotationState = {
  annotations: [],
  annotationSet: [],
  annotationTable: [
    {
      id: 0,
      startTime: 0,
      txtTransc: "Not Loaded",
    },
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
  timelinesInstantiated: false,
};

export function annotationReducer(
  state = annCleanStore,
  action: types.AnnotationActionTypes
): types.AnnotationState {
  switch (action.type) {
    // case types.HARD_RESET_APP: {
    //   return state;
    // }
    case types.ON_NEW_FOLDER: {
      return { ...state, timelineChanged: true };
    }
    case types.ON_RELOAD_FOLDER: {
      return { ...state, timelineChanged: true };
    }
    case types.SET_URL: {
      return {
        ...state,
        currentTimeline: action.payload.timelineIndex,
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
          instantiated: true,
        };
        return { ...state, timeline: [...state.timeline, timeline] };
      }
      let added = false;
      let milestones = state.timeline[action.payload.idx].milestones.map(
        (m: types.LooseObject) => {
          if (
            m.startTime === action.payload.newMilestone.startTime &&
            m.stopTime === action.payload.newMilestone.stopTime
          ) {
            added = true;
            return {
              ...m,
              data: [...m.data, ...action.payload.newMilestone.data],
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
        ),
      };
    }
    case types.ADD_CATEGORY: {
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    }
    case types.PUSH_ANNOTATION: {
      return {
        ...state,
        annotations: [action.payload],
      };
    }
    case types.PUSH_ANNOTATION_TABLE: {
      return {
        ...state,
        annotationTable: action.payload,
        timelineChanged: false,
      };
    }
    case types.PUSH_TIMELINE: {
      return {
        ...state,
        timeline: state.timeline.concat(action.payload.timeline),
        timelineChanged: true,
      };
    }
    case types.TOGGLE_AUDCAREFUL_MAIN: {
      return {
        ...state,
        audCarefulMain: action.payload || !state.audCarefulMain,
      };
    }
    case types.TOGGLE_AUDTRANSL_MAIN: {
      return {
        ...state,
        audTranslMain: action.payload || !state.audTranslMain,
      };
    }
    case types.TOGGLE_AUDTRANSC_MAIN: {
      return {
        ...state,
        txtTranscMain: action.payload || !state.txtTranscMain,
      };
    }
    case types.TOGGLE_TRANSC_SUB: {
      return {
        ...state,
        txtTranscSubtitle: action.payload || !state.txtTranscSubtitle,
      };
    }
    case types.TOGGLE_TXTTRANSL_MAIN: {
      return {
        ...state,
        txtTranslMain: action.payload || !state.txtTranslMain,
      };
    }
    case types.TOGGLE_AUDTRANSL_SUB: {
      return {
        ...state,
        audTranslMain: action.payload || !state.audTranslMain,
      };
    }
    case types.TOGGLE_META_MAIN: {
      return {
        ...state,
        sayMoreMetaMain: action.payload || !state.sayMoreMetaMain,
      };
    }
    case types.TOGGLE_FILEINFO: {
      return {
        ...state,
        fileInfoMain: action.payload || !state.fileInfoMain,
      };
    }
    case types.FILE_DELETED: {
      const tempTimeline = state.timeline
        .map((t: types.LooseObject) => {
          const tempTimeline = {
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
                  ),
                };
              })
              .filter((m: any) => m.data.length !== 0),
            syncMedia: t.syncMedia.filter((s: any) => s !== action.payload),
          };
          return tempTimeline;
        })
        .filter((t: any) => t.milestones.length !== 0);
      return {
        ...state,
        annotationTable: state.annotationTable.map(
          (annot: types.LooseObject) => {
            if (annot.audCareful === action.payload) {
              return { ...annot, audCareful: "" };
            } else if (annot.audTransl === action.payload) {
              return { ...annot, audTransl: "" };
            }
            return annot;
          }
        ),
        timeline: tempTimeline,
        timelineChanged: true,
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
    case types.LOAD_ANNOT: {
      return { ...action.payload };
    }
    default:
      // console.log("Failed Tree Action", action);
      return state;
  }
}
