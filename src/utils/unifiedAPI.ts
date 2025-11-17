/**
 * Unified API Layer
 *
 * Automatically detects environment (Electron vs PWA) and provides
 * consistent interface for file operations across both platforms.
 *
 * Usage:
 *   import { api } from './utils/unifiedAPI';
 *   const files = await api.readDirectory('/path');
 */

import * as webAPI from "./webAPI";

// Type definition matching both Electron and Web APIs
export interface UnifiedAPI {
  // Environment detection
  isElectron: boolean;
  isPWA: boolean;
  canExportVideo: boolean;

  // File System Operations
  readDirectory: (dirPath: string) => Promise<any[]>;
  readFile: (filePath: string) => Promise<string>;
  readFileAsBuffer: (filePath: string) => Promise<ArrayBuffer>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<void>;
  getDirectorySnapshot: (dirPath: string) => Promise<string>;
  getFileStats: (filePath: string) => Promise<any>;
  clearCache: () => Promise<void>;
  selectDirectory: () => Promise<string | null>;

  // Path Operations
  parsePath: (filePath: string) => Promise<any>;
  joinPath: (...segments: string[]) => Promise<string>;
  getPathSeparator: () => Promise<string>;

  // File Utilities
  pathToFileURL: (filePath: string) => Promise<string>;
  getMimeType: (filePath: string) => Promise<string>;
  getCwd: () => Promise<string>;
  getUserDataPath: () => Promise<string>;

  // File Watching
  startWatcher: (dirPath: string, options: any) => Promise<string>;
  stopWatcher: (watcherId: string) => Promise<void>;
  onFileSystemEvent: (callback: (data: any) => void) => void;
  removeFileSystemEventListener: () => void;

  // FFmpeg (Electron only)
  convertVideo: (options: any) => Promise<any>;
  convertAudioToMP3: (
    input: string,
    output: string,
    options?: any,
  ) => Promise<any>;
  mergeAudioFiles: (
    inputs: string[],
    output: string,
    options?: any,
  ) => Promise<any>;
  getMediaMetadata: (filePath: string) => Promise<any>;
  exportVideo: (
    clips: any[],
    outputPath: string,
    options?: any,
  ) => Promise<any>;
  onFFmpegProgress: (callback: (data: any) => void) => void;
  removeFFmpegProgressListener: () => void;

  // XML/EAF
  parseEAF: (filePath: string) => Promise<any>;
  parseXML: (filePath: string) => Promise<any>;

  // Utilities
  isDev: () => Promise<boolean>;
  getPlatform: () => Promise<any>;
  send: (channel: string, data: any) => void;
  on: (channel: string, callback: (data: any) => void) => void;
}

/**
 * Detect if running in Electron
 */
function isElectronEnvironment(): boolean {
  // Check for electronAPI exposed via preload
  if (typeof (window as any).electronAPI !== "undefined") {
    return true;
  }

  // Check for electron in user agent
  if (navigator.userAgent.toLowerCase().includes("electron")) {
    return true;
  }

  // Check environment variable
  if (process.env.REACT_APP_MODE === "electron") {
    return true;
  }

  return false;
}

/**
 * Detect if File System Access API is available (PWA mode)
 */
function isPWAEnvironment(): boolean {
  return !isElectronEnvironment() && "showDirectoryPicker" in window;
}

/**
 * Get appropriate API implementation
 */
function getAPIImplementation(): UnifiedAPI {
  const isElectron = isElectronEnvironment();
  const isPWA = isPWAEnvironment();

  if (isElectron) {
    console.log("[UnifiedAPI] Using Electron API");
    const electronAPI = (window as any).electronAPI;

    return {
      isElectron: true,
      isPWA: false,
      canExportVideo: true,
      ...electronAPI,
    };
  }

  if (isPWA) {
    console.log("[UnifiedAPI] Using Web/PWA API");

    return {
      isElectron: false,
      isPWA: true,
      canExportVideo: false,
      ...webAPI,

      // Add parseXML using same implementation as parseEAF
      parseXML: webAPI.parseEAF,
    };
  }

  // Fallback: limited functionality (view-only mode without file system access)
  console.warn("[UnifiedAPI] Limited functionality - no file system access");

  return createFallbackAPI();
}

