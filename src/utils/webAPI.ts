/**
 * Web Browser API Layer (PWA Mode)
 *
 * This module provides File System Access API integration for PWA mode,
 * mirroring the same interface as electronAPI but using browser-native APIs.
 *
 * Key differences from Electron:
 * - Uses File System Access API (requires Chrome 86+, Edge 86+, Safari 15.2+)
 * - No FFmpeg support (export reserved for desktop app)
 * - No file watching (manual folder reload)
 * - Works with FileSystemFileHandle/DirectoryHandle instead of paths
 */

// Cache for directory handles to maintain access across sessions
const directoryHandleCache = new Map<string, FileSystemDirectoryHandle>();
let currentRootHandle: FileSystemDirectoryHandle | null = null;

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return "showDirectoryPicker" in window;
}

/**
 * Request user to select a directory
 * Returns a persistent handle to the selected directory
 */
export async function selectDirectory(): Promise<string | null> {
  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: "read",
    });

    currentRootHandle = dirHandle;
    const dirPath = `/${dirHandle.name}`;
    directoryHandleCache.set(dirPath, dirHandle);

    // Store handle in IndexedDB for persistence
    await storeDirectoryHandle("lastOpenedDir", dirHandle);

    return dirPath;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      // User cancelled
      return null;
    }
    console.error("Error selecting directory:", error);
    throw error;
  }
}

/**
 * Store directory handle in IndexedDB for persistence across sessions
 */
async function storeDirectoryHandle(
  key: string,
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(["handles"], "readwrite");
  const store = transaction.objectStore("handles");
  await store.put({ key, handle });
}

/**
 * Retrieve stored directory handle from IndexedDB
 * Note: Currently unused but available for future session persistence
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getStoredDirectoryHandle(
  key: string,
): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(["handles"], "readonly");
    const store = transaction.objectStore("handles");
    const result = await store.get(key);
    return result?.handle || null;
  } catch {
    return null;
  }
}

/**
 * Open/create IndexedDB for storing directory handles
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("PrestigePWA", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles", { keyPath: "key" });
      }
    };
  });
}

/**
 * Read directory contents recursively
 */
export async function readDirectory(dirPath: string): Promise<any[]> {
  const dirHandle = currentRootHandle || directoryHandleCache.get(dirPath);
  if (!dirHandle) {
    throw new Error("No directory handle available");
  }

  const files: any[] = [];

  for await (const entry of dirHandle.values()) {
    const stats = {
      name: entry.name,
      path: `${dirPath}/${entry.name}`,
      isDirectory: entry.kind === "directory",
      size: 0,
      mtime: new Date(),
    };

    if (entry.kind === "file") {
      const file = await (entry as FileSystemFileHandle).getFile();
      stats.size = file.size;
      stats.mtime = new Date(file.lastModified);
    }

    files.push(stats);
  }

  return files;
}

/**
 * Get a file handle from path
 */
async function getFileHandle(filePath: string): Promise<FileSystemFileHandle> {
  if (!currentRootHandle) {
    throw new Error("No root directory selected");
  }

  const parts = filePath.split("/").filter((p) => p);
  let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle =
    currentRootHandle;

  // Skip the root folder name (first part)
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (i === parts.length - 1) {
      // Last part is the file
      currentHandle = await (
        currentHandle as FileSystemDirectoryHandle
      ).getFileHandle(part);
    } else {
      // Navigate through directories
      currentHandle = await (
        currentHandle as FileSystemDirectoryHandle
      ).getDirectoryHandle(part);
    }
  }

  return currentHandle as FileSystemFileHandle;
}

/**
 * Read file contents as text
 */
export async function readFile(filePath: string): Promise<string> {
  const fileHandle = await getFileHandle(filePath);
  const file = await fileHandle.getFile();
  return await file.text();
}

/**
 * Read file as ArrayBuffer for binary files
 */
export async function readFileAsBuffer(filePath: string): Promise<ArrayBuffer> {
  const fileHandle = await getFileHandle(filePath);
  const file = await fileHandle.getFile();
  return await file.arrayBuffer();
}

/**
 * Write file contents
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  if (!currentRootHandle) {
    throw new Error("No root directory selected");
  }

  const parts = filePath.split("/").filter((p) => p);
  let currentHandle: FileSystemDirectoryHandle = currentRootHandle;

  // Navigate to parent directory
  for (let i = 1; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i], {
      create: true,
    });
  }

  // Create/overwrite file
  const fileName = parts[parts.length - 1];
  const fileHandle = await currentHandle.getFileHandle(fileName, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

/**
 * Check if file exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await getFileHandle(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<any> {
  const fileHandle = await getFileHandle(filePath);
  const file = await fileHandle.getFile();

  return {
    size: file.size,
    mtime: new Date(file.lastModified),
    birthtime: new Date(file.lastModified),
  };
}

/**
 * Get MIME type from file extension
 */
