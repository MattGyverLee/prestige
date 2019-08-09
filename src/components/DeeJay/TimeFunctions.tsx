import { DeeJayDispatch } from "../../store/deeJay/types";
import { roundIt } from "../globalFunctions";

// Gets the Desired StartTime, StopTime, ClipStart, or ClipStop of the Milestone According to WS Idx
export function clipTime(
  idx: number,
  milestone: any,
  startOrStop: boolean
): number {
  return idx === 0
    ? startOrStop
      ? milestone.startTime
      : milestone.stopTime
    : startOrStop
    ? milestone.data[0].clipStart
    : milestone.data[0].clipStop;
}

// Calculates PlaybackRate for Source/Video Based on Milestone or Milestone and Dispatch
export function calcPlaybackRate(
  milestone: any,
  dispatch?: DeeJayDispatch,
  dispatch2?: DeeJayDispatch
): number {
  const playbackRate =
    ((dispatch2 ? dispatch2.clipStop : milestone.stopTime) -
      (dispatch2 ? dispatch2.clipStart : milestone.startTime)) /
    ((dispatch ? dispatch.clipStop : milestone.data[0].clipStop) -
      (dispatch ? dispatch.clipStart : milestone.data[0].clipStart));
  return playbackRate >= 15 ? 14.5 : playbackRate <= 0.2 ? 0.2 : playbackRate;
}

// Calculates Relative Time for Source/Video Based on a WS, Milestone, and PlaybackRate
export function calcRelativeTime(
  currTime1: number,
  clipStart1: number,
  duration: number,
  playbackRate: number,
  clipStart2: number
): number {
  return roundIt(
    ((currTime1 - clipStart1) * playbackRate + clipStart2) / duration,
    3
  );
}
