import { sourceAudio, annotAudio } from "../globalFunctions";
import { LooseObject } from "../../store/annot/types";
import store from "../../store/store";

export function getSyncMedia(): string[] {
  const state = store.getState();
  return state.annot.currentTimeline !== -1
    ? state.annot.timeline[state.annot.currentTimeline].syncMedia
    : [];
}

export function findValidAudio(idx: number): string {
  const audio: LooseObject[] =
    idx === 0 ? findValidSourceAudio() : findValidAnnotAudio(idx);
  return audio.length === 1 ? audio[0].blobURL : "";
}

export function findValidSourceAudio(): LooseObject[] {
  const state = store.getState();
  return sourceAudio(state.tree.sourceMedia, true).filter(
    (sa: LooseObject) =>
      sa.blobURL.includes("_StandardAudio_Normalized.mp3") &&
      getSyncMedia().indexOf(
        sa.blobURL.substring(0, sa.blobURL.indexOf("_Normalized.mp3")) + ".wav"
      ) !== -1
  );
}

function findValidAnnotAudio(idx: number): LooseObject[] {
  const state = store.getState();
  return annotAudio(
    state.tree.annotMedia,
    true,
    state.annot.currentTimeline,
    state.annot.timeline
  ).filter((aa: LooseObject) =>
    aa.blobURL.includes((idx - 1 ? "Translation" : "Careful") + "_Merged.mp3")
  );
}

export function syncContainsCurrent(currBlob: string): boolean {
  return getSyncMedia().filter((s: any) => s === currBlob).length !== 1;
}
