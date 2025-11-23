/**
 * Local State Cache Hook
 *
 * Manages localStorage-based caching for folder state.
 * Enables quick restoration of previously loaded folders
 * by caching directory snapshots, annotations, and tree state.
 *
 * @module hooks/useLocalStateCache
 */

import { useState, useCallback, useEffect } from "react";
import { electronAPI } from "../../../utils/electronAPI";
import * as aTypes from "../../../store/annot/types";
import * as tTypes from "../../../store/tree/types";

/**
 * Cached folder state
 */
export interface CachedFolderState {
  /**
   * Directory snapshot (file listing)
   */
  dirSnapshot: string;
  /**
   * Annotation state
   */
  annot: aTypes.AnnotationState;
  /**
   * Tree state (file tree)
   */
  tree: tTypes.TreeState;
  /**
   * Timestamp when cached
   */
  timestamp: number;
}

/**
 * Local state cache hook return type
 */
export interface UseLocalStateCacheReturn {
  /**
   * Whether the folder has valid cached state
   */
  hasCache: boolean;
  /**
   * Whether currently checking/loading cache
   */
  isLoading: boolean;
  /**
   * Check if folder has valid cached state
   */
  checkCache: (folderPath: string) => Promise<boolean>;
  /**
   * Load cached state for a folder
   */
  loadCache: (folderPath: string) => CachedFolderState | null;
  /**
   * Save current state to cache
   */
  saveCache: (
    folderPath: string,
    annot: aTypes.AnnotationState,
    tree: tTypes.TreeState,
  ) => Promise<boolean>;
  /**
   * Clear cache for a specific folder
   */
  clearCache: (folderPath: string) => void;
  /**
   * Clear all cached folders
   */
  clearAllCaches: () => void;
  /**
   * Get directory snapshot for comparison
   */
  getDirectorySnapshot: (folderPath: string) => Promise<string>;
}

/**
 * useLocalStateCache Hook
 *
 * Provides localStorage-based caching for folder state.
 * Automatically validates cache against current directory state
 * to detect changes and avoid stale data.
 *
 * @returns Cache state and methods
 *
 * @example
 * ```typescript
 * const { checkCache, loadCache, saveCache } = useLocalStateCache();
 *
 * // Check if folder has valid cache
 * const hasValidCache = await checkCache('/path/to/folder');
 *
 * if (hasValidCache) {
 *   // Load cached state
 *   const cached = loadCache('/path/to/folder');
 *   if (cached) {
 *     dispatch(loadAnnot(cached.annot));
 *     dispatch(loadTree(cached.tree));
 *   }
 * } else {
 *   // Scan folder and save cache
 *   // ... perform folder scan ...
 *   await saveCache('/path/to/folder', annotState, treeState);
 * }
 * ```
 */
