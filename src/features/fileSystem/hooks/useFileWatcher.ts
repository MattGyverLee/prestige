/**
 * File Watcher Hook
 *
 * Manages file system watching using Chokidar via Electron IPC.
 * Handles file add, change, and delete events, and provides
 * file descriptions with MIME types and blob URLs.
 *
 * @module hooks/useFileWatcher
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { electronAPI } from "../../../utils/electronAPI";
import { safeParseSync } from "../../../components/globalFunctions";
import * as aTypes from "../../../store/annot/types";

/**
 * File watcher options
 */
export interface FileWatcherOptions {
  /**
   * Ignore initial file scan (for reload scenarios)
   */
  ignoreInitial?: boolean;
  /**
   * Enable verbose logging for debugging
   */
  verbose?: boolean;
}

/**
 * File event types from watcher
 */
export type FileEventType =
  | "add"
  | "change"
  | "unlink"
  | "addDir"
  | "unlinkDir";

/**
 * File event data structure
 */
export interface FileEvent {
  type: FileEventType;
  path: string;
  fileDef?: aTypes.LooseObject;
}

/**
 * File watcher hook return type
 */
export interface UseFileWatcherReturn {
  /**
   * Currently watched folder path
   */
  watchedPath: string | null;
  /**
   * Whether the watcher is ready (initial scan complete)
   */
  isReady: boolean;
  /**
   * Whether currently watching a folder
   */
  isWatching: boolean;
  /**
   * Start watching a folder
   */
  startWatching: (path: string, options?: FileWatcherOptions) => Promise<void>;
  /**
   * Stop watching the current folder
   */
  stopWatching: () => Promise<void>;
  /**
   * Create file definition from path
   */
  describeFile: (path: string) => Promise<aTypes.LooseObject | null>;
}

/**
 * useFileWatcher Hook
 *
 * Provides file system watching capabilities using Chokidar via Electron IPC.
 * Automatically cleans up watchers on unmount.
 *
 * @param onFileEvent - Callback fired when file events occur
 * @param onReady - Callback fired when watcher is ready
 * @returns File watcher state and controls
 *
 * @example
 * ```typescript
 * const { startWatching, stopWatching, isReady } = useFileWatcher(
 *   (event) => {
 *     console.log('File event:', event.type, event.path);
 *   },
 *   () => {
 *     console.log('Watcher ready');
 *   }
 * );
 *
 * // Start watching
 * await startWatching('/path/to/folder');
 * ```
 */
export function useFileWatcher(
  onFileEvent?: (event: FileEvent) => void | Promise<void>,
  onReady?: () => void | Promise<void>,
): UseFileWatcherReturn {
  const [watchedPath, setWatchedPath] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  const watcherIdRef = useRef<string | null>(null);
  const verboseRef = useRef(false);

  /**
   * Create file definition from path
   * Includes MIME type detection and blob URL creation for media files
   */
  const describeFile = useCallback(
    async (path: string): Promise<aTypes.LooseObject | null> => {
      try {
        // Parse path components
        const parsedPath = safeParseSync(path);

        // Get MIME type
        const tempMime = await electronAPI.getMimeType(path);

        // For audio/video files, convert to blob URL for webSecurity compatibility
        const isAudioVideo =
          tempMime.startsWith("audio") || tempMime.startsWith("video");

        // TODO: Implement blob URL creation for audio/video files
        // Requires electronAPI.readFileAsBuffer IPC handler
        // For now, use file:// URLs for all files
        const blobURL = await electronAPI.pathToFileURL(path);

        if (verboseRef.current && isAudioVideo) {
          console.log(
            `[useFileWatcher] Created file URL for audio/video ${parsedPath.base}`,
          );
        }

        // Determine if this is an annotation file
        const isMerged = parsedPath.base.includes("_Merged");
        const isAnnotation =
          parsedPath.dir.endsWith("_Annotations") ||
          parsedPath.base.includes("oralAnnotations") ||
          isMerged;

        // Return file definition
        return {
          blobURL,
          extension: parsedPath.ext,
          hasAnnotation: false,
          isAnnotation,
          isMerged,
          inMilestones: false,
          mimeType: tempMime,
          name: parsedPath.base,
          path,
          wsAllowed: true,
          waveform: false,
        };
      } catch (error) {
        console.error(`[useFileWatcher] Error describing file ${path}:`, error);
        return null;
      }
    },
    [],
  );

  /**
   * Start watching a folder
   */
  const startWatching = useCallback(
    async (path: string, options: FileWatcherOptions = {}) => {
      // Stop existing watcher if any
      if (watcherIdRef.current !== null) {
        await electronAPI.stopWatcher(watcherIdRef.current);
        watcherIdRef.current = null;
      }

      // Reset state
      setIsReady(false);
      setWatchedPath(path);
      verboseRef.current = options.verbose ?? false;

      // Start watcher via IPC
      const watcherId = await electronAPI.startWatcher(path, {
        ignoreInitial: options.ignoreInitial ?? false,
      });

      watcherIdRef.current = watcherId;
      setIsWatching(true);

      // Set up IPC event listener for file system events
      electronAPI.onFileSystemEvent(async (event: any) => {
        // Only process events from our watcher
        if (event.watcherId !== watcherIdRef.current) return;

        switch (event.type) {
          case "add": {
            const fileDef = await describeFile(event.path);
            if (fileDef && onFileEvent) {
              await onFileEvent({ type: "add", path: event.path, fileDef });
            }
            console.log(`[useFileWatcher] File ${event.path} has been added`);
            break;
          }

          case "addDir":
            console.log(
              `[useFileWatcher] Directory ${event.path} has been added`,
            );
            break;

          case "change": {
            const fileDef = await describeFile(event.path);
            if (fileDef && onFileEvent) {
              await onFileEvent({ type: "change", path: event.path, fileDef });
            }
            console.log(`[useFileWatcher] File ${event.path} has been changed`);
            break;
          }

          case "unlink":
            if (onFileEvent) {
              await onFileEvent({ type: "unlink", path: event.path });
            }
            console.log(`[useFileWatcher] File ${event.path} has been removed`);
            break;

          case "unlinkDir":
            console.log(
              `[useFileWatcher] Directory ${event.path} has been removed`,
            );
            break;

          case "error":
            console.error(`[useFileWatcher] Watcher error: ${event.error}`);
            break;

          case "ready":
            console.log(
              "[useFileWatcher] Initial scan complete. Ready for changes",
            );
            setIsReady(true);
            if (onReady) {
              await onReady();
            }
            break;
        }
      });
    },
    [describeFile, onFileEvent, onReady],
  );

  /**
   * Stop watching the current folder
   */
  const stopWatching = useCallback(async () => {
    if (watcherIdRef.current !== null) {
      await electronAPI.stopWatcher(watcherIdRef.current);
      watcherIdRef.current = null;
    }
    electronAPI.removeFileSystemEventListener();
    setIsWatching(false);
    setIsReady(false);
    setWatchedPath(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watcherIdRef.current !== null) {
        electronAPI
          .stopWatcher(watcherIdRef.current)
          .catch((err) =>
            console.error(
              "[useFileWatcher] Error stopping watcher on unmount:",
              err,
            ),
          );
        electronAPI.removeFileSystemEventListener();
      }
    };
  }, []);

  return {
    watchedPath,
    isReady,
    isWatching,
    startWatching,
    stopWatching,
    describeFile,
  };
}
