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

  console.log("[findValidSourceAudio] All source audio:", allSourceAudio.map(sa => `${sa.name} -> ${sa.blobURL}`));
  console.log("[findValidSourceAudio] Sync media:", syncMedia);

  const filtered = allSourceAudio.filter(
    (sa: LooseObject) => {
      // Check the filename, not the blob URL (blob URLs are random UUIDs)
      const hasNormalized = sa.name && sa.name.includes("_StandardAudio_Normalized.mp3");

      // If no timeline is selected (syncMedia is empty), just return normalized MP3 files
      if (syncMedia.length === 0) {
        console.log("[findValidSourceAudio] No timeline - checking for normalized MP3:", {
          name: sa.name,
          blobURL: sa.blobURL,
          hasNormalized,
          passes: hasNormalized
        });
        return hasNormalized;
      }

      // If timeline exists, check if the .wav file is in syncMedia
      // Extract base name from the filename
      const wavName = sa.name.substring(0, sa.name.indexOf("_Normalized.mp3")) + ".wav";
      const inSync = syncMedia.indexOf(wavName) !== -1;

      console.log("[findValidSourceAudio] Timeline exists - checking:", {
        name: sa.name,
        blobURL: sa.blobURL,
        hasNormalized,
        wavName,
        inSync,
        passes: hasNormalized && inSync
      });

      return hasNormalized && inSync;
    }
  );

  console.log("[findValidSourceAudio] Filtered result:", filtered.length, filtered.map(f => `${f.name} -> ${f.blobURL}`));
  return filtered;
}

function findValidAnnotAudio(idx: number): LooseObject[] {
  const state = store.getState();
  return annotAudio(
    state.tree.annotMedia,
    true,
    state.annot.currentTimeline,
    state.annot.timeline,
  ).filter((aa: LooseObject) =>
    // Use filename instead of blob URL for matching
    aa.name && aa.name.includes((idx - 1 ? "Translation" : "Careful") + "_Merged.mp3"),
  );
}

export function syncContainsCurrent(currBlob: string): boolean {
  return getSyncMedia().filter((s: any) => s === currBlob).length !== 1;
}
