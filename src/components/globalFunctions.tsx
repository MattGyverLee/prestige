import { LooseObject } from "../store/annot/types";
import { electronAPI } from "../utils/electronAPI";

interface tempTimeline {
  syncMedia: string[];
  idx: number;
}

export function getTimelineIndex(timelines: any, blobURL: string): number {
  if (
    blobURL === undefined ||
    blobURL === null ||
    blobURL === "" ||
    timelines.length === 0
  ) {
    return -1;
  }
  const temp = timelines.map((t: LooseObject, idx: number) => {
    const x: tempTimeline = { syncMedia: t.syncMedia, idx };
    return x;
  });
  for (let i = 0, l = temp.length; i < l; i++) {
    for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
      if (temp[i].syncMedia[j] === blobURL) return temp[i].idx;
    }
  }
  for (let i = 0, l = timelines.length; i < l; i++) {
    if (
      timelines[i].eafFile.includes(
        blobURL.substring(0, blobURL.lastIndexOf(".")),
      )
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Parse a file path in a safe, cross-platform way
 * This now uses the secure Electron API
 */
export async function safeParse(inPath: string): Promise<any> {
  // Use the secure Electron API
  return await electronAPI.parsePath(inPath);
}

/**
 * Synchronous version for backward compatibility (uses legacy require)
 * TODO: Remove this once all callers are updated to use async version
 */
export function safeParseSync(inPath: string): any {
  const pathParse = require("path-parse");
  return pathParse(inPath);
}

// allOrViewer: True -> All, False -> Filtered
export function getSourceMedia(
  sourceMedia: LooseObject[],
  allOrViewer: boolean,
): LooseObject[] {
  const sourceVids = sourceMedia
    .filter((file) => !file.isAnnotation && file.mimeType.startsWith("video"))
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );
  const mp3s: string[] = [];
  const sourceAud = sourceAudio(sourceMedia, allOrViewer)
    .filter((sa: any) => {
      const parsedPath = safeParseSync(sa.path);
      if (parsedPath.ext.toLowerCase() === ".mp3") mp3s.push(parsedPath.name);
      for (let i = 0, l = sourceVids.length; i < l; i++) {
        if (
          parsedPath.name ===
          safeParseSync(sourceVids[i].path).name + "_StandardAudio"
        ) {
          return false;
        }
      }
      return !parsedPath.base.endsWith("_StandardAudio_Normalized.mp3");
    })
    .filter((sa: any) => {
      const parsedPath = safeParseSync(sa.path);
      return !(
        mp3s.indexOf(parsedPath.name) !== -1 &&
        parsedPath.ext.toLowerCase() === ".wav"
      );
    });
  return [...sourceVids, ...sourceAud];
}

export function sourceAudio(
  sourceMedia: LooseObject[],
  allOrViewer: boolean,
): LooseObject[] {
  const sourceAud = sourceMedia
    .filter(
      (file) =>
        !file.isAnnotation &&
        file.mimeType.startsWith("audio") &&
        (!file.isMerged || allOrViewer),
    )
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );
  return [...sourceAud];
}

export function annotAudio(
  annotMedia: LooseObject[],
  splitOrMerged: boolean,
  timelineIdx: number,
  timelines: any[],
  // true: merged only, false: split only
): LooseObject[] {
  const annotAud = annotMedia
    .filter(
      (file) =>
        file.isAnnotation &&
        file.mimeType.startsWith("audio") &&
        (splitOrMerged ? file.isMerged : !file.isMerged) &&
        getTimelineIndex(
          timelines,
          file.blobURL.substring(0, file.blobURL.indexOf("_Annotations")),
        ) === timelineIdx,
    )
    .sort((a: LooseObject, b: LooseObject) =>
      sortName(a.name.toLowerCase(), b.name.toLowerCase()),
    );
  return [...annotAud];
}

function sortName(a: string, b: string): number {
  if (a < b) return -1;
  else if (a > b) return 1;
  else return 0;
}

export function roundIt(value: number, decimals: number): number {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
}
