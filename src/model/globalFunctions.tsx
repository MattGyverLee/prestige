import { LooseObject } from "../store/annotations/types";

interface tempTimeline {
    syncMedia: string[],
    idx: number
}

export function getTimelineIndex(timelines: any, blobURL: string): number {
    let temp = timelines.map((t: LooseObject, idx: number) => {
        let syncMedia = t["syncMedia"];
        let x : tempTimeline = { syncMedia, idx }
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
    return -1;
}

export function sourceMedia(sourceMedia: LooseObject[]): LooseObject[] {
    let sourceVids = sourceMedia.filter(file => !file.isAnnotation && file["mimeType"].startsWith("video")).sort(function(a: LooseObject, b: LooseObject) {
    const nameA = a["name"].toLowerCase();
    const nameB = b["name"].toLowerCase();
    if (nameA < nameB) {
        // sort string ascending
        return -1;
    };
    if (nameA > nameB) return 1;
        return 0; // default return value (no sorting)
    });
    let sourceAud = sourceMedia.filter(file => !file.isAnnotation && file["mimeType"].startsWith("audio")).sort(function(a: LooseObject, b: LooseObject) {
    const nameA = a["name"].toLowerCase();
    const nameB = b["name"].toLowerCase();
    if (nameA < nameB) {
        // sort string ascending
        return -1;
    };
    if (nameA > nameB) return 1;
        return 0; // default return value (no sorting)
    });
    return [...sourceVids, ...sourceAud];
}