export async function getMimeType(filePath: string): Promise<string> {
  const ext = filePath.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    eaf: "application/eaf+xml",
    xml: "application/xml",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    json: "application/json",
    txt: "text/plain",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Convert file handle to blob URL
 */
export async function pathToFileURL(filePath: string): Promise<string> {
  const fileHandle = await getFileHandle(filePath);
  const file = await fileHandle.getFile();
  return URL.createObjectURL(file);
}

/**
 * Parse file path (browser-compatible version)
 */
export async function parsePath(filePath: string): Promise<any> {
  const parts = filePath.split("/");
  const base = parts[parts.length - 1];
  const ext = base.includes(".") ? "." + base.split(".").pop() : "";
  const name = base.replace(ext, "");
  const dir = parts.slice(0, -1).join("/");

  return {
    base,
    name,
    ext,
    dir,
    root: parts[0] || "/",
  };
}

/**
 * Get path separator (always / in browser)
 */
export async function getPathSeparator(): Promise<string> {
  return "/";
}

/**
 * Get current working directory (virtual path)
 */
export async function getCwd(): Promise<string> {
  return currentRootHandle ? `/${currentRootHandle.name}` : "/";
}

/**
 * Parse EAF file using browser DOMParser
 */
export async function parseEAF(filePath: string): Promise<any> {
  const content = await readFile(filePath);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, "text/xml");

  // Convert DOM to JS object (simplified xml2js equivalent)
  return domToObject(xmlDoc.documentElement);
}

/**
 * Convert DOM element to JavaScript object
 */
function domToObject(element: Element): any {
  const obj: any = {};

  // Add attributes
  if (element.attributes.length > 0) {
    obj.$ = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      obj.$[attr.name] = attr.value;
    }
  }

  // Add children
  const children: any = {};
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    const childObj = domToObject(child);

    if (!children[child.tagName]) {
      children[child.tagName] = [];
    }
    children[child.tagName].push(childObj);
  }

  // Add text content if no children
  if (element.children.length === 0 && element.textContent) {
    return element.textContent;
  }

  return { ...obj, ...children };
}

/**
 * Get directory snapshot (for caching)
 */
export async function getDirectorySnapshot(dirPath: string): Promise<string> {
  const files = await readDirectory(dirPath);
  return JSON.stringify(files.map((f) => ({ name: f.name, size: f.size })));
}

/**
 * Stub functions not supported in PWA mode
 */
export async function clearCache(): Promise<void> {
  console.warn("clearCache not supported in PWA mode");
}

export async function joinPath(...segments: string[]): Promise<string> {
  return segments.join("/").replace(/\/+/g, "/");
}

export async function getUserDataPath(): Promise<string> {
  return "/user-data";
}

export async function deleteFile(_filePath: string): Promise<void> {
  // File System Access API doesn't support deletion in current spec
  throw new Error("File deletion not supported in PWA mode");
}

// File watching not supported in browser
export async function startWatcher(): Promise<string> {
  throw new Error(
    "File watching not supported in PWA mode - use manual reload",
  );
}

export async function stopWatcher(): Promise<void> {
  // No-op
}

export function onFileSystemEvent(): void {
  // No-op
}

export function removeFileSystemEventListener(): void {
  // No-op
}

// FFmpeg operations not supported (reserved for desktop app)
export async function exportVideo(): Promise<any> {
  throw new Error("Video export requires desktop app");
}

export async function convertAudioToMP3(): Promise<any> {
  throw new Error("Audio conversion requires desktop app");
}

export async function mergeAudioFiles(): Promise<any> {
  throw new Error("Audio merging requires desktop app");
}

export async function getMediaMetadata(_filePath: string): Promise<any> {
  // Basic metadata from File API
  const fileHandle = await getFileHandle(_filePath);
  const file = await fileHandle.getFile();

  // For audio/video, we'd need to load it to get duration
  // This is a simplified version
  return {
    format: {
      duration: 0, // Would need to load media element to get real duration
      size: file.size,
      filename: file.name,
    },
    streams: [
      {
        duration: 0,
        codec_type: file.type.startsWith("audio") ? "audio" : "video",
      },
    ],
  };
}

export async function isDev(): Promise<boolean> {
  return import.meta.env.DEV;
}

export async function getPlatform(): Promise<string> {
  return "web";
}

export function send(): void {
  // No-op
}

export function on(): void {
  // No-op
}

export function onFFmpegProgress(): void {
  // No-op
}

export function removeFFmpegProgressListener(): void {
  // No-op
}
