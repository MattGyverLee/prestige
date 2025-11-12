import { LooseObject } from "../store/annot/types";
import { electronAPI } from "../utils/electronAPI";

interface tempTimeline {
  syncMedia: string[];
  idx: number;
}

export function getTimelineIndex(
  timelines: any,
  blobURL: string,
  sourceMedia?: LooseObject[],
): number {
  if (
    blobURL === undefined ||
    blobURL === null ||
    blobURL === "" ||
    timelines.length === 0
  ) {
    return -1;
  }

  // Find the file object matching this blobURL to get its original filename/path
  let fileName: string | null = null;
  let filePath: string | null = null;

  if (sourceMedia) {
    const fileObj = sourceMedia.find((f) => f.blobURL === blobURL);
    if (fileObj) {
      fileName = fileObj.name; // e.g., "audio.wav"
      filePath = fileObj.path; // e.g., "/home/user/project/audio.wav"
    }
  }

  const temp = timelines.map((t: LooseObject, idx: number) => {
    const x: tempTimeline = { syncMedia: t.syncMedia, idx };
    return x;
  });

  // Try matching by filename if we have it
  if (fileName) {
    for (let i = 0, l = temp.length; i < l; i++) {
      for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
        const syncMediaURL = temp[i].syncMedia[j];
        // Extract filename from file:// URL or path and decode URL encoding
        const syncMediaNameEncoded = syncMediaURL.substring(
          syncMediaURL.lastIndexOf("/") + 1,
        );
        const syncMediaName = decodeURIComponent(syncMediaNameEncoded);
        if (syncMediaName === fileName) {
          return temp[i].idx;
        }
      }
    }
  }

  // Try matching by full path if we have it
  if (filePath) {
    for (let i = 0, l = temp.length; i < l; i++) {
      for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
        const syncMediaURL = temp[i].syncMedia[j];
        // Convert file:// URL back to path for comparison and decode URL encoding
        let syncMediaPath = syncMediaURL.startsWith("file://")
          ? syncMediaURL.substring(7) // Remove "file://" prefix
          : syncMediaURL;
        // Decode URL-encoded characters
        syncMediaPath = decodeURIComponent(syncMediaPath);
        if (syncMediaPath === filePath) {
          return temp[i].idx;
        }
      }
    }
  }

  // Fallback: Try direct URL matching (for backward compatibility)
  for (let i = 0, l = temp.length; i < l; i++) {
    for (let j = 0, l2 = temp[i].syncMedia.length; j < l2; j++) {
      if (temp[i].syncMedia[j] === blobURL) {
        return temp[i].idx;
      }
    }
  }

  // Try matching by eafFile
  if (fileName) {
    const fileNameWithoutExt = fileName.substring(
      0,
      fileName.lastIndexOf("."),
    );
    for (let i = 0, l = timelines.length; i < l; i++) {
      if (timelines[i].eafFile.includes(fileNameWithoutExt)) {
        return i;
      }
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
 * Synchronous version for backward compatibility
 * DEPRECATED: This function is no longer truly synchronous and may cause issues.
 * Please migrate to the async safeParse() function.
 *
 * This is a temporary shim that caches path parse results to avoid async calls
 * in most cases, but falls back to a basic parser for uncached paths.
 */
const pathParseCache = new Map<string, any>();

export function safeParseSync(inPath: string): any {
  // Check cache first
  if (pathParseCache.has(inPath)) {
    return pathParseCache.get(inPath);
  }

  // Fallback: Basic path parsing for browser context
  // This handles most common cases without requiring Node.js APIs
  const normalizedPath = inPath.replace(/\\/g, '/');
  const lastSlash = normalizedPath.lastIndexOf('/');
  const lastDot = normalizedPath.lastIndexOf('.');

  const dir = lastSlash >= 0 ? normalizedPath.substring(0, lastSlash) : '';
  const base = lastSlash >= 0 ? normalizedPath.substring(lastSlash + 1) : normalizedPath;
  const ext = lastDot > lastSlash ? normalizedPath.substring(lastDot) : '';
  const name = lastDot > lastSlash ? base.substring(0, base.length - ext.length) : base;

  const result = {
    root: normalizedPath.match(/^[a-zA-Z]:/) ? normalizedPath.substring(0, 2) : '',
    dir: dir,
    base: base,
    ext: ext,
    name: name
  };

  // Cache the result
  pathParseCache.set(inPath, result);

  return result;
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
  sourceMedia?: LooseObject[],
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
          file.path.substring(0, file.path.indexOf("_Annotations")),
          sourceMedia,
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