/**
 * Create fallback API for browsers without File System Access API
 */
function createFallbackAPI(): UnifiedAPI {
  const notSupported = (feature: string) => async () => {
    throw new Error(
      `${feature} is not supported in this browser. Please use Chrome 86+, Edge 86+, or Safari 15.2+ for full PWA functionality, or install the desktop app.`,
    );
  };

  return {
    isElectron: false,
    isPWA: false,
    canExportVideo: false,

    readDirectory: notSupported("Directory reading"),
    readFile: notSupported("File reading"),
    readFileAsBuffer: notSupported("File reading"),
    writeFile: notSupported("File writing"),
    exists: notSupported("File existence check"),
    deleteFile: notSupported("File deletion"),
    getDirectorySnapshot: notSupported("Directory snapshot"),
    getFileStats: notSupported("File stats"),
    clearCache: async () => {},
    selectDirectory: notSupported("Directory selection"),

    parsePath: async (_path) => ({
      base: "",
      name: "",
      ext: "",
      dir: "",
      root: "/",
    }),
    joinPath: async (...segments) => segments.join("/"),
    getPathSeparator: async () => "/",

    pathToFileURL: notSupported("Path to URL conversion"),
    getMimeType: async (_path) => "application/octet-stream",
    getCwd: async () => "/",
    getUserDataPath: async () => "/user-data",

    startWatcher: notSupported("File watching"),
    stopWatcher: async () => {},
    onFileSystemEvent: () => {},
    removeFileSystemEventListener: () => {},

    convertVideo: notSupported("Video conversion"),
    convertAudioToMP3: notSupported("Audio conversion"),
    mergeAudioFiles: notSupported("Audio merging"),
    getMediaMetadata: notSupported("Media metadata"),
    exportVideo: notSupported("Video export"),
    onFFmpegProgress: () => {},
    removeFFmpegProgressListener: () => {},

    parseEAF: notSupported("EAF parsing"),
    parseXML: notSupported("XML parsing"),

    isDev: async () => import.meta.env.DEV,
    getPlatform: async () => "web-limited",
    send: () => {},
    on: () => {},
  };
}

/**
 * Singleton API instance
 */
export const api: UnifiedAPI = getAPIImplementation();

/**
 * Helper to show appropriate UI message based on environment
 */
export function getEnvironmentMessage(): string {
  if (api.isElectron) {
    return "Running in desktop mode with full functionality";
  }

  if (api.isPWA) {
    return "Running in PWA mode - viewing and playback enabled (export requires desktop app)";
  }

  return "Limited functionality - install desktop app or use Chrome/Edge/Safari for full PWA features";
}

/**
 * Check if a feature is available in current environment
 */
export function isFeatureAvailable(feature: string): boolean {
  switch (feature) {
    case "video-export":
    case "audio-merge":
    case "audio-conversion":
      return api.canExportVideo;

    case "file-watching":
      return api.isElectron;

    case "folder-access":
      return api.isElectron || api.isPWA;

    case "playback":
    case "annotation-viewing":
      return true;

    default:
      return false;
  }
}

/**
 * Get feature availability status for UI
 */
export interface FeatureStatus {
  available: boolean;
  reason?: string;
  upgradeMessage?: string;
}

export function getFeatureStatus(feature: string): FeatureStatus {
  if (isFeatureAvailable(feature)) {
    return { available: true };
  }

  if (api.isElectron) {
    return {
      available: false,
      reason: "This feature is not available",
    };
  }

  if (api.isPWA) {
    return {
      available: false,
      reason: "This feature requires the desktop app",
      upgradeMessage:
        "Install the desktop app for video export and advanced features",
    };
  }

  return {
    available: false,
    reason: "Your browser does not support this feature",
    upgradeMessage:
      "Use Chrome 86+, Edge 86+, Safari 15.2+, or install the desktop app",
  };
}
