/**
 * Unit tests for annotation Redux store
 *
 * These tests verify the public API contract of the annotation store:
 * - Action creators: function inputs → action objects
 * - Reducer: (state, action) → new state
 *
 * Tests focus on inputs and outputs, not implementation details.
 */

import { describe, it, expect } from "vitest";
import * as actions from "../actions";
import * as types from "../types";
import { annotationReducer, annCleanStore } from "../reducers";

// ============================================================================
// ACTION CREATORS
// ============================================================================

describe("Annotation Action Creators", () => {
  describe("addCategory", () => {
    it("should create an ADD_CATEGORY action with the provided category string", () => {
      const category = "Important Notes";
      const action = actions.addCategory(category);

      expect(action).toEqual({
        type: types.ADD_CATEGORY,
        payload: "Important Notes",
      });
    });

    it("should handle empty string category", () => {
      const action = actions.addCategory("");

      expect(action).toEqual({
        type: types.ADD_CATEGORY,
        payload: "",
      });
    });
  });

  describe("pushAnnotationTable", () => {
    it("should create a PUSH_ANNOTATION_TABLE action with provided table array", () => {
      const table: types.AnnotationRow[] = [
        {
          id: 0,
          startTime: 0,
          stopTime: 5,
          txtTransc: "First row",
        },
        {
          id: 1,
          startTime: 5,
          stopTime: 10,
          txtTransc: "Second row",
        },
      ];

      const action = actions.pushAnnotationTable(table);

      expect(action).toEqual({
        type: types.PUSH_ANNOTATION_TABLE,
        payload: table,
      });
    });

    it("should handle table with optional audio fields", () => {
      const table: types.AnnotationRow[] = [
        {
          id: 0,
          startTime: 0,
          stopTime: 5,
          txtTransc: "Test",
          txtTransl: "Translation",
          audCareful: "/path/to/careful.mp3",
          audTransl: "/path/to/translation.mp3",
        },
      ];

      const action = actions.pushAnnotationTable(table);

      expect(action.payload[0].audCareful).toBe("/path/to/careful.mp3");
      expect(action.payload[0].audTransl).toBe("/path/to/translation.mp3");
    });
  });

  describe("pushTimeline", () => {
    it("should create a PUSH_TIMELINE action with provided timeline", () => {
      const timeline: types.Timeline = {
        id: "timeline-1",
        name: "Test Timeline",
        milestones: [],
        syncMedia: ["/video.mp4", "/audio.wav"],
      };

      const action = actions.pushTimeline(timeline as types.LooseObject);

      expect(action).toEqual({
        type: types.PUSH_TIMELINE,
        payload: timeline,
      });
    });

    it("should handle timeline with milestones", () => {
      const milestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [],
      };

      const timeline: types.Timeline = {
        id: "timeline-2",
        name: "Complex Timeline",
        milestones: [milestone],
        syncMedia: ["/video.mp4"],
      };

      const action = actions.pushTimeline(timeline as types.LooseObject);

      expect(action.payload.milestones).toHaveLength(1);
      expect(action.payload.milestones[0]).toEqual(milestone);
    });
  });

  describe("loadAnnot", () => {
    it("should create a LOAD_ANNOT action with the provided state", () => {
      const state: types.AnnotationState = {
        ...annCleanStore,
        currentAnnotIdx: 3,
      };

      const action = actions.loadAnnot(state);

      expect(action).toEqual({
        type: types.LOAD_ANNOT,
        payload: state,
      });
    });

    it("should handle clean store state", () => {
      const action = actions.loadAnnot(annCleanStore);

      expect(action.payload).toEqual(annCleanStore);
    });
  });

  describe("onNewFolder", () => {
    it("should create an ON_NEW_FOLDER action with provided path", () => {
      const action = actions.onNewFolder("/path/to/folder");

      expect(action).toEqual({
        type: types.ON_NEW_FOLDER,
        payload: { inString: "/path/to/folder", blobURL: undefined },
      });
    });

    it("should handle path with blobURL", () => {
      const action = actions.onNewFolder("/path/to/folder", "blob:http://...");

      expect(action).toEqual({
        type: types.ON_NEW_FOLDER,
        payload: { inString: "/path/to/folder", blobURL: "blob:http://..." },
      });
    });
  });

  describe("Toggle Actions", () => {
    it("toggleAudcarefulMain should create action without parameter", () => {
      const action = actions.toggleAudcarefulMain();

      expect(action).toEqual({
        type: types.TOGGLE_AUDCAREFUL_MAIN,
        payload: undefined,
      });
    });

    it("toggleAudcarefulMain should create action with boolean parameter", () => {
      const action = actions.toggleAudcarefulMain(true);

      expect(action).toEqual({
        type: types.TOGGLE_AUDCAREFUL_MAIN,
        payload: true,
      });
    });

    it("toggleAudtranslMain should create action", () => {
      const action = actions.toggleAudtranslMain();

      expect(action).toEqual({
        type: types.TOGGLE_AUDTRANSL_MAIN,
        payload: undefined,
      });
    });

    it("toggleAudtranslMain should accept boolean parameter", () => {
      const action = actions.toggleAudtranslMain(false);

      expect(action).toEqual({
        type: types.TOGGLE_AUDTRANSL_MAIN,
        payload: false,
      });
    });
  });

  describe("addOralAnnotation", () => {
    it("should create an ADD_ORAL_ANNOTATION action with milestone and index", () => {
      const milestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [
          {
            channel: "CarefulMerged",
            data: "/path/to/audio.mp3",
            linguisticType: "default-lt",
            locale: "fr",
            mimeType: "audio/mpeg",
            clipStart: 1.5,
            clipStop: 3.5,
          },
        ],
      };

      const action = actions.addOralAnnotation(milestone, 2);

      expect(action).toEqual({
        type: types.ADD_ORAL_ANNOTATION,
        payload: { newMilestone: milestone, idx: 2 },
      });
    });

    it("should handle milestone with empty data array", () => {
      const milestone: types.Milestone = {
        annotationID: "a2",
        startTime: 5,
        stopTime: 10,
        data: [],
      };

      const action = actions.addOralAnnotation(milestone, 0);

      expect(action.payload.newMilestone.data).toEqual([]);
      expect(action.payload.idx).toBe(0);
    });
  });
});

