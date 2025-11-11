/**
 * Electron API Compatibility Layer
 *
 * This module provides a consistent API for accessing Electron features
 * regardless of whether we're using the old require() approach or the
 * new secure contextBridge API.
 *
 * During migration, this allows code to work with both approaches,
 * making the transition gradual and testable.
 */

// Type definition for the secure API exposed via preload
interface ElectronAPI {
  // File System
  readDirectory: (dirPath: string) => Promise<any[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<any>;
  exists: (path: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<any>;
  getDirectorySnapshot: (dirPath: string) => Promise<string>;
  getFileStats: (filePath: string) => Promise<any>;
  clearCache: () => Promise<any>;

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

  // FFmpeg
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
    clips: Array<{
      V1: string;
      V1Start: number;
      V1Stop: number;
      V1Speed: number;
      A1: string;
      A1Start: number;
      A1Stop: number;
      A1Speed: number;
      A1Vol: number;
      isA2: boolean;
      A2?: string;
      A2Start?: number;
      A2Stop?: number;
      A2Speed?: number;
      A2Vol?: number;
      Comment?: string;
    }>,
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

// Check if we're in Electron with the new secure API
const hasSecureAPI = typeof (window as any).electronAPI !== "undefined";

/**
 * Get the appropriate API based on environment
 */
function getAPI(): ElectronAPI {
  // If secure API is available via contextBridge, use it
  if (hasSecureAPI) {
    return (window as any).electronAPI;
  }

  // Fallback to old require() approach (to be phased out)
  // This allows gradual migration
  return createLegacyAPI();
}

/**
 * Create legacy API using require() (TEMPORARY)
 * This will be removed once full migration is complete
 */
function createLegacyAPI(): ElectronAPI {
  const fs = require("fs-extra");
  const path = require("path");
  const fileUrl = require("file-url");
  const mime = require("mime");
  const xml2js = require("xml2js");
  const chokidar = require("chokidar");

  // Wrap synchronous operations in promises for API consistency
  return {
    // File System
    readDirectory: async (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      return files.map((file: string) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
        };
      });
    },

    readFile: async (filePath: string) => {
      return fs.readFileSync(filePath, "utf8");
    },

    writeFile: async (filePath: string, content: string) => {
      fs.writeFileSync(filePath, content, "utf8");
      return { success: true };
    },

    exists: async (checkPath: string) => {
      return fs.existsSync(checkPath);
    },

    deleteFile: async (filePath: string) => {
      fs.unlinkSync(filePath);
      return { success: true };
    },

    getDirectorySnapshot: async (dirPath: string) => {
      const walkSync = (dir: string, filelist: any[] = []): any[] => {
        const files = fs.readdirSync(dir);
        files.forEach((file: string) => {
          const filepath = path.join(dir, file);
          const stats = fs.statSync(filepath);
          if (stats.isDirectory()) {
            filelist = walkSync(filepath, filelist);
          } else {
            filelist.push(`${filepath}, ${stats.mtime}`);
          }
        });
        return filelist;
      };

      const fileList = walkSync(dirPath);
      return JSON.stringify(fileList.flat());
    },

    getFileStats: async (filePath: string) => {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        birthtime: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    },

    clearCache: async () => {
      const electron = require("electron");
      const app = electron.remote.app;
      const chromeCacheDir = path.join(app.getPath("userData"), "Cache");
      if (fs.existsSync(chromeCacheDir)) {
        const files = fs.readdirSync(chromeCacheDir);
        files.forEach((file: string) => {
          const filename = path.join(chromeCacheDir, file);
          try {
            fs.unlinkSync(filename);
          } catch (e) {
            console.log("Could not delete cache file:", e);
          }
        });
      }
      return { success: true };
    },

    // Path Operations
    parsePath: async (filePath: string) => {
      const pathParse = require("path-parse");
      return pathParse(filePath);
    },

    joinPath: async (...segments: string[]) => {
      return path.join(...segments);
    },

    getPathSeparator: async () => {
      return path.sep;
    },

    // File Utilities
    pathToFileURL: async (filePath: string) => {
      return fileUrl(filePath);
    },

    getMimeType: async (filePath: string) => {
      const mimeType = mime.getType(filePath);
      if (mimeType) return mimeType;

      const parsedPath = path.parse(filePath);
      return `file/${parsedPath.ext}`;
    },

    getCwd: async () => {
      return process.cwd();
    },

    getUserDataPath: async () => {
      const electron = require("electron");
      const app = electron.remote.app;
      return app.getPath("userData");
    },

    // File Watching - NOT IMPLEMENTED in legacy (too complex to wrap)
    // These will only work with new API
    startWatcher: async () => {
      throw new Error("File watching requires secure API");
    },

    stopWatcher: async () => {},

    onFileSystemEvent: () => {},

    removeFileSystemEventListener: () => {},

    // FFmpeg - NOT IMPLEMENTED in legacy
    convertVideo: async () => {
      throw new Error("FFmpeg requires secure API");
    },
    convertAudioToMP3: async () => {
      throw new Error("FFmpeg requires secure API");
    },
    mergeAudioFiles: async () => {
      throw new Error("FFmpeg requires secure API");
    },
    getMediaMetadata: async () => {
      throw new Error("FFmpeg requires secure API");
    },
    exportVideo: async () => {
      throw new Error("FFmpeg requires secure API");
    },

    onFFmpegProgress: () => {},

    removeFFmpegProgressListener: () => {},

    // XML/EAF
    parseEAF: async (filePath: string) => {
      const content = fs.readFileSync(filePath, "utf8");
      return new Promise((resolve, reject) => {
        xml2js.parseString(content, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    },

    parseXML: async (filePath: string) => {
      const content = fs.readFileSync(filePath, "utf8");
      return new Promise((resolve, reject) => {
        xml2js.parseString(content, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    },

    // Utilities
    isDev: async () => {
      const electronIsDev = require("electron-is-dev");
      return electronIsDev;
    },

    getPlatform: async () => {
      return {
        platform: process.platform,
        separator: path.sep,
        arch: process.arch,
      };
    },

    send: (channel: string, data: any) => {
      const electron = require("electron");
      electron.ipcRenderer.send(channel, data);
    },

    on: (channel: string, callback: (data: any) => void) => {
      const electron = require("electron");
      electron.ipcRenderer.on(channel, (event: any, data: any) =>
        callback(data),
      );
    },
  };
}

// Export the unified API
export const electronAPI = getAPI();

// Export utility to check if using secure API
export const isUsingSecureAPI = () => hasSecureAPI;

// Helper function for error handling
export function handleElectronError(error: any, context: string) {
  console.error(`Electron API error in ${context}:`, error);
  throw error;
}
