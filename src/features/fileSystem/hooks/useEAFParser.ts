/**
 * EAF Parser Hook
 *
 * Parses ELAN Annotation Format (EAF) files and extracts:
 * - Synchronized media references
 * - Time-aligned annotations
 * - Linguistic tiers and types
 *
 * @module hooks/useEAFParser
 */

import { useState, useCallback } from "react";
import { electronAPI } from "../../../utils/electronAPI";
import { safeParseSync } from "../../../components/globalFunctions";
import { parseStringPromise } from "xml2js";
import Timelines from "../../../components/FolderSelection/Timelines";

/**
 * Parsed EAF data structure
 */
export interface ParsedEAFData {
  /**
   * Timeline object containing all annotations
   */
  timeline: any;
  /**
   * Array of synchronized media URLs
   */
  syncMedia: string[];
  /**
   * Array of linguistic types found in the file
   */
  linguisticTypes: string[];
  /**
   * Base name of the EAF file
   */
  timelineBase: string;
}

/**
 * EAF parser hook return type
 */
export interface UseEAFParserReturn {
  /**
   * Whether currently parsing an EAF file
   */
  isParsing: boolean;
  /**
   * Last error that occurred during parsing
   */
  error: Error | null;
  /**
   * Parse an EAF file (Electron environment)
   */
  parseEAFFile: (filePath: string) => Promise<ParsedEAFData | null>;
  /**
   * Parse an EAF file from web File object
   */
  parseEAFWeb: (file: File, filePath: string) => Promise<ParsedEAFData | null>;
  /**
   * Clear the last error
   */
  clearError: () => void;
}

/**
 * useEAFParser Hook
 *
 * Provides EAF file parsing capabilities for both Electron and Web environments.
 * Handles XML parsing, media URL resolution, and timeline creation.
 *
 * @returns EAF parser state and methods
 *
 * @example
 * ```typescript
 * const { parseEAFFile, isParsing, error } = useEAFParser();
 *
 * const result = await parseEAFFile('/path/to/file.eaf');
 * if (result) {
 *   console.log('Timeline:', result.timeline);
 *   console.log('Media:', result.syncMedia);
 * }
 * ```
 */
