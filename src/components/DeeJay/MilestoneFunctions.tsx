import { LooseObject, Milestone } from "../../store/annot/types";
import store from "../../store/store";
import { DeeJayDispatch } from "../../store/deeJay/types";

// Returns the Milestone Containing the Given Time and Possibly a Specific Data Element
export function getInterMilestone(time: number, wsNum?: number): number {
  const state = store.getState();
  return state.annot.currentTimeline === -1
    ? -1
    : state.annot.timeline[state.annot.currentTimeline].milestones
        .filter((m: any) => {
          return m.startTime <= time && time < m.stopTime;
        })
        .map((m: Milestone) => {
          return {
            ...m,
            data: m.data.filter(
              (d: LooseObject) =>
                wsNum === 0 ||
                d.channel === `${wsNum === 1 ? "Careful" : "Translation"}Merged`
            ),
          };
        })[0];
}

// Finds the Index of the Milestone After the One Provided
export function findNextMilestoneIndex(milestone: any): number {
  const state = store.getState();

  return state.annot.currentTimeline === -1
    ? -1
    : state.annot.timeline[state.annot.currentTimeline].milestones.findIndex(
        (m: any) => m.startTime === milestone.startTime
      );
}

// Finds the Index of the Last Milestone of a Particular Type
export function findLastMilestoneIndex(wsNum: number): number {
  const state = store.getState();
  if (state.annot.currentTimeline === -1) return -1;
  const milestones =
    state.annot.timeline[state.annot.currentTimeline].milestones;
  return wsNum === 0
    ? milestones.length - 1
    : milestones
        .map((m: any, idx: number) =>
          m.data.findIndex(
            (d: any) =>
              d.channel === `${wsNum === 1 ? "Careful" : "Translation"}Merged`
          ) === -1
            ? 0
            : idx
        )
        .reduce((a: number, b: number) => (a > b ? a : b), 0);
}

// Fetches the Current Milestone of the Specified WS
export function getCurrentMilestone(
  wsNum: number,
  currTime: number,
  dispatch: DeeJayDispatch = { dispatchType: "" },
  filter?: number
) {
  const state = store.getState();
  if (!filter) filter = wsNum;
  if (state.annot.currentTimeline === -1) return -1;
  const channel = `${filter === 1 ? "Careful" : "Translation"}Merged`;
  return state.annot.timeline[state.annot.currentTimeline].milestones
    .filter((m: Milestone) => {
      return wsNum === 0
        ? dispatch.dispatchType !== ""
          ? m.startTime === dispatch.clipStart &&
            m.stopTime === dispatch.clipStop
          : m.startTime <= currTime && currTime < m.stopTime
        : m.data.filter((d: LooseObject) => {
            return (
              d.channel === channel &&
              (dispatch.dispatchType !== ""
                ? d.clipStart === dispatch.clipStart &&
                  d.clipStop === dispatch.clipStop
                : d.clipStart <= currTime && currTime < d.clipStop)
            );
          }).length === 1;
    })
    .map((m: Milestone) => {
      return {
        ...m,
        data: m.data.filter(
          (d: LooseObject) =>
            (filter === 0 && wsNum === 0) || d.channel === channel
        ),
      };
    })[0];
}

// Fetches the Current Milestone of the Specified WS
export function getFirstMilestone(wsNum: number, filter?: number) {
  const state = store.getState();
  if (!filter) filter = wsNum;
  if (state.annot.currentTimeline === -1) return -1;
  const channel = `${filter === 1 ? "Careful" : "Translation"}Merged`;
  return state.annot.timeline[state.annot.currentTimeline].milestones.map(
    (m: Milestone) => {
      return {
        ...m,
        data: m.data.filter(
          (d: LooseObject) =>
            (filter === 0 && wsNum === 0) || d.channel === channel
        ),
      };
    }
  )[0];
}

export function getSubtitle(targetAnnotationID: string, mode: number): string {
  const state = store.getState();
  if (state.annot.currentTimeline === -1) return "";
  let result = "";
  const ms = state.annot.timeline[
    state.annot.currentTimeline
  ].milestones.filter((m: Milestone) => {
    return m.annotationID === targetAnnotationID ? true : false;
  });
  if (mode <= 1) {
    if (ms[0].data[0].channel === "Transcription") {
      result = ms[0].data[0].data;
    }
  } else {
    if (ms[0].data[1].channel === "Translation") {
      result = ms[0].data[1].data;
    }
  }
  if (result === undefined || result === null || result === "%ignore%") {
    result = "";
  }
  return result;
}
