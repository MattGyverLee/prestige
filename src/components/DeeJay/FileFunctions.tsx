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
  const allSourceAudio = sourceAudio(state.tree.sourceMedia, true);
  const syncMedia = getSyncMedia();

  const filtered = allSourceAudio.filter(
    (sa: LooseObject) => {
      // Check the filename, not the blob URL (blob URLs are random UUIDs)
      const hasNormalized = sa.name && sa.name.includes("_StandardAudio_Normalized.mp3");

      // If no timeline is selected (syncMedia is empty), just return normalized MP3 files
      if (syncMedia.length === 0) {
        return hasNormalized;
      }

      // If timeline exists, check if the .wav file is in syncMedia
      // Extract base name from the filename
      const wavName = sa.name.substring(0, sa.name.indexOf("_Normalized.mp3")) + ".wav";
      // syncMedia contains file:// URLs, so we need to check if any URL ends with this filename
      const inSync = syncMedia.some((url: string) => {
        const urlFileName = decodeURIComponent(url.substring(url.lastIndexOf("/") + 1));
        return urlFileName === wavName;
      });

      return hasNormalized && inSync;
    }
  );

  return filtered;
}

function findValidAnnotAudio(idx: number): LooseObject[] {
  const state = store.getState();
  const channelName = (idx - 1 ? "Translation" : "Careful") + "_Merged.mp3";
  const allAnnot = annotAudio(
    state.tree.annotMedia,
    true,
    state.annot.currentTimeline,
    state.annot.timeline,
    state.tree.sourceMedia,
  );

  const filtered = allAnnot.filter((aa: LooseObject) =>
    // Use filename instead of blob URL for matching
    aa.name && aa.name.includes(channelName),
  );

  return filtered;
}

export function syncContainsCurrent(currBlob: string): boolean {
  const state = store.getState();
  const syncMedia = getSyncMedia();

  // If no timeline/sync media, return false
  if (syncMedia.length === 0) {
    return false;
  }

  // Find the file object by blobURL to get its name/path
  const sourceMedia = state.tree.sourceMedia;
  const fileObj = sourceMedia.find((f: LooseObject) => f.blobURL === currBlob);

  if (!fileObj || !fileObj.name) {
    return false;
  }

  // Check if any syncMedia URL matches this file's name
  return syncMedia.some((url: string) => {
    const urlFileName = decodeURIComponent(url.substring(url.lastIndexOf("/") + 1));
    return urlFileName === fileObj.name;
  });
}
