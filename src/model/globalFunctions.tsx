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

export function sourceMedia(sourceMedia: LooseObject[]): LooseObject[] {
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
  let sourceAud = sourceMedia
    .filter(file => !file.isAnnotation && file["mimeType"].startsWith("audio"))
    .sort(function(a: LooseObject, b: LooseObject) {
      const nameA = a["name"].toLowerCase();
      const nameB = b["name"].toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) return 1;
      return 0;
    });
  return [...sourceVids, ...sourceAud];
}
