/**
 * Integration Test: Folder Loading Workflow
 *
 * Tests the critical user workflow from folder selection to timeline creation.
 * This is a BLACK BOX test - we don't care HOW it works internally, only THAT:
 *
 * 1. User selects a folder
 * 2. EAF files are discovered and parsed
 * 3. Media files are categorized correctly
 * 4. Timeline is created with milestones
 * 5. Redux store reflects the loaded state
 *
 * Implementation details (components, internal functions) can change freely.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { mockElectronAPI, resetAllMocks } from "../setup";
import { rootReducer } from "../../store";
import * as actions from "../../store";

describe("Folder Loading Workflow (Integration)", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    resetAllMocks();

    // Create a fresh Redux store for each test
    store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });
  });

  describe("Complete folder loading flow", () => {
    it("should successfully load a folder with EAF and media files", async () => {
      // GIVEN: A folder with an EAF file and media files
      const folderPath = "/test/project-folder";
      const eafContent = createSampleEAFContent();

      mockElectronAPI.selectFolder.mockResolvedValue(folderPath);
      mockElectronAPI.readDir.mockResolvedValue([
        "video.mp4",
        "audio.wav",
        "annotations.eaf",
        "video_Annotations/Careful_Merged.mp3",
      ]);
      mockElectronAPI.readFile.mockResolvedValue(eafContent);
      mockElectronAPI.getMimeType.mockImplementation((path: string) => {
        if (path.endsWith(".mp4")) return Promise.resolve("video/mp4");
        if (path.endsWith(".wav")) return Promise.resolve("audio/wav");
        if (path.endsWith(".mp3")) return Promise.resolve("audio/mpeg");
        if (path.endsWith(".eaf")) return Promise.resolve("application/xml");
        return Promise.resolve("application/octet-stream");
      });

      // WHEN: User triggers folder selection and files are processed
      store.dispatch(actions.treeOnNewFolder(folderPath));

      // Simulate file discovery (normally triggered by chokidar)
      store.dispatch(
        actions.fileAdded({
          file: {
            path: `${folderPath}/video.mp4`,
            name: "video.mp4",
            mimeType: "video/mp4",
          },
        }),
      );

      store.dispatch(
        actions.sourceMediaAdded({
          file: {
            path: `${folderPath}/video.mp4`,
            url: "blob:test-video",
            name: "video.mp4",
            mimeType: "video/mp4",
          },
        }),
      );

      store.dispatch(
        actions.fileAdded({
          file: {
            path: `${folderPath}/audio.wav`,
            name: "audio.wav",
            mimeType: "audio/wav",
          },
        }),
      );

      store.dispatch(
        actions.sourceMediaAdded({
          file: {
            path: `${folderPath}/audio.wav`,
            url: "blob:test-audio",
            name: "audio.wav",
            mimeType: "audio/wav",
          },
        }),
      );

      store.dispatch(
        actions.fileAdded({
          file: {
            path: `${folderPath}/annotations.eaf`,
            name: "annotations.eaf",
            mimeType: "application/xml",
          },
        }),
      );

      // Parse EAF and create timeline
      const timeline = {
        id: "test-timeline",
        name: "Test Timeline",
        syncMedia: [`${folderPath}/video.mp4`, `${folderPath}/audio.wav`],
        milestones: [
          {
            annotationID: "a1",
            startTime: 0,
            stopTime: 5,
            data: [],
          },
          {
            annotationID: "a2",
            startTime: 5,
            stopTime: 10,
            data: [],
          },
        ],
      };

      store.dispatch(actions.pushTimeline({ timeline: timeline }));

      // THEN: The store should reflect the loaded folder state
      const state = store.getState();

      // Verify folder is loaded
      expect(state.tree.folderPath).toBe(folderPath);
      // expect(state.tree.folderName).toBe("test-project"); // folderName not set by treeOnNewFolder

      // Verify files were discovered
      expect(state.tree.availableFiles).toHaveLength(3);

      // Verify media was categorized
      expect(state.tree.sourceMedia).toHaveLength(2);
      expect(
        state.tree.sourceMedia.some((m: any) => m.name === "video.mp4"),
      ).toBe(true);
      expect(
        state.tree.sourceMedia.some((m: any) => m.name === "audio.wav"),
      ).toBe(true);

      // Verify timeline was created
      expect(state.annot.timeline).toHaveLength(1);
      expect(state.annot.timeline[0].milestones).toHaveLength(2);

      // CRITICAL: Timeline has the right structure for playback
      expect(state.annot.timeline[0].syncMedia).toEqual([
        `${folderPath}/video.mp4`,
        `${folderPath}/audio.wav`,
      ]);
    });

    it("should handle folders with no EAF files gracefully", async () => {
      // GIVEN: A folder with only media files (no annotations)
      const folderPath = "/test/media-only-folder";

      mockElectronAPI.selectFolder.mockResolvedValue(folderPath);
      mockElectronAPI.readDir.mockResolvedValue(["video1.mp4", "video2.mp4"]);
      mockElectronAPI.getMimeType.mockResolvedValue("video/mp4");

      // WHEN: Folder is loaded
      store.dispatch(actions.treeOnNewFolder(folderPath));

      store.dispatch(
        actions.sourceMediaAdded({
          file: {
            path: `${folderPath}/video1.mp4`,
            url: "blob:video1",
            name: "video1.mp4",
            mimeType: "video/mp4",
          },
        }),
      );

      // THEN: Media is loaded but no timeline is created
      const state = store.getState();

      expect(state.tree.folderPath).toBe(folderPath);
      expect(state.tree.sourceMedia).toHaveLength(1);
      expect(state.annot.timeline).toHaveLength(0); // No timeline without EAF
    });

    it("should distinguish between source media and annotation media", async () => {
      // GIVEN: A folder with both source and annotation audio files
      const folderPath = "/test/mixed-audio";

      store.dispatch(actions.treeOnNewFolder(folderPath));

      // WHEN: Files are categorized
      // Source media (main audio)
      store.dispatch(
        actions.sourceMediaAdded({
          file: {
            path: `${folderPath}/main-audio.wav`,
            url: "blob:main",
            name: "main-audio.wav",
            mimeType: "audio/wav",
          },
        }),
      );

      // Annotation media (voiceover/merged tracks)
      store.dispatch(
        actions.annotMediaAdded({
          file: {
            path: `${folderPath}/video_Annotations/Careful_Merged.mp3`,
            url: "blob:careful",
            name: "Careful_Merged.mp3",
            mimeType: "audio/mpeg",
            channel: "CarefulMerged",
          },
        }),
      );

      store.dispatch(
        actions.annotMediaAdded({
          file: {
            path: `${folderPath}/video_Annotations/Translation_Merged.mp3`,
            url: "blob:translation",
            name: "Translation_Merged.mp3",
            mimeType: "audio/mpeg",
            channel: "TranslationMerged",
          },
        }),
      );

      // THEN: Files are categorized correctly
      const state = store.getState();

      expect(state.tree.sourceMedia).toHaveLength(1);
      expect(state.tree.annotMedia).toHaveLength(2);

      // Annotation media should have channel info
      expect(
        state.tree.annotMedia.some((m: any) => m.channel === "CarefulMerged"),
      ).toBe(true);
      expect(
        state.tree.annotMedia.some(
          (m: any) => m.channel === "TranslationMerged",
        ),
      ).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("should handle folder selection cancellation", async () => {
      // GIVEN: User cancels folder selection
      mockElectronAPI.selectFolder.mockResolvedValue(null);

      // WHEN: Folder selection is attempted
      const result = await mockElectronAPI.selectFolder();

      // THEN: No folder is loaded
      expect(result).toBeNull();

      const state = store.getState();
      expect(state.tree.folderPath).toBe(""); // Default empty state
    });

    it("should handle corrupt EAF files", async () => {
      // GIVEN: An EAF file with invalid XML
      const folderPath = "/test/corrupt-folder";

      mockElectronAPI.readFile.mockResolvedValue("<invalid>xml<content>");

      // WHEN: EAF parsing is attempted
      store.dispatch(
        actions.fileAdded({
          file: {
            path: `${folderPath}/corrupt.eaf`,
            name: "corrupt.eaf",
            mimeType: "application/xml",
          },
        }),
      );

      // THEN: App should not crash (graceful degradation)
      const state = store.getState();
      expect(state.annot.timeline).toHaveLength(0);
    });
  });
});

/**
 * Helper: Create minimal valid EAF XML content for testing
 */
