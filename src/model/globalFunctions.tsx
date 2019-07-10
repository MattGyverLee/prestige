import { LooseObject } from "../store/annotations/types";

interface tempTimeline {
  syncMedia: string[];
  idx: number;
}

export function getTimelineIndex(timelines: any, blobURL: string): number {
  if (blobURL === undefined || blobURL === null || blobURL === "") {
    return -1;
  }
  let temp = timelines.map((t: LooseObject, idx: number) => {
    let syncMedia = t["syncMedia"];
    let x: tempTimeline = { syncMedia, idx };
    return x;
  });
  let i, j;
  for (i = 0; i < temp.length; i++) {
    for (j = 0; j < temp[i].syncMedia.length; j++) {
      if (temp[i].syncMedia[j] === blobURL) {
        return temp[i].idx;
      }
    }
  }
  for (i = 0; i < timelines.length; i++) {
    if (
      timelines[i].eafFile.includes(
        blobURL.substring(0, blobURL.lastIndexOf("."))
      )
    ) {
      return i;
    }
  }
  return -1;
}

// allOrViewer: True -> All, False -> Filtered
export function sourceMedia(
  sourceMedia: LooseObject[],
  allOrViewer: boolean
): LooseObject[] {
  let sourceVids = sourceMedia
    .filter(file => !file.isAnnotation && file["mimeType"].startsWith("video"))
    .sort(function(a: LooseObject, b: LooseObject) {
      const nameA = a["name"].toLowerCase();
      const nameB = b["name"].toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) return 1;
      return 0;
    });
  const path = require("path");
  let mp3s: string[] = [];
  let sourceAud = sourceAudio(sourceMedia, allOrViewer)
    .filter((sa: any) => {
      const parsedPath = path.parse(sa.path);
      if (parsedPath.ext.toLowerCase() === ".mp3") {
        mp3s.push(parsedPath.name);
      }
      let i;
      for (i = 0; i < sourceVids.length; i++) {
        const parsedPath2 = path.parse(sourceVids[i].path);
        if (parsedPath.name === parsedPath2.name + "_StandardAudio") {
          return false;
        }
      }
      return !parsedPath.base.endsWith("_StandardAudio_Normalized.mp3");
    })
    .filter((sa: any) => {
      const parsedPath = path.parse(sa.path);
      return !(
        mp3s.indexOf(parsedPath.name) !== -1 &&
        parsedPath.ext.toLowerCase() === ".wav"
      );
    });
  return [...sourceVids, ...sourceAud];
}

export function sourceAudio(
  sourceMedia: LooseObject[],
  allOrViewer: boolean
): LooseObject[] {
  let sourceAud = sourceMedia
    .filter(
      file =>
        !file.isAnnotation &&
        file["mimeType"].startsWith("audio") &&
        (!file["isMerged"] || allOrViewer)
    )
    .sort(function(a: LooseObject, b: LooseObject) {
      const nameA = a["name"].toLowerCase();
      const nameB = b["name"].toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) return 1;
      return 0;
    });
  return [...sourceAud];
}

export function annotAudio(
  annotMedia: LooseObject[],
  splitOrMerged: boolean,
  timelineIdx: number,
  timelines: any[]
  // true: merged only, false: split only
): LooseObject[] {
  let annotAud = annotMedia
    .filter(
      file =>
        file.isAnnotation &&
        file["mimeType"].startsWith("audio") &&
        (splitOrMerged ? file["isMerged"] : !file["isMerged"]) &&
        getTimelineIndex(
          timelines,
          file.blobURL.substring(0, file.blobURL.indexOf("_Annotations"))
        ) === timelineIdx
    )
    .sort(function(a: LooseObject, b: LooseObject) {
      const nameA = a["name"].toLowerCase();
      const nameB = b["name"].toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) return 1;
      return 0;
    });
  return [...annotAud];
}
