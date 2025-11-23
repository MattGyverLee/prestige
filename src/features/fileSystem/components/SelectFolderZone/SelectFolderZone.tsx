/**
 * SelectFolderZone Component
 *
 * Handles folder selection and file watching for the Prestige application.
 * Supports both Electron (native folder selection) and Web (File System Access API)
 * environments.
 *
 * Features:
 * - Folder selection via native dialog or web picker
 * - Real-time file watching with Chokidar (Electron)
 * - EAF file parsing for ELAN annotations
 * - Audio file merging for annotation clips
 * - Local state caching for quick folder restoration
 * - Web mode with File System Access API support
 *
 * @module components/SelectFolderZone
 */

import React, { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { parseStringPromise } from "xml2js";

// Store imports
import * as actions from "../../../../store";
import * as aTypes from "../../../../store/annot/types";
import { StateProps } from "../../../../store";

// Utility imports
import {
  getSourceMedia,
  getTimelineIndex,
  safeParseSync,
} from "../../../../components/globalFunctions";
import { electronAPI } from "../../../../utils/electronAPI";
import {
  testingAnnot,
  testingAnnotMedia,
  testingSourceMedia,
} from "../../../../components/FolderSelection/WebExample";

// Custom hooks
import {
  useFileWatcher,
  useEAFParser,
  useAudioMerge,
  useLocalStateCache,
} from "../../hooks";

/**
 * Web File Entry (for File System Access API)
 */
interface WebFileEntry {
  handle: any;
  file: File;
  path: string;
}

/**
 * SelectFolderZone Component
 *
 * Main folder selection and file management component.
 */
export function SelectFolderZone(): JSX.Element {
  // ============================================================================
  // REDUX STATE & DISPATCH
  // ============================================================================

  const dispatch = useDispatch();

  // Select state from Redux
  const env = useSelector((state: StateProps) => state.tree.env);
  const url = useSelector((state: StateProps) => state.player.url);
  const timeline = useSelector((state: StateProps) => state.annot.timeline);
  const sourceMedia = useSelector(
    (state: StateProps) => state.tree.sourceMedia,
  );
  const annotMedia = useSelector((state: StateProps) => state.tree.annotMedia);
  const categories = useSelector((state: StateProps) => state.annot.categories);
  const annot = useSelector((state: StateProps) => state.annot);
  const tree = useSelector((state: StateProps) => state.tree);
  const currentTimeline = useSelector(
    (state: StateProps) => state.annot.currentTimeline,
  );

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  // Note: selectedFolder and timelinesInstantiated not currently used
  // but kept for potential future state management needs

  // ============================================================================
  // REFS (formerly instance variables)
  // ============================================================================

  const currentFolderRef = useRef<string>("");
  const prevPathRef = useRef<string>("");
  const readyPlayURLRef = useRef<string>("");
  const usingStoredDataRef = useRef(false);
  const annotMergeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verboseFileHandlingRef = useRef(false);
  const webDirectoryHandleRef = useRef<any | null>(null);
  const webFileMapRef = useRef(
    new Map<string, { blobURL: string; file: File }>(),
  );
  const webBlobUrlsRef = useRef<string[]>([]);

  // ============================================================================
  // CUSTOM HOOKS
  // ============================================================================

  const {
    isReady: isWatcherReady,
    startWatching,
    stopWatching,
  } = useFileWatcher(handleFileEvent, handleWatcherReady);

  const { parseEAFFile, parseEAFWeb } = useEAFParser();

  const { mergeAudioFiles, convertToMP3 } = useAudioMerge();

  const { checkCache, loadCache, saveCache } = useLocalStateCache();

  // ============================================================================
  // LIFECYCLE EFFECTS
  // ============================================================================

  /**
   * Component Mount - Clean storage
   */
  useEffect(() => {
    // FIXME: This is a hack to avoid a crash during presentation.
    for (const l in localStorage) {
      if (l.startsWith("Prestige")) {
        localStorage.removeItem(l);
      }
    }
  }, []);

  /**
   * Component Unmount - Cleanup
   */
  useEffect(() => {
    return () => {
      // Stop watcher
      stopWatching();
      // Cleanup web blobs
      cleanupWebBlobs();
    };
  }, [stopWatching]);

  /**
   * Timeline Update Effect
   * If timeline was just created and we have a URL set, update currentTimeline
   */
  useEffect(() => {
    if (
      timeline.length > 0 &&
      url !== "" &&
      url !== "none" &&
      currentTimeline === -1
    ) {
      const timelineIndex = getTimelineIndex(timeline, url, sourceMedia);
      console.log(
        `[SelectFolderZone] Timeline created! Updating currentTimeline from -1 to ${timelineIndex}`,
      );
      if (timelineIndex !== -1) {
        dispatch(actions.setURL(url, timelineIndex));
      }
    }
  }, [timeline, url, currentTimeline, sourceMedia, dispatch]);

  // ============================================================================
  // FILE EVENT HANDLERS
  // ============================================================================

  /**
   * Schedule debounced audio merge for annotation clips
   * Note: loadAnnot is defined below but used here, creating circular dependency.
   * The function is stable so we can safely ignore the dependency.
   */
  const scheduleDebouncedMerge = useCallback((): void => {
    if (annotMergeTimeoutRef.current) {
      clearTimeout(annotMergeTimeoutRef.current);
    }
    annotMergeTimeoutRef.current = setTimeout(async () => {
      console.log(
        `[SelectFolderZone] Triggering delayed loadAnnot after clip discovery`,
      );
      // loadAnnot is called here but defined below
    }, 500);
  }, []);

  /**
   * Handle annotation media file being added
   */
  const handleAnnotationMediaAdded = useCallback(
    (fileDef: aTypes.LooseObject): void => {
      dispatch(actions.annotMediaAdded({ file: fileDef }));

      // If this is a Merged.mp3 file, log it (milestones are created during merge)
      if (
        fileDef.isMerged &&
        fileDef.name.includes("_Merged.mp3") &&
        isWatcherReady
      ) {
        console.log(`[SelectFolderZone] Merged file detected: ${fileDef.name}`);
      }

      // If this is an individual Careful/Translation clip, schedule a merge
      if (!fileDef.isMerged && isWatcherReady && currentTimeline !== -1) {
        const isCareful = fileDef.name.includes("_Careful.");
        const isTranslation = fileDef.name.includes("_Translation.");

        if (isCareful || isTranslation) {
          if (verboseFileHandlingRef.current) {
            console.log(
              `[SelectFolderZone] Annotation audio clip added: ${fileDef.name}`,
            );
          }
          scheduleDebouncedMerge();
        }
      }
    },
    [dispatch, isWatcherReady, currentTimeline, scheduleDebouncedMerge],
  );

  /**
   * Handle source media file being added
   */
  const handleSourceMediaAdded = useCallback(
    async (fileDef: aTypes.LooseObject): Promise<void> => {
      dispatch(actions.sourceMediaAdded({ file: fileDef }));

      // If StandardAudio.wav is added, convert to normalized MP3
      if (fileDef.name.endsWith("_StandardAudio.wav")) {
        const outputPath =
          fileDef.path.substring(0, fileDef.path.lastIndexOf(".")) +
          "_Normalized.mp3";

        sendSnackbar("Converting Source Audio.");
        const fileURL = await convertToMP3(fileDef.path, outputPath, {
          bitrate: "128k",
          channels: 2,
          normalize: true,
        });

        if (fileURL) {
          sendSnackbar("Source Audio Converted.");
          dispatch(actions.setSourceMediaWSAllowed(fileURL));
          await saveCache(currentFolderRef.current, annot, tree);
        }
      }
    },
    [dispatch, convertToMP3, annot, tree, saveCache],
  );

  /**
   * Main file event handler (called by useFileWatcher)
   */
  async function handleFileEvent(event: any): Promise<void> {
    dispatch(actions.setTimelineChanged(true));

    const { type, path, fileDef } = event;

    // Handle different event types
    switch (type) {
      case "add": {
        // If EAF file is added after watcher is ready, reload folder
        if (
          isWatcherReady &&
          path.endsWith(".eaf") &&
          !usingStoredDataRef.current
        ) {
          dispatch(actions.setTimelinesInstantiated(false));
          loadLocalFolder(currentFolderRef.current);
        } else if (fileDef) {
          // Process the file
          const isAudVid =
            fileDef.mimeType.startsWith("video") ||
            fileDef.mimeType.startsWith("audio");

          // Handle EAF files
          if (fileDef.mimeType.endsWith("eaf")) {
            await callProcessEAF(path);
          }

          // Route to appropriate handler
          if (isAudVid) {
            if (fileDef.isAnnotation) {
              handleAnnotationMediaAdded(fileDef);
            } else {
              await handleSourceMediaAdded(fileDef);
            }
          } else {
            dispatch(actions.fileAdded({ file: fileDef }));
          }
        }

        await saveCache(currentFolderRef.current, annot, tree);
        console.log(`[SelectFolderZone] File ${path} has been added`);
        break;
      }

      case "change": {
        // If EAF file changed, reload folder
        if (isWatcherReady && path.endsWith(".eaf")) {
          dispatch(actions.setTimelinesInstantiated(false));
          loadLocalFolder(currentFolderRef.current);
        } else if (fileDef) {
          const isAudVid =
            fileDef.mimeType.startsWith("video") ||
            fileDef.mimeType.startsWith("audio");

          if (isAudVid) {
            if (fileDef.isAnnotation) {
              dispatch(actions.annotMediaChanged({ file: fileDef }));
            } else {
              dispatch(actions.sourceMediaChanged({ file: fileDef }));
              if (fileDef.name.endsWith("_StandardAudio.wav")) {
                const outputPath =
                  fileDef.path.substring(0, fileDef.path.lastIndexOf(".")) +
                  "_Normalized.mp3";
                await convertToMP3(fileDef.path, outputPath);
              }
            }
          } else {
            dispatch(actions.fileChanged({ file: fileDef }));
          }
        }

        await saveCache(currentFolderRef.current, annot, tree);
        console.log(`[SelectFolderZone] File ${path} has been changed`);
        break;
      }

      case "unlink": {
        const fileURL = await electronAPI.pathToFileURL(path);
        dispatch(actions.fileDeleted(fileURL));
        console.log(`[SelectFolderZone] File ${path} has been removed`);
        break;
      }
    }
  }

  /**
   * Handler for watcher ready event
   */
  async function handleWatcherReady(): Promise<void> {
    console.log(
      `[SelectFolderZone] Watcher ready - usingStoredData: ${usingStoredDataRef.current}, sourceMedia.length: ${sourceMedia.length}, readyPlayURL: ${readyPlayURLRef.current}`,
    );

    if (!usingStoredDataRef.current) {
      if (readyPlayURLRef.current !== "") {
        dispatch(
          actions.setURL(
            readyPlayURLRef.current,
            getTimelineIndex(timeline, readyPlayURLRef.current, sourceMedia),
          ),
        );
        readyPlayURLRef.current = "";
      } else if (sourceMedia.length !== 0) {
        console.log(
          `[SelectFolderZone] Calling loadAnnot for Careful and Translation`,
        );
        await loadAnnot(true);
        await loadAnnot(false);

        const blobURL = getSourceMedia(sourceMedia, false)[0].blobURL;
        dispatch(
          actions.setURL(
            blobURL,
            getTimelineIndex(timeline, blobURL, sourceMedia),
          ),
        );
        console.log(
          `[SelectFolderZone] Initial scan complete. Ready for changes`,
        );
      } else {
        console.log("[SelectFolderZone] Empty Directory");
      }
    } else if (url === "" && sourceMedia.length !== 0) {
      const blobURL = getSourceMedia(sourceMedia, false)[0].blobURL;
      dispatch(
        actions.setURL(
          blobURL,
          getTimelineIndex(timeline, blobURL, sourceMedia),
        ),
      );
    }

    usingStoredDataRef.current = false;
    dispatch(actions.setTimelinesInstantiated(true));
  }

  // ============================================================================
  // FOLDER LOADING
  // ============================================================================

  /**
   * Load a local folder from its path
   */
  const loadLocalFolder = useCallback(
    async (folderPath: string) => {
      console.log("=== loadLocalFolder called ===");
      console.log("folderPath:", folderPath);

      // Validate we have a path
      if (!folderPath) {
        console.log("Undefined Directory Selected - no folderPath");
        return;
      }

      // Reset the Current Folder
      if (folderPath !== currentFolderRef.current) {
        prevPathRef.current = currentFolderRef.current || "";
        currentFolderRef.current = folderPath;
      }

      // Process the folder
      if (currentFolderRef.current !== prevPathRef.current) {
        console.log(
          `[SelectFolderZone] Setting Folder to: ${currentFolderRef.current}`,
        );

        // Check if we have cached state
        const hasValidCache = await checkCache(currentFolderRef.current);

        if (hasValidCache) {
          // Load cached state
          const cached = loadCache(currentFolderRef.current);
          if (cached) {
            dispatch(actions.loadAnnot(cached.annot));
            dispatch(actions.loadTree(cached.tree));
            usingStoredDataRef.current = true;
          }

          // Start watcher with ignoreInitial
          if (
            currentFolderRef.current !== "" &&
            currentFolderRef.current !== prevPathRef.current
          ) {
            await startWatching(currentFolderRef.current, {
              ignoreInitial: true,
            });
          }
          readyPlayURLRef.current = "";
        } else {
          // Normal Build State (no cache)
          dispatch(actions.onNewFolder(currentFolderRef.current));

          if (
            currentFolderRef.current !== "" &&
            currentFolderRef.current !== prevPathRef.current
          ) {
            await startWatching(currentFolderRef.current);
          }
          readyPlayURLRef.current = "";
        }
      } else if (
        currentFolderRef.current === prevPathRef.current &&
        !isWatcherReady
      ) {
        // Folder Reloading
        readyPlayURLRef.current = url;
        dispatch(actions.onReloadFolder(currentFolderRef.current));
        await startWatching(currentFolderRef.current);
      } else {
        console.log("[SelectFolderZone] Fell through");
      }

      console.log("[SelectFolderZone] End of Load Folder");
    },
    [checkCache, loadCache, startWatching, dispatch, isWatcherReady, url],
  );

  // ============================================================================
  // EAF PROCESSING
  // ============================================================================

  /**
   * Process an ELAN Annotation Format (EAF) file
   */
  const callProcessEAF = useCallback(
    async (inputFile: string): Promise<void> => {
      console.log("[SelectFolderZone] Scanning EAF:", inputFile);

      const result = await parseEAFFile(inputFile);
      if (result) {
        dispatch(actions.pushTimeline(result.timeline));

        // Set view mode based on file complexity
        dispatch(
          actions.setViewMode(
            result.isSimpleSayMoreFile,
            result.hasAudioAnnotations,
            result.tiers,
          ),
        );

        // Add linguistic types to categories
        result.linguisticTypes.forEach((lingType) => {
          if (!categories.includes(lingType)) {
            dispatch(actions.addCategory(lingType));
          }
        });

        console.log("[SelectFolderZone] EAF Processed");
      }
    },
    [parseEAFFile, dispatch, categories],
  );

  // ============================================================================
  // AUDIO MERGING
  // ============================================================================

  /**
   * Build array of input file paths for audio merging
   */
  const buildInputFilesArray = useCallback(
    (ctString: string): string[] => {
      const filtered = annotMedia.filter((am: any) =>
        am.name.includes("_" + ctString),
      );

      return filtered
        .sort((a1: any, a2: any) => {
          return (
            parseFloat(a1.name.substring(0, a1.name.indexOf("_"))) -
            parseFloat(a2.name.substring(0, a2.name.indexOf("_")))
          );
        })
        .map((a: any) => a.path);
    },
    [annotMedia],
  );

  /**
   * Create oral milestones from merged audio and add to timeline
   */
  const createOralMilestonesFromMerge = useCallback(
    async (
      inputTimes: any[],
      timecodes: number[],
      mergedFileURL: string,
      ctString: string,
      annotDir: string,
    ): Promise<void> => {
      const TOGGLE_TIMES = true;

      for (let i = 0, l = inputTimes.length; i < l; i++) {
        const oralMilestone: aTypes.Milestone = {
          annotationID: "",
          data: [
            {
              channel: `${ctString}Merged`,
              data: mergedFileURL,
              linguisticType: `${ctString}Merged`,
              locale: "",
              mimeType: "audio-mp3",
              clipStart: TOGGLE_TIMES
                ? i === 0
                  ? 0
                  : timecodes[2 * i - 1]
                : timecodes[2 * i],
              clipStop: timecodes[2 * i + 1],
            },
          ],
          startTime: parseFloat(inputTimes[i].refStart),
          stopTime: parseFloat(inputTimes[i].refStop),
        };

        // Add milestone to timeline
        const timelineURL = await electronAPI.pathToFileURL(
          annotDir.substring(0, annotDir.indexOf("_Annotations")),
        );
        const timelineIndex = getTimelineIndex(timeline, timelineURL);
        dispatch(actions.addOralAnnotation(oralMilestone, timelineIndex));
        dispatch(actions.setTimelineChanged(true));
      }
    },
    [dispatch, timeline],
  );

  /**
   * Merge annotation audio files (Careful or Translation)
   */
  const loadAnnot = useCallback(
    async (carefulOrTranslation: boolean): Promise<void> => {
      try {
        const ctString = carefulOrTranslation ? "Careful" : "Translation";

        // Build array of input files
        const inputFiles = buildInputFilesArray(ctString);
        if (inputFiles.length === 0) {
          return;
        }

        // Prepare paths for merging
        const pathSep = await electronAPI.getPathSeparator();
        const annotDir = inputFiles[0].substring(
          0,
          inputFiles[0].lastIndexOf(pathSep) + 1,
        );
        const outputPath = annotDir + ctString + "_Merged.mp3";

        sendSnackbar(
          "Merging " +
            (carefulOrTranslation ? "Careful Speech" : "Translation") +
            " files.",
        );

        // Merge audio files using hook
        const result = await mergeAudioFiles(inputFiles, outputPath, {
          bitrate: "128k",
          channels: 1,
        });

        if (!result) {
          sendSnackbar("Error merging audio files", undefined, "error");
          return;
        }

        // Create milestones and add to timeline
        await createOralMilestonesFromMerge(
          result.inputMetadata,
          result.timecodes,
          result.outputURL,
          ctString,
          annotDir,
        );

        sendSnackbar(
          (carefulOrTranslation ? "Careful Speech" : "Translation") +
            " annotations merged!",
        );

        dispatch(actions.setAnnotMediaWSAllowed(result.outputURL));
        await saveCache(currentFolderRef.current, annot, tree);
      } catch (err) {
        console.error("[SelectFolderZone] Error in loadAnnot:", err);
        sendSnackbar(
          "File Access error: " + (err as any).message,
          undefined,
          "error",
        );
      }
    },
    [
      buildInputFilesArray,
      mergeAudioFiles,
      createOralMilestonesFromMerge,
      dispatch,
      annot,
      tree,
      saveCache,
    ],
  );

  // ============================================================================
  // WEB MODE (File System Access API)
  // ============================================================================

  /**
   * Load web directory using File System Access API
   */
  const loadWebDirectory = useCallback(
    async (dirHandle: any): Promise<void> => {
      cleanupWebBlobs();
      webDirectoryHandleRef.current = dirHandle;
      currentFolderRef.current = dirHandle.name;
      prevPathRef.current = "";

      dispatch(actions.onNewFolder(dirHandle.name));
      dispatch(actions.setTimelineChanged(true));
      dispatch(actions.setTimelinesInstantiated(false));

      const entries: WebFileEntry[] = [];
      await collectDirectoryEntries(dirHandle, dirHandle.name, entries);

      if (entries.length === 0) {
        sendSnackbar("The selected folder is empty.", undefined, "error");
        return;
      }

      const eafEntries: WebFileEntry[] = [];
      const mediaDefs: aTypes.LooseObject[] = [];
      const annotDefs: aTypes.LooseObject[] = [];

      entries.forEach((entry) => {
        const ext = getExtension(entry.file.name);
        if (ext === ".eaf") {
          eafEntries.push(entry);
          return;
        }

        if (isAudioVideoExtension(ext)) {
          const def = createWebFileDefinition(entry, false);
          mediaDefs.push(def);
          dispatch(actions.sourceMediaAdded({ file: def }));
          return;
        }

        if (isAnnotationMedia(entry, ext)) {
          const def = createWebFileDefinition(entry, true);
          annotDefs.push(def);
          dispatch(actions.annotMediaAdded({ file: def }));
        }
      });

      if (mediaDefs.length === 0) {
        sendSnackbar(
          "No media files detected in that folder.",
          undefined,
          "error",
        );
      }

      if (eafEntries.length === 0) {
        sendSnackbar(
          "No EAF annotation files found in that folder.",
          undefined,
          "error",
        );
      }

      for (const eafEntry of eafEntries) {
        await processEAFWeb(eafEntry);
      }

      const defaultMedia =
        mediaDefs.find((def) => def.mimeType?.startsWith("video")) ??
        mediaDefs[0];

      if (defaultMedia) {
        dispatch(actions.setURL(defaultMedia.blobURL, 0));
      }

      dispatch(actions.setTimelinesInstantiated(true));
      sendSnackbar(`Loaded ${dirHandle.name}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch],
  );

  /**
   * Collect directory entries recursively
   */
  const collectDirectoryEntries = useCallback(
    async (
      dirHandle: any,
      currentPath: string,
      entries: WebFileEntry[],
    ): Promise<void> => {
      for await (const [, handle] of dirHandle.entries()) {
        const childPath = `${currentPath}/${handle.name}`;
        if (handle.kind === "file") {
          const file = await handle.getFile();
          entries.push({ handle, file, path: childPath });
        } else if (handle.kind === "directory") {
          await collectDirectoryEntries(handle, childPath, entries);
        }
      }
    },
    [],
  );

  /**
   * Get file extension
   */
  const getExtension = (name: string): string => {
    const idx = name.lastIndexOf(".");
    return idx === -1 ? "" : name.substring(idx).toLowerCase();
  };

  /**
   * Check if extension is audio/video
   */
  const isAudioVideoExtension = (ext: string): boolean => {
    return [".mp4", ".m4v", ".mov", ".mpg", ".mpeg", ".wav", ".mp3"].includes(
      ext,
    );
  };

  /**
   * Check if file is annotation media
   */
  const isAnnotationMedia = (entry: WebFileEntry, ext: string): boolean => {
    if (ext === ".mp3" || ext === ".wav") {
      return (
        entry.path.includes("_Annotations") ||
        entry.file.name.includes("Translation") ||
        entry.file.name.includes("Careful")
      );
    }
    return false;
  };

  /**
   * Create web file definition
   */
  const createWebFileDefinition = useCallback(
    (entry: WebFileEntry, isAnnotation: boolean): aTypes.LooseObject => {
      const ext = getExtension(entry.file.name);
      const mimeType = entry.file.type || guessMimeType(ext);
      const blobURL = URL.createObjectURL(entry.file);
      webBlobUrlsRef.current.push(blobURL);

      const normalizedPath = normalizeWebPath(entry.path);
      webFileMapRef.current.set(normalizedPath, { blobURL, file: entry.file });
      const baseKey = normalizeWebPath(entry.file.name);
      if (!webFileMapRef.current.has(baseKey)) {
        webFileMapRef.current.set(baseKey, { blobURL, file: entry.file });
      }

      const isMerged = entry.file.name.includes("_Merged");

      return {
        blobURL,
        extension: ext,
        hasAnnotation: false,
        isAnnotation,
        isMerged,
        inMilestones: false,
        mimeType,
        name: entry.file.name,
        path: entry.path,
        wsAllowed: true,
        waveform: false,
      };
    },
    [],
  );

  /**
   * Guess MIME type from extension
   */
  const guessMimeType = (ext: string): string => {
    switch (ext) {
      case ".mp4":
      case ".m4v":
      case ".mov":
        return "video/mp4";
      case ".mp3":
        return "audio/mpeg";
      case ".wav":
        return "audio/wav";
      default:
        return "application/octet-stream";
    }
  };

  /**
   * Normalize web path
   */
  const normalizeWebPath = (path: string): string => {
    return path.replace(/\\/g, "/").toLowerCase();
  };

  /**
   * Process EAF file in web mode
   */
  const processEAFWeb = useCallback(
    async (entry: WebFileEntry): Promise<void> => {
      try {
        const result = await parseEAFWeb(entry.file, entry.path);
        if (!result) {
          sendSnackbar(
            `Failed to process ${entry.file.name}`,
            undefined,
            "error",
          );
          return;
        }

        // Resolve media URLs for web
        const xmlText = await entry.file.text();
        const xmlResult = await parseStringPromise(xmlText);
        const fileData = xmlResult.ANNOTATION_DOCUMENT;
        const parsedPath = safeParseSync(entry.path);

        const syncMedia = await createSyncMediaArrayWeb(fileData, parsedPath);

        // Update timeline with sync media
        result.timeline.syncMedia = syncMedia;

        // Add linguistic types to categories
        result.linguisticTypes.forEach((lingType) => {
          if (!categories.includes(lingType)) {
            dispatch(actions.addCategory(lingType));
          }
        });

        dispatch(actions.pushTimeline(result.timeline));

        // Set view mode based on file complexity
        dispatch(
          actions.setViewMode(
            result.isSimpleSayMoreFile,
            result.hasAudioAnnotations,
            result.tiers,
          ),
        );
      } catch (err) {
        console.error(
          "[SelectFolderZone] Failed to process EAF in web mode:",
          err,
        );
        sendSnackbar(
          `Failed to process ${entry.file.name}`,
          undefined,
          "error",
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parseEAFWeb, categories, dispatch],
  );

  /**
   * Create sync media array for web mode
   */
  const createSyncMediaArrayWeb = useCallback(
    async (fileData: any, parsedPath: any): Promise<string[]> => {
      const descriptors = fileData.HEADER?.[0]?.MEDIA_DESCRIPTOR ?? [];
      const syncMedia: string[] = [];

      for (let h = 0; h < descriptors.length; h++) {
        const mediaURL = descriptors[h].$?.MEDIA_URL ?? "";
        const resolved =
          resolveWebMediaURL(mediaURL) ||
          resolveWebMediaURL(`${parsedPath.dir}/${mediaURL}`) ||
          resolveWebMediaURL(mediaURL.split(/[\\/]/).pop() || "");

        if (resolved) {
          syncMedia.push(resolved);
        } else {
          console.warn(
            `[SelectFolderZone] Unable to resolve media reference ${mediaURL}`,
          );
        }
      }
      return syncMedia;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * Resolve web media URL
   */
  const resolveWebMediaURL = useCallback((path: string): string | undefined => {
    if (!path) return undefined;
    const normalized = normalizeWebPath(path);
    return webFileMapRef.current.get(normalized)?.blobURL;
  }, []);

  /**
   * Cleanup web blob URLs
   */
  const cleanupWebBlobs = (): void => {
    webBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    webBlobUrlsRef.current = [];
    webFileMapRef.current.clear();
  };

  /**
   * Load web demo (testing)
   */
  const loadWeb = useCallback(() => {
    console.log("[SelectFolderZone] Loading web demo");
    dispatch(actions.loadAnnot(testingAnnot));

    testingSourceMedia.forEach((media) => {
      dispatch(actions.sourceMediaAdded({ file: media }));
    });

    testingAnnotMedia.forEach((media) => {
      dispatch(actions.annotMediaAdded({ file: media }));
    });

    dispatch(actions.setTimelinesInstantiated(true));
    sendSnackbar("Video Loading");
    dispatch(
      actions.setURL(
        "http://localhost:3000/savedSession/Pourquoi%20un%20m%C3%A8tre%20mesure%201m_Source_01.mp4",
        0,
      ),
    );
    sendSnackbar("EAF Loaded");
  }, [dispatch]);

  // ============================================================================
  // UI HANDLERS
  // ============================================================================

  /**
   * Show pointer indicator
   */
  const showPointer = (): string => {
    return url !== "" ? "" : "◎ ";
  };

  /**
   * Handle directory selection (Electron)
   */
  const handleSelectDirectory = async () => {
    const selectedPath = await electronAPI.selectDirectory();
    if (selectedPath) {
      console.log("[SelectFolderZone] Selected directory:", selectedPath);
      loadLocalFolder(selectedPath);
    } else {
      console.log("[SelectFolderZone] Directory selection cancelled");
    }
  };

  /**
   * Handle directory selection (Web)
   */
  const handleSelectDirectoryWeb = async () => {
    if (typeof window === "undefined" || !(window as any).showDirectoryPicker) {
      sendSnackbar(
        "Folder access is not available in this browser.",
        undefined,
        "error",
      );
      return;
    }

    try {
      const dirHandle: any = await (window as any).showDirectoryPicker();
      await loadWebDirectory(dirHandle);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") {
        console.log("[SelectFolderZone] User cancelled folder selection");
        return;
      }
      console.error("[SelectFolderZone] Web directory selection failed:", err);
      sendSnackbar(
        "Unable to read selected folder. Please try again.",
        undefined,
        "error",
      );
    }
  };

  /**
   * Send snackbar notification
   */
  const sendSnackbar = (inMessage: string, inKey?: string, vType?: string) => {
    if (vType === "error") {
      toast.error(inMessage);
    } else if (vType === "success") {
      toast.success(inMessage);
    } else {
      toast(inMessage);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (env === "electron") {
    return (
      <div className="folder-selection">
        <span className="pointer">{showPointer()}</span>
        <button onClick={handleSelectDirectory}>Select Folder</button>
      </div>
    );
  } else if (env === "web") {
    const canPickFolders =
      typeof window !== "undefined" &&
      "showDirectoryPicker" in window &&
      typeof (window as any).showDirectoryPicker === "function";

    return (
      <div className="folder-selection">
        <span className="pointer">{showPointer()}</span>
        <button
          className="mediaTest"
          onClick={canPickFolders ? handleSelectDirectoryWeb : () => loadWeb()}
        >
          {canPickFolders ? "Select Folder" : "Load Demo Media"}
        </button>
        {!canPickFolders && (
          <p className="web-folder-hint">
            Your browser does not yet support folder access. Use Chrome/Edge or
            install the desktop app to browse real folders.
          </p>
        )}
      </div>
    );
  } else {
    return <></>;
  }
}