export function useEAFParser(): UseEAFParserReturn {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Find time value (in milliseconds) for a given TIME_SLOT_ID
   */
  const findTimeSlot = useCallback(
    (timeSlotPointer: any[], timeSlotRef: string): number => {
      for (let i = 0, l = timeSlotPointer.length; i < l; i++) {
        if (timeSlotPointer[i].$.TIME_SLOT_ID === timeSlotRef) {
          return timeSlotPointer[i].$.TIME_VALUE;
        }
      }
      return -1;
    },
    [],
  );

  /**
   * Find annotation time by looking up a referenced annotation ID
   */
  const findAnnotationTime = useCallback(
    (miles: any[], annotationRef: string, startOrStop: string): number => {
      for (let i = 0, l = miles.length; i < l; i++) {
        if (miles[i]["annotationID"] === annotationRef) {
          return miles[i][startOrStop];
        }
      }
      return -1;
    },
    [],
  );

  /**
   * Process an ALIGNABLE_ANNOTATION and create a milestone
   */
  const processAlignableAnnotation = useCallback(
    (
      annotation: any,
      tierData: any,
      timeSlotPointer: any[],
      timelineBase: string,
    ): any => {
      const alAnnPointer = annotation.ALIGNABLE_ANNOTATION[0];
      return {
        annotationID: alAnnPointer.$.ANNOTATION_ID,
        data: [
          {
            channel: tierData.$.TIER_ID,
            linguisticType: tierData.$.LINGUISTIC_TYPE_REF + "_text",
            data: alAnnPointer.ANNOTATION_VALUE[0],
            locale: tierData.$.DEFAULT_LOCALE,
            mimeType: "string",
          },
        ],
        startTime:
          findTimeSlot(timeSlotPointer, alAnnPointer.$.TIME_SLOT_REF1) / 1000,
        startId: alAnnPointer.$.TIME_SLOT_REF1,
        stopTime:
          findTimeSlot(timeSlotPointer, alAnnPointer.$.TIME_SLOT_REF2) / 1000,
        stopId: alAnnPointer.$.TIME_SLOT_REF2,
        timeline: timelineBase,
      };
    },
    [findTimeSlot],
  );

  /**
   * Process a REF_ANNOTATION and create a milestone
   */
  const processRefAnnotation = useCallback(
    (
      annotation: any,
      tierData: any,
      miles: any[],
      timelineBase: string,
    ): any => {
      const refAnnPointer = annotation.REF_ANNOTATION[0];

      // Only process if it has actual text
      if (refAnnPointer.ANNOTATION_VALUE[0] === "") {
        return null;
      }

      return {
        annotationID: refAnnPointer.$.ANNOTATION_ID,
        data: [
          {
            channel: tierData.$.LINGUISTIC_TYPE_REF,
            data: refAnnPointer.ANNOTATION_VALUE[0],
            linguisticType: tierData.$.TIER_ID + "_text",
            locale: tierData.$.DEFAULT_LOCALE,
            mimeType: "string",
          },
        ],
        startId: refAnnPointer.$.TIME_SLOT_REF1,
        startTime: findAnnotationTime(
          miles,
          refAnnPointer.$.ANNOTATION_REF,
          "startTime",
        ),
        stopId: refAnnPointer.$.TIME_SLOT_REF2,
        stopTime: findAnnotationTime(
          miles,
          refAnnPointer.$.ANNOTATION_REF,
          "stopTime",
        ),
        timeline: timelineBase,
      };
    },
    [findAnnotationTime],
  );

  /**
   * Process all tiers and annotations in the EAF file
   */
  const processTiersAndAnnotations = useCallback(
    (
      fileData: any,
      timeSlotPointer: any[],
      timelineBase: string,
      tempTimeline: any,
    ): { miles: any[]; linguisticTypes: string[] } => {
      const miles: any[] = [];
      const linguisticTypes: string[] = [];

      for (let j = 0, l = fileData.TIER.length; j < l; j++) {
        const tier = fileData.TIER[j];

        // Track linguistic type
        const lingType = tier.$.LINGUISTIC_TYPE_REF + "_text";
        if (!linguisticTypes.includes(lingType)) {
          linguisticTypes.push(lingType);
        }

        // Process all annotations in this tier
        for (let k = 0, l2 = tier.ANNOTATION.length; k < l2; k++) {
          const annotation = tier.ANNOTATION[k];
          let milestone = null;

          if ("ALIGNABLE_ANNOTATION" in annotation) {
            milestone = processAlignableAnnotation(
              annotation,
              tier,
              timeSlotPointer,
              timelineBase,
            );
            miles.push(milestone);
            tempTimeline.addMilestone(milestone);
          } else if ("REF_ANNOTATION" in annotation) {
            milestone = processRefAnnotation(
              annotation,
              tier,
              miles,
              timelineBase,
            );
            if (milestone !== null) {
              tempTimeline.addMilestone(milestone);
            }
          }
        }
      }

      return { miles, linguisticTypes };
    },
    [processAlignableAnnotation, processRefAnnotation],
  );

  /**
   * Build array of synchronized media URLs from EAF file header (Electron)
   */
  const createSyncMediaArray = useCallback(
    async (fileData: any, parsedPath: any): Promise<string[]> => {
      const syncMedia: string[] = [];
      for (
        let h = 0, l = fileData.HEADER[0].MEDIA_DESCRIPTOR.length;
        h < l;
        h++
      ) {
        const mediaURL = await electronAPI.pathToFileURL(
          parsedPath.dir +
            "/" +
            fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL,
        );
        syncMedia.push(mediaURL);
      }
      return syncMedia;
    },
    [],
  );

  /**
   * Parse an EAF file in Electron environment
   */
  const parseEAFFile = useCallback(
    async (filePath: string): Promise<ParsedEAFData | null> => {
      setIsParsing(true);
      setError(null);

      try {
        // Parse EAF file using secure API
        const content = await electronAPI.parseEAF(filePath);
        const fileData = content.ANNOTATION_DOCUMENT;
        const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
        const parsedPath = safeParseSync(filePath);

        // Build synchronized media array
        const syncMedia = await createSyncMediaArray(fileData, parsedPath);

        // Create timeline
        const eafFileURL = await electronAPI.pathToFileURL(filePath);
        const tempTimeline = new Timelines({
          syncMedia,
          eafFile: eafFileURL,
        });

        // Process all tiers and annotations
        const { linguisticTypes } = processTiersAndAnnotations(
          fileData,
          timeSlotPointer,
          parsedPath.base,
          tempTimeline,
        );

        console.log("[useEAFParser] EAF file processed successfully");

        setIsParsing(false);
        return {
          timeline: tempTimeline,
          syncMedia,
          linguisticTypes,
          timelineBase: parsedPath.base,
        };
      } catch (err) {
        console.error("[useEAFParser] Error processing EAF:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsParsing(false);
        return null;
      }
    },
    [createSyncMediaArray, processTiersAndAnnotations],
  );

  /**
   * Parse an EAF file in web environment from File object
   */
  const parseEAFWeb = useCallback(
    async (file: File, filePath: string): Promise<ParsedEAFData | null> => {
      setIsParsing(true);
      setError(null);

      try {
        const xmlText = await file.text();
        const result = await parseStringPromise(xmlText);
        const fileData = result.ANNOTATION_DOCUMENT;
        const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
        const parsedPath = safeParseSync(filePath);

        // For web, media URLs are resolved separately by the caller
        const syncMedia: string[] = [];

        // Create blob URL for EAF file
        const eafBlob = URL.createObjectURL(file);

        // Create timeline
        const tempTimeline = new Timelines({
          syncMedia,
          eafFile: eafBlob,
        });

        // Process all tiers and annotations
        const { linguisticTypes } = processTiersAndAnnotations(
          fileData,
          timeSlotPointer,
          parsedPath.base,
          tempTimeline,
        );

        console.log("[useEAFParser] EAF file processed successfully (web)");

        setIsParsing(false);
        return {
          timeline: tempTimeline,
          syncMedia,
          linguisticTypes,
          timelineBase: parsedPath.base,
        };
      } catch (err) {
        console.error("[useEAFParser] Error processing EAF (web):", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsParsing(false);
        return null;
      }
    },
    [processTiersAndAnnotations],
  );

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isParsing,
    error,
    parseEAFFile,
    parseEAFWeb,
    clearError,
  };
}