export function useLocalStateCache(): UseLocalStateCacheReturn {
  const [hasCache, setHasCache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get directory snapshot for comparison
   */
  const getDirectorySnapshot = useCallback(
    async (folderPath: string): Promise<string> => {
      if (!folderPath) {
        throw new Error(
          "[useLocalStateCache] Directory path is required for snapshot",
        );
      }
      return await electronAPI.getDirectorySnapshot(folderPath);
    },
    [],
  );

  /**
   * Check if folder has valid cached state
   *
   * Validates that:
   * 1. Cache exists in localStorage
   * 2. Directory snapshot matches current state
   * 3. Timeline data exists
   */
  const checkCache = useCallback(
    async (folderPath: string): Promise<boolean> => {
      if (!folderPath) {
        return false;
      }

      setIsLoading(true);

      try {
        // Get current directory state
        const currentSnapshot = await getDirectorySnapshot(folderPath);

        // Check if cache exists
        const cachedSnapshot = localStorage.getItem(`Prestige.${folderPath}`);
        const cachedAnnot = localStorage.getItem(
          `Prestige.annot.${folderPath}`,
        );
        const cachedTree = localStorage.getItem(`Prestige.tree.${folderPath}`);

        if (!cachedSnapshot || !cachedAnnot || !cachedTree) {
          console.log("[useLocalStateCache] No cache found for folder");
          setHasCache(false);
          setIsLoading(false);
          return false;
        }

        // Compare snapshots
        if (cachedSnapshot !== currentSnapshot) {
          console.log(
            "[useLocalStateCache] Cache is stale (directory changed)",
          );

          // Log differences for debugging
          try {
            const oldDir = JSON.parse(cachedSnapshot);
            const newDir = JSON.parse(currentSnapshot);
            const diffs = newDir.filter((item: any) => !oldDir.includes(item));
            if (diffs.length > 0) {
              console.log("[useLocalStateCache] Differences:", diffs);
            }
          } catch (err) {
            console.warn(
              "[useLocalStateCache] Error comparing snapshots:",
              err,
            );
          }

          setHasCache(false);
          setIsLoading(false);
          return false;
        }

        // Verify timeline exists in cached annot
        const annotState = JSON.parse(cachedAnnot);
        if (!annotState.timeline || annotState.timeline.length === 0) {
          console.log("[useLocalStateCache] Cache invalid (no timeline)");
          setHasCache(false);
          setIsLoading(false);
          return false;
        }

        console.log("[useLocalStateCache] Valid cache found");
        setHasCache(true);
        setIsLoading(false);
        return true;
      } catch (err) {
        console.error("[useLocalStateCache] Error checking cache:", err);
        setHasCache(false);
        setIsLoading(false);
        return false;
      }
    },
    [getDirectorySnapshot],
  );

  /**
   * Load cached state for a folder
   */
  const loadCache = useCallback(
    (folderPath: string): CachedFolderState | null => {
      if (!folderPath) {
        return null;
      }

      try {
        const cachedSnapshot = localStorage.getItem(`Prestige.${folderPath}`);
        const cachedAnnot = localStorage.getItem(
          `Prestige.annot.${folderPath}`,
        );
        const cachedTree = localStorage.getItem(`Prestige.tree.${folderPath}`);
        const cachedTime = localStorage.getItem("Prestige.time");

        if (!cachedSnapshot || !cachedAnnot || !cachedTree) {
          return null;
        }

        const annot = JSON.parse(cachedAnnot);
        const tree = JSON.parse(cachedTree);
        const timestamp = cachedTime ? parseInt(cachedTime, 10) : Date.now();

        console.log("[useLocalStateCache] Loaded cache from localStorage");

        return {
          dirSnapshot: cachedSnapshot,
          annot,
          tree,
          timestamp,
        };
      } catch (err) {
        console.error("[useLocalStateCache] Error loading cache:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Save current state to cache
   */
  const saveCache = useCallback(
    async (
      folderPath: string,
      annot: aTypes.AnnotationState,
      tree: tTypes.TreeState,
    ): Promise<boolean> => {
      if (!folderPath) {
        console.warn("[useLocalStateCache] Cannot save cache: no folder path");
        return false;
      }

      // Only save if we have timeline data and source media
      if (!annot.timeline || annot.timeline.length === 0) {
        console.warn(
          "[useLocalStateCache] Cannot save cache: no timeline data",
        );
        return false;
      }

      if (!tree.sourceMedia || tree.sourceMedia.length === 0) {
        console.warn("[useLocalStateCache] Cannot save cache: no source media");
        return false;
      }

      try {
        // Get directory snapshot
        const snapshot = await getDirectorySnapshot(folderPath);

        // Save to localStorage
        localStorage.setItem(`Prestige.${folderPath}`, snapshot);
        localStorage.setItem(
          `Prestige.tree.${folderPath}`,
          JSON.stringify(tree),
        );
        localStorage.setItem(
          `Prestige.annot.${folderPath}`,
          JSON.stringify(annot),
        );

        // Save timestamp
        const time = Date.now();
        localStorage.setItem("Prestige.time", time.toString());

        console.log("[useLocalStateCache] Saved cache to localStorage");
        setHasCache(true);
        return true;
      } catch (err) {
        console.error("[useLocalStateCache] Error saving cache:", err);
        return false;
      }
    },
    [getDirectorySnapshot],
  );

  /**
   * Clear cache for a specific folder
   */
  const clearCache = useCallback((folderPath: string) => {
    if (!folderPath) {
      return;
    }

    localStorage.removeItem(`Prestige.${folderPath}`);
    localStorage.removeItem(`Prestige.annot.${folderPath}`);
    localStorage.removeItem(`Prestige.tree.${folderPath}`);
    console.log(`[useLocalStateCache] Cleared cache for ${folderPath}`);
    setHasCache(false);
  }, []);

  /**
   * Clear all cached folders
   */
  const clearAllCaches = useCallback(() => {
    const keysToRemove: string[] = [];

    // Find all Prestige cache keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("Prestige.")) {
        keysToRemove.push(key);
      }
    }

    // Remove all cache keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log(
      `[useLocalStateCache] Cleared ${keysToRemove.length} cache entries`,
    );
    setHasCache(false);
  }, []);

  // Clean up stale caches on mount (optional)
  useEffect(() => {
    // Could implement cleanup of old caches here if needed
    // For now, we just log
    console.log("[useLocalStateCache] Hook initialized");
  }, []);

  return {
    hasCache,
    isLoading,
    checkCache,
    loadCache,
    saveCache,
    clearCache,
    clearAllCaches,
    getDirectorySnapshot,
  };
}