// ============================================================================
// REDUCER
// ============================================================================

describe("Annotation Reducer", () => {
  describe("Initial State", () => {
    it("should return the clean store as initial state", () => {
      const state = annotationReducer(undefined, { type: "@@INIT" } as any);

      expect(state).toEqual(annCleanStore);
      expect(state.timeline).toEqual([]);
      expect(state.annotationTable).toHaveLength(1);
      expect(state.annotationTable[0].txtTransc).toBe("Not Loaded");
    });
  });

  describe("ADD_CATEGORY", () => {
    it("should add a new category to the categories array", () => {
      const initialState = {
        ...annCleanStore,
        categories: ["Existing Category"],
      };

      const action: types.AnnotationActionTypes = {
        type: types.ADD_CATEGORY,
        payload: "New Category",
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.categories).toHaveLength(2);
      expect(newState.categories).toContain("Existing Category");
      expect(newState.categories).toContain("New Category");
    });

    it("should not mutate the original state", () => {
      const initialState = {
        ...annCleanStore,
        categories: ["Category 1"],
      };

      const action: types.AnnotationActionTypes = {
        type: types.ADD_CATEGORY,
        payload: "Category 2",
      };

      const originalCategories = initialState.categories;
      const newState = annotationReducer(initialState, action);

      expect(originalCategories).toHaveLength(1); // Original unchanged
      expect(newState.categories).toHaveLength(2); // New state has addition
      expect(newState.categories).not.toBe(originalCategories); // New array reference
    });
  });

  describe("PUSH_ANNOTATION_TABLE", () => {
    it("should replace annotation table with provided table", () => {
      const initialState = {
        ...annCleanStore,
        annotationTable: [{ id: 0, startTime: 0, txtTransc: "Not Loaded" }],
        timelineChanged: true,
      };

      const newTable: types.AnnotationRow[] = [
        { id: 0, startTime: 0, txtTransc: "Row 1" },
        { id: 1, startTime: 5, stopTime: 10, txtTransc: "Row 2" },
      ];

      const action: types.AnnotationActionTypes = {
        type: types.PUSH_ANNOTATION_TABLE,
        payload: newTable,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.annotationTable).toEqual(newTable);
      expect(newState.annotationTable).toHaveLength(2);
      expect(newState.timelineChanged).toBe(false); // Also sets timelineChanged to false
    });

    it("should not mutate the original annotation table", () => {
      const initialState = {
        ...annCleanStore,
        annotationTable: [{ id: 0, startTime: 0, txtTransc: "Original" }],
      };

      const newTable: types.AnnotationRow[] = [
        { id: 0, startTime: 0, txtTransc: "New" },
      ];

      const action: types.AnnotationActionTypes = {
        type: types.PUSH_ANNOTATION_TABLE,
        payload: newTable,
      };

      const originalTable = initialState.annotationTable;
      const newState = annotationReducer(initialState, action);

      expect(originalTable).toHaveLength(1); // Original unchanged
      expect(newState.annotationTable).not.toBe(originalTable); // New array reference
    });
  });

  describe("PUSH_TIMELINE", () => {
    it("should concatenate new timeline to timeline array", () => {
      const initialState = {
        ...annCleanStore,
        timeline: [],
      };

      const timeline: types.LooseObject = {
        milestones: [],
        syncMedia: ["/video.mp4"],
        eafFile: "/path/to/file.eaf",
      };

      const action: types.AnnotationActionTypes = {
        type: types.PUSH_TIMELINE,
        payload: { timeline },
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.timeline).toHaveLength(1);
      expect(newState.timeline[0]).toEqual(timeline);
      expect(newState.timelineChanged).toBe(true);
    });

    it("should append to existing timelines", () => {
      const existingTimeline: types.LooseObject = {
        milestones: [],
        syncMedia: [],
      };

      const initialState = {
        ...annCleanStore,
        timeline: [existingTimeline],
      };

      const newTimeline: types.LooseObject = {
        milestones: [],
        syncMedia: ["/video.mp4"],
      };

      const action: types.AnnotationActionTypes = {
        type: types.PUSH_TIMELINE,
        payload: { timeline: newTimeline },
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.timeline).toHaveLength(2);
      expect(newState.timeline[0]).toEqual(existingTimeline);
      expect(newState.timeline[1]).toEqual(newTimeline);
    });

    it("should not mutate the original timeline array", () => {
      const initialState = {
        ...annCleanStore,
        timeline: [],
      };

      const timeline: types.LooseObject = {
        milestones: [],
        syncMedia: [],
      };

      const action: types.AnnotationActionTypes = {
        type: types.PUSH_TIMELINE,
        payload: { timeline },
      };

      const originalTimeline = initialState.timeline;
      const newState = annotationReducer(initialState, action);

      expect(originalTimeline).toHaveLength(0); // Original unchanged
      expect(newState.timeline).toHaveLength(1); // New state has addition
      expect(newState.timeline).not.toBe(originalTimeline); // New array reference
    });
  });

  describe("LOAD_ANNOT", () => {
    it("should replace entire state with payload state", () => {
      const initialState = {
        ...annCleanStore,
        currentTimeline: 0,
        categories: ["Category 1"],
      };

      const newFullState: types.AnnotationState = {
        ...annCleanStore,
        currentTimeline: 5,
        categories: ["Category A", "Category B"],
      };

      const action: types.AnnotationActionTypes = {
        type: types.LOAD_ANNOT,
        payload: newFullState,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState).toEqual(newFullState);
      expect(newState.currentTimeline).toBe(5);
      expect(newState.categories).toEqual(["Category A", "Category B"]);
    });

    it("should handle loading clean store", () => {
      const dirtyState = {
        ...annCleanStore,
        currentTimeline: 3,
        audCarefulMain: true,
      };

      const action: types.AnnotationActionTypes = {
        type: types.LOAD_ANNOT,
        payload: annCleanStore,
      };

      const newState = annotationReducer(dirtyState, action);

      expect(newState).toEqual(annCleanStore);
      expect(newState.currentTimeline).toBe(-1);
      expect(newState.audCarefulMain).toBe(false);
    });
  });

  describe("ON_NEW_FOLDER", () => {
    it("should set timelineChanged to true", () => {
      const initialState = {
        ...annCleanStore,
        timelineChanged: false,
      };

      const action: types.AnnotationActionTypes = {
        type: types.ON_NEW_FOLDER,
        payload: { inString: "/path/to/folder", blobURL: undefined },
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.timelineChanged).toBe(true);
      // Other state should remain the same
      expect(newState.timeline).toEqual(initialState.timeline);
      expect(newState.categories).toEqual(initialState.categories);
    });
  });

  describe("Toggle Actions", () => {
    it("TOGGLE_AUDCAREFUL_MAIN should toggle audCarefulMain from false to true when no payload", () => {
      const initialState = {
        ...annCleanStore,
        audCarefulMain: false,
      };

      const action: types.AnnotationActionTypes = {
        type: types.TOGGLE_AUDCAREFUL_MAIN,
        payload: undefined,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.audCarefulMain).toBe(true);
    });

    it("TOGGLE_AUDCAREFUL_MAIN should toggle audCarefulMain from true to false when no payload", () => {
      const initialState = {
        ...annCleanStore,
        audCarefulMain: true,
      };

      const action: types.AnnotationActionTypes = {
        type: types.TOGGLE_AUDCAREFUL_MAIN,
        payload: undefined,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.audCarefulMain).toBe(false);
    });

    it("TOGGLE_AUDCAREFUL_MAIN should use payload value when provided", () => {
      const initialState = {
        ...annCleanStore,
        audCarefulMain: false,
      };

      const action: types.AnnotationActionTypes = {
        type: types.TOGGLE_AUDCAREFUL_MAIN,
        payload: true,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.audCarefulMain).toBe(true);
    });

    it("TOGGLE_AUDTRANSL_MAIN should toggle audTranslMain", () => {
      const initialState = {
        ...annCleanStore,
        audTranslMain: false,
      };

      const action: types.AnnotationActionTypes = {
        type: types.TOGGLE_AUDTRANSL_MAIN,
        payload: undefined,
      };

      const newState = annotationReducer(initialState, action);

      expect(newState.audTranslMain).toBe(true);
    });
  });

  describe("ADD_ORAL_ANNOTATION", () => {
    it("should add milestone to existing timeline when match found", () => {
      const existingMilestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [
          {
            channel: "CarefulMerged",
            data: "/path/to/careful.mp3",
            linguisticType: "default-lt",
            locale: "fr",
            mimeType: "audio/mpeg",
          },
        ],
      };

      const timeline: types.LooseObject = {
        milestones: [existingMilestone],
        syncMedia: ["/video.mp4"],
      };

      const initialState = {
        ...annCleanStore,
        timeline: [timeline],
      };

      const newMilestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [
          {
            channel: "TranslationMerged",
            data: "/path/to/translation.mp3",
            linguisticType: "default-lt",
            locale: "en",
            mimeType: "audio/mpeg",
          },
        ],
      };

      const action: types.AnnotationActionTypes = {
        type: types.ADD_ORAL_ANNOTATION,
        payload: { newMilestone, idx: 0 },
      };

      const newState = annotationReducer(initialState, action);

      // Should merge data arrays for matching milestone
      const updatedMilestone = newState.timeline[0].milestones[0];
      expect(updatedMilestone.data).toHaveLength(2);
      expect(updatedMilestone.data[0].channel).toBe("CarefulMerged");
      expect(updatedMilestone.data[1].channel).toBe("TranslationMerged");
    });

    it("should add new milestone when no match found", () => {
      const existingMilestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [],
      };

      const timeline: types.LooseObject = {
        milestones: [existingMilestone],
        syncMedia: [],
      };

      const initialState = {
        ...annCleanStore,
        timeline: [timeline],
      };

      const newMilestone: types.Milestone = {
        annotationID: "a2",
        startTime: 5,
        stopTime: 10,
        data: [
          {
            channel: "CarefulMerged",
            data: "/path/to/audio.mp3",
            linguisticType: "default-lt",
            locale: "fr",
            mimeType: "audio/mpeg",
          },
        ],
      };

      const action: types.AnnotationActionTypes = {
        type: types.ADD_ORAL_ANNOTATION,
        payload: { newMilestone, idx: 0 },
      };

      const newState = annotationReducer(initialState, action);

      // Should add as a new milestone
      expect(newState.timeline[0].milestones).toHaveLength(2);
      expect(newState.timeline[0].milestones[1]).toEqual(newMilestone);
    });

    it("should not mutate the original timeline", () => {
      const milestone: types.Milestone = {
        annotationID: "a1",
        startTime: 0,
        stopTime: 5,
        data: [],
      };

      const timeline: types.LooseObject = {
        milestones: [milestone],
        syncMedia: [],
      };

      const initialState = {
        ...annCleanStore,
        timeline: [timeline],
      };

      const newMilestone: types.Milestone = {
        annotationID: "a2",
        startTime: 5,
        stopTime: 10,
        data: [],
      };

      const action: types.AnnotationActionTypes = {
        type: types.ADD_ORAL_ANNOTATION,
        payload: { newMilestone, idx: 0 },
      };

      const originalTimeline = initialState.timeline;
      const newState = annotationReducer(initialState, action);

      // Original unchanged
      expect(originalTimeline[0].milestones).toHaveLength(1);

      // New state has addition
      expect(newState.timeline[0].milestones).toHaveLength(2);

      // New references (immutability)
      expect(newState.timeline).not.toBe(originalTimeline);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Annotation Store Integration", () => {
  it("should handle a complete workflow: new folder → add timeline → load state", () => {
    let state = annCleanStore;

    // Step 1: Mark timeline as changed with new folder
    state = annotationReducer(state, actions.onNewFolder("/path/to/folder"));
    expect(state.timelineChanged).toBe(true);
    expect(state.timeline).toEqual([]);

    // Step 2: Add a timeline
    const timeline: types.LooseObject = {
      milestones: [
        {
          annotationID: "a1",
          startTime: 0,
          stopTime: 5,
          data: [],
        },
      ],
      syncMedia: ["/video.mp4"],
      eafFile: "/path/to/file.eaf",
    };

    state = annotationReducer(state, actions.pushTimeline(timeline));
    expect(state.timeline).toHaveLength(1);
    expect(state.timelineChanged).toBe(true);

    // Step 3: Load a new state
    const newState: types.AnnotationState = {
      ...annCleanStore,
      currentTimeline: 0,
      categories: ["Category A"],
    };

    state = annotationReducer(state, actions.loadAnnot(newState));
    expect(state.currentTimeline).toBe(0);
    expect(state.categories).toEqual(["Category A"]);
  });

  it("should handle building an annotation table", () => {
    let state = annCleanStore;

    // Start with clean state (contains one "Not Loaded" row)
    expect(state.annotationTable).toHaveLength(1);

    // Replace entire table (not row by row)
    const newTable: types.AnnotationRow[] = [
      { id: 0, startTime: 0, stopTime: 5, txtTransc: "First annotation" },
      { id: 1, startTime: 5, stopTime: 10, txtTransc: "Second annotation" },
    ];

    state = annotationReducer(state, actions.pushAnnotationTable(newTable));
    expect(state.annotationTable).toHaveLength(2);
    expect(state.annotationTable).toEqual(newTable);
    expect(state.timelineChanged).toBe(false); // Also resets timelineChanged
  });

  it("should handle toggling multiple audio flags", () => {
    let state = annCleanStore;

    expect(state.audCarefulMain).toBe(false);
    expect(state.audTranslMain).toBe(false);

    // Toggle careful on
    state = annotationReducer(state, actions.toggleAudcarefulMain());
    expect(state.audCarefulMain).toBe(true);
    expect(state.audTranslMain).toBe(false);

    // Toggle translation on
    state = annotationReducer(state, actions.toggleAudtranslMain());
    expect(state.audCarefulMain).toBe(true);
    expect(state.audTranslMain).toBe(true);

    // Toggle careful off
    state = annotationReducer(state, actions.toggleAudcarefulMain());
    expect(state.audCarefulMain).toBe(false);
    expect(state.audTranslMain).toBe(true);
  });

  it("should handle adding voiceovers to timeline milestones", () => {
    const timeline: types.LooseObject = {
      milestones: [
        { annotationID: "a1", startTime: 0, stopTime: 5, data: [] },
        { annotationID: "a2", startTime: 5, stopTime: 10, data: [] },
      ],
      syncMedia: [],
    };

    let state = {
      ...annCleanStore,
      timeline: [timeline],
    };

    // Add voiceover to first milestone
    const milestone1: types.Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "CarefulMerged",
          data: "/careful1.mp3",
          linguisticType: "default-lt",
          locale: "fr",
          mimeType: "audio/mpeg",
        },
      ],
    };

    state = annotationReducer(state, actions.addOralAnnotation(milestone1, 0));

    expect(state.timeline[0].milestones[0].data).toHaveLength(1);
    expect(state.timeline[0].milestones[1].data).toHaveLength(0);

    // Add voiceover to second milestone
    const milestone2: types.Milestone = {
      annotationID: "a2",
      startTime: 5,
      stopTime: 10,
      data: [
        {
          channel: "TranslationMerged",
          data: "/transl2.mp3",
          linguisticType: "default-lt",
          locale: "en",
          mimeType: "audio/mpeg",
        },
      ],
    };

    state = annotationReducer(state, actions.addOralAnnotation(milestone2, 0));

    expect(state.timeline[0].milestones[0].data).toHaveLength(1);
    expect(state.timeline[0].milestones[1].data).toHaveLength(1);

    // Add second voiceover to first milestone (merges data arrays)
    const milestone1Translation: types.Milestone = {
      annotationID: "a1",
      startTime: 0,
      stopTime: 5,
      data: [
        {
          channel: "TranslationMerged",
          data: "/transl1.mp3",
          linguisticType: "default-lt",
          locale: "en",
          mimeType: "audio/mpeg",
        },
      ],
    };

    state = annotationReducer(
      state,
      actions.addOralAnnotation(milestone1Translation, 0),
    );

    expect(state.timeline[0].milestones[0].data).toHaveLength(2);
    expect(state.timeline[0].milestones[1].data).toHaveLength(1);
  });

  it("should maintain immutability through complex state transitions", () => {
    const initialState = annCleanStore;
    const timeline: types.LooseObject = {
      milestones: [],
      syncMedia: [],
    };

    // Apply multiple actions
    let state = annotationReducer(initialState, actions.pushTimeline(timeline));
    state = annotationReducer(state, actions.addCategory("Category 1"));
    state = annotationReducer(state, actions.toggleAudcarefulMain());

    // Verify original state unchanged
    expect(initialState.timeline).toEqual([]);
    expect(initialState.categories).toEqual([]);
    expect(initialState.audCarefulMain).toBe(false);

    // Verify new state has all changes
    expect(state.timeline).toHaveLength(1);
    expect(state.categories).toEqual(["Category 1"]);
    expect(state.audCarefulMain).toBe(true);
  });
});