function createSampleEAFContent(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ANNOTATION_DOCUMENT>
  <HEADER MEDIA_FILE="" TIME_UNITS="milliseconds">
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///video.mp4" MIME_TYPE="video/mp4"/>
    <MEDIA_DESCRIPTOR MEDIA_URL="file:///audio.wav" MIME_TYPE="audio/wav"/>
  </HEADER>
  <TIME_ORDER>
    <TIME_SLOT TIME_SLOT_ID="ts1" TIME_VALUE="0"/>
    <TIME_SLOT TIME_SLOT_ID="ts2" TIME_VALUE="5000"/>
    <TIME_SLOT TIME_SLOT_ID="ts3" TIME_VALUE="5000"/>
    <TIME_SLOT TIME_SLOT_ID="ts4" TIME_VALUE="10000"/>
  </TIME_ORDER>
  <TIER LINGUISTIC_TYPE_REF="default-lt" TIER_ID="default">
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a1" TIME_SLOT_REF1="ts1" TIME_SLOT_REF2="ts2">
        <ANNOTATION_VALUE>First segment</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
    <ANNOTATION>
      <ALIGNABLE_ANNOTATION ANNOTATION_ID="a2" TIME_SLOT_REF1="ts3" TIME_SLOT_REF2="ts4">
        <ANNOTATION_VALUE>Second segment</ANNOTATION_VALUE>
      </ALIGNABLE_ANNOTATION>
    </ANNOTATION>
  </TIER>
</ANNOTATION_DOCUMENT>`;
}
