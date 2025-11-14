/**
 * Tree Redux Store Tests
 *
 * Comprehensive test suite for the tree store, which manages:
 * - File tree and folder structure
 * - Source media tracking (video/audio files)
 * - Annotation media tracking (voiceover files)
 * - File system operations (add, change, delete)
 * - Waveform data management
 * - WaveSurfer permissions
 *
 * Test coverage:
 * - Initial state
 * - Action creators
 * - Reducer state transitions
 * - File management operations
 * - Waveform tracking
 * - Integration scenarios
 */

import { describe, it, expect } from "vitest";
import * as actions from "../actions";
import * as types from "../types";
import { treeReducer, treeCleanStore } from "../reducers";

// ============================================================================
// TEST FIXTURES
// ============================================================================

const mockMedia: types.Media = {
  blobURL: "blob:http://localhost/video.mp4",
  extension: ".mp4",
  hasAnnotation: false,
  isAnnotation: false,
  isMerged: false,
  inMilestones: false,
  mimeType: "video/mp4",
  name: "test-video.mp4",
  path: "/test/test-video.mp4",
  wsAllowed: false,
  waveform: false,
};

const mockSourceMedia: types.Media = {
  ...mockMedia,
  name: "source.mp4",
  blobURL: "blob:http://localhost/source.mp4",
};

const mockAnnotMedia: types.Media = {
  ...mockMedia,
  name: "annotation.wav",
  blobURL: "blob:http://localhost/annotation.wav",
  isAnnotation: true,
  extension: ".wav",
  mimeType: "audio/wav",
};

// ============================================================================
// INITIAL STATE TESTS
// ============================================================================

describe("Tree Store Initial State", () => {
  it("should have correct initial clean store structure", () => {
    expect(treeCleanStore).toHaveProperty("availableFiles");
    expect(treeCleanStore).toHaveProperty("sourceMedia");
    expect(treeCleanStore).toHaveProperty("annotMedia");
    expect(treeCleanStore).toHaveProperty("env");
    expect(treeCleanStore).toHaveProperty("folderName");
    expect(treeCleanStore).toHaveProperty("folderPath");
    expect(treeCleanStore).toHaveProperty("loaded");
    expect(treeCleanStore).toHaveProperty("prevPath");
  });

  it("should initialize with empty file arrays", () => {
    expect(treeCleanStore.availableFiles).toEqual([]);
    expect(treeCleanStore.sourceMedia).toEqual([]);
    expect(treeCleanStore.annotMedia).toEqual([]);
  });

  it("should initialize with empty folder information", () => {
    expect(treeCleanStore.folderName).toBe("");
    expect(treeCleanStore.folderPath).toBe("");
    expect(treeCleanStore.prevPath).toBe("");
  });

  it("should initialize with loaded as false", () => {
    expect(treeCleanStore.loaded).toBe(false);
  });

  it("should have env set from environment variable", () => {
    expect(typeof treeCleanStore.env).toBe("string");
  });
});

// ============================================================================
// ACTION CREATOR TESTS
// ============================================================================

describe("Tree Action Creators", () => {
  describe("Folder Actions", () => {
    it("should create treeOnNewFolder action", () => {
      const action = actions.treeOnNewFolder("/path/to/folder");
      expect(action).toEqual({
        type: types.ON_NEW_FOLDER,
        payload: "/path/to/folder",
      });
    });

    it("should create treeHardResetApp action", () => {
      const action = actions.treeHardResetApp("test reset");
      expect(action).toEqual({
        type: types.HARD_RESET_APP,
        payload: "test reset",
      });
    });

    it("should create changePrevPath action", () => {
      const action = actions.changePrevPath("/previous/path");
      expect(action).toEqual({
        type: types.CHANGE_PREV_PATH,
        payload: "/previous/path",
      });
    });
  });

  describe("Tree Update Actions", () => {
    it("should create updateTree action", () => {
      const newTree: types.TreeState = {
        ...treeCleanStore,
        folderPath: "/new/path",
      };
      const action = actions.updateTree(newTree);
      expect(action).toEqual({
        type: types.UPDATE_TREE,
        payload: newTree,
      });
    });

    it("should create loadTree action", () => {
      const treeState: types.TreeState = {
        ...treeCleanStore,
        loaded: true,
      };
      const action = actions.loadTree(treeState);
      expect(action).toEqual({
        type: types.LOAD_TREE,
        payload: treeState,
      });
    });
  });

  describe("File Add Actions", () => {
    it("should create fileAdded action", () => {
      const action = actions.fileAdded({ file: mockMedia });
      expect(action.type).toBe(types.FILE_ADDED);
      expect(action.payload.file).toEqual(mockMedia);
    });

    it("should create sourceMediaAdded action", () => {
      const action = actions.sourceMediaAdded({ file: mockSourceMedia });
      expect(action.type).toBe(types.SOURCE_MEDIA_ADDED);
      expect(action.payload.file).toEqual(mockSourceMedia);
    });

    it("should create annotMediaAdded action", () => {
      const action = actions.annotMediaAdded({ file: mockAnnotMedia });
      expect(action.type).toBe(types.ANNOT_MEDIA_ADDED);
      expect(action.payload.file).toEqual(mockAnnotMedia);
    });
  });

  describe("File Change Actions", () => {
    it("should create fileChanged action", () => {
      const action = actions.fileChanged({ file: mockMedia });
      expect(action.type).toBe(types.FILE_CHANGED);
    });

    it("should create sourceMediaChanged action", () => {
      const action = actions.sourceMediaChanged({ file: mockSourceMedia });
      expect(action.type).toBe(types.SOURCE_MEDIA_CHANGED);
    });

    it("should create annotMediaChanged action", () => {
      const action = actions.annotMediaChanged({ file: mockAnnotMedia });
      expect(action.type).toBe(types.ANNOT_MEDIA_CHANGED);
    });
  });

  describe("File Delete Action", () => {
    it("should create fileDeleted action", () => {
      const action = actions.fileDeleted("blob:http://localhost/file.mp4");
      expect(action).toEqual({
        type: types.FILE_DELETED,
        payload: "blob:http://localhost/file.mp4",
      });
    });
  });

  describe("Waveform Actions", () => {
    it("should create waveformAdded action", () => {
      const waveIn: types.Wavein = {
        ref: "blob:http://localhost/audio.wav",
        sourceAnnot: true,
        wavedata: "peaks:0,1,2,3",
      };
      const action = actions.waveformAdded(waveIn);
      expect(action.type).toBe(types.WAVEFORM_ADDED);
      expect(action.payload).toEqual(waveIn);
    });
  });

  describe("Media Flag Actions", () => {
    it("should create setAnnotMediaInMilestones action", () => {
      const action = actions.setAnnotMediaInMilestones(
        "blob:http://localhost/annot.wav",
      );
      expect(action).toEqual({
        type: types.SET_ANNOT_MEDIA_IN_MILESTONES,
        payload: "blob:http://localhost/annot.wav",
      });
    });

    it("should create setAnnotMediaWSAllowed action", () => {
      const action = actions.setAnnotMediaWSAllowed(
        "blob:http://localhost/annot.wav",
      );
      expect(action).toEqual({
        type: types.SET_ANNOT_MEDIA_WS_ALLOWED,
        payload: "blob:http://localhost/annot.wav",
      });
    });

    it("should create setSourceMediaWSAllowed action", () => {
      const action = actions.setSourceMediaWSAllowed(
        "blob:http://localhost/source.mp4",
      );
      expect(action).toEqual({
        type: types.SET_SOURCE_MEDIA_WS_ALLOWED,
        payload: "blob:http://localhost/source.mp4",
      });
    });
  });
});

// ============================================================================
// REDUCER TESTS - FOLDER OPERATIONS
// ============================================================================

describe("Tree Reducer - Folder Operations", () => {
  it("should update folder path on ON_NEW_FOLDER", () => {
    const action = actions.treeOnNewFolder("/new/folder");
    const state = treeReducer(treeCleanStore, action);

    expect(state.folderPath).toBe("/new/folder");
  });

  it("should update folder path on ON_RELOAD_FOLDER", () => {
    const action = { type: types.ON_RELOAD_FOLDER, payload: "/reload/path" };
    const state = treeReducer(treeCleanStore, action);

    expect(state.folderPath).toBe("/reload/path");
  });

  it("should update previous path on CHANGE_PREV_PATH", () => {
    const action = actions.changePrevPath("/previous/path");
    const state = treeReducer(treeCleanStore, action);

    expect(state.prevPath).toBe("/previous/path");
  });
});

// ============================================================================
// REDUCER TESTS - TREE UPDATE
// ============================================================================

describe("Tree Reducer - Tree Update", () => {
  it("should replace entire state on UPDATE_TREE", () => {
    const newTree: types.TreeState = {
      ...treeCleanStore,
      folderPath: "/new/path",
      folderName: "NewFolder",
      loaded: true,
    };
    const action = actions.updateTree(newTree);
    const state = treeReducer(treeCleanStore, action);

    expect(state).toEqual(newTree);
  });

  it("should replace entire state on LOAD_TREE", () => {
    const treeState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
      loaded: true,
    };
    const action = actions.loadTree(treeState);
    const state = treeReducer(treeCleanStore, action);

    expect(state).toEqual(treeState);
  });
});

// ============================================================================
// REDUCER TESTS - FILE ADDITIONS
// ============================================================================

describe("Tree Reducer - File Additions", () => {
  it("should add file to availableFiles on FILE_ADDED", () => {
    const action = actions.fileAdded({ file: mockMedia });
    const state = treeReducer(treeCleanStore, action);

    expect(state.availableFiles).toContain(mockMedia);
    expect(state.availableFiles.length).toBe(1);
  });

  it("should add file to sourceMedia on SOURCE_MEDIA_ADDED", () => {
    const action = actions.sourceMediaAdded({ file: mockSourceMedia });
    const state = treeReducer(treeCleanStore, action);

    expect(state.sourceMedia).toContain(mockSourceMedia);
    expect(state.sourceMedia.length).toBe(1);
  });

  it("should add file to annotMedia on ANNOT_MEDIA_ADDED", () => {
    const action = actions.annotMediaAdded({ file: mockAnnotMedia });
    const state = treeReducer(treeCleanStore, action);

    expect(state.annotMedia).toContain(mockAnnotMedia);
    expect(state.annotMedia.length).toBe(1);
  });

  it("should add multiple files to same array", () => {
    let state = treeCleanStore;

    state = treeReducer(
      state,
      actions.sourceMediaAdded({ file: mockSourceMedia }),
    );
    state = treeReducer(
      state,
      actions.sourceMediaAdded({
        file: { ...mockSourceMedia, name: "source2.mp4" },
      }),
    );

    expect(state.sourceMedia.length).toBe(2);
  });
});

// ============================================================================
// REDUCER TESTS - FILE CHANGES
// ============================================================================

describe("Tree Reducer - File Changes", () => {
  it("should update file in availableFiles on FILE_CHANGED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      availableFiles: [mockMedia],
    };

    const updatedMedia = { ...mockMedia, hasAnnotation: true };
    const action = actions.fileChanged({ file: updatedMedia });
    const state = treeReducer(initialState, action);

    expect(state.availableFiles).toContain(updatedMedia);
    expect(state.availableFiles.some((f) => f.hasAnnotation)).toBe(true);
  });

  it("should update file in sourceMedia on SOURCE_MEDIA_CHANGED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
    };

    const updatedMedia = { ...mockSourceMedia, waveform: "peaks:1,2,3" };
    const action = actions.sourceMediaChanged({ file: updatedMedia });
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia.some((f) => f.waveform !== false)).toBe(true);
  });

  it("should update file in annotMedia on ANNOT_MEDIA_CHANGED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia],
    };

    const updatedMedia = { ...mockAnnotMedia, inMilestones: true };
    const action = actions.annotMediaChanged({ file: updatedMedia });
    const state = treeReducer(initialState, action);

    expect(state.annotMedia.some((f) => f.inMilestones)).toBe(true);
  });
});

// ============================================================================
// REDUCER TESTS - FILE DELETION
// ============================================================================

describe("Tree Reducer - File Deletion", () => {
  it("should remove file from sourceMedia on FILE_DELETED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
    };

    const action = actions.fileDeleted(mockSourceMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia).not.toContain(mockSourceMedia);
    expect(state.sourceMedia.length).toBe(0);
  });

  it("should remove file from annotMedia on FILE_DELETED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia],
    };

    const action = actions.fileDeleted(mockAnnotMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.annotMedia).not.toContain(mockAnnotMedia);
    expect(state.annotMedia.length).toBe(0);
  });

  it("should remove file from availableFiles on FILE_DELETED", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      availableFiles: [mockMedia],
    };

    const action = actions.fileDeleted(mockMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.availableFiles).not.toContain(mockMedia);
    expect(state.availableFiles.length).toBe(0);
  });

  it("should remove file from all arrays simultaneously", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      availableFiles: [mockMedia],
      sourceMedia: [mockMedia],
      annotMedia: [mockMedia],
    };

    const action = actions.fileDeleted(mockMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.availableFiles.length).toBe(0);
    expect(state.sourceMedia.length).toBe(0);
    expect(state.annotMedia.length).toBe(0);
  });

  it("should preserve other files when deleting one", () => {
    const media2 = { ...mockMedia, blobURL: "blob:http://localhost/other.mp4" };
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockMedia, media2],
    };

    const action = actions.fileDeleted(mockMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia).toContain(media2);
    expect(state.sourceMedia).not.toContain(mockMedia);
    expect(state.sourceMedia.length).toBe(1);
  });
});

// ============================================================================
// REDUCER TESTS - WAVEFORM
// ============================================================================

describe("Tree Reducer - Waveform", () => {
  it("should add waveform to sourceMedia file", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
    };

    const waveIn: types.Wavein = {
      ref: mockSourceMedia.blobURL,
      sourceAnnot: true,
      wavedata: "peaks:0,1,2,3",
    };

    const action = actions.waveformAdded(waveIn);
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia[0].waveform).toBe("peaks:0,1,2,3");
  });

  it("should add waveform to annotMedia file", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia],
    };

    const waveIn: types.Wavein = {
      ref: mockAnnotMedia.blobURL,
      sourceAnnot: false,
      wavedata: "peaks:5,6,7,8",
    };

    const action = actions.waveformAdded(waveIn);
    const state = treeReducer(initialState, action);

    expect(state.annotMedia[0].waveform).toBe("peaks:5,6,7,8");
  });

  it("should not modify other files when adding waveform", () => {
    const media2 = {
      ...mockSourceMedia,
      blobURL: "blob:http://localhost/other.mp4",
    };
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia, media2],
    };

    const waveIn: types.Wavein = {
      ref: mockSourceMedia.blobURL,
      sourceAnnot: true,
      wavedata: "peaks:1,2,3",
    };

    const action = actions.waveformAdded(waveIn);
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia[0].waveform).toBe("peaks:1,2,3");
    expect(state.sourceMedia[1].waveform).toBe(false);
  });
});

// ============================================================================
// REDUCER TESTS - MEDIA FLAGS
// ============================================================================

describe("Tree Reducer - Media Flags", () => {
  it("should mark annotMedia as inMilestones", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia],
    };

    const action = actions.setAnnotMediaInMilestones(mockAnnotMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.annotMedia[0].inMilestones).toBe(true);
  });

  it("should mark annotMedia as wsAllowed", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia],
    };

    const action = actions.setAnnotMediaWSAllowed(mockAnnotMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.annotMedia[0].wsAllowed).toBe(true);
  });

  it("should mark sourceMedia as wsAllowed", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
    };

    const action = actions.setSourceMediaWSAllowed(mockSourceMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.sourceMedia[0].wsAllowed).toBe(true);
  });

  it("should only update matching file for flag operations", () => {
    const media2 = {
      ...mockAnnotMedia,
      blobURL: "blob:http://localhost/other.wav",
    };
    const initialState: types.TreeState = {
      ...treeCleanStore,
      annotMedia: [mockAnnotMedia, media2],
    };

    const action = actions.setAnnotMediaWSAllowed(mockAnnotMedia.blobURL);
    const state = treeReducer(initialState, action);

    expect(state.annotMedia[0].wsAllowed).toBe(true);
    expect(state.annotMedia[1].wsAllowed).toBe(false);
  });
});

// ============================================================================
// REDUCER TESTS - DEFAULT CASE
// ============================================================================

describe("Tree Reducer - Default Case", () => {
  it("should return unchanged state for unknown action", () => {
    const unknownAction = { type: "UNKNOWN_ACTION" } as any;
    const state = treeReducer(treeCleanStore, unknownAction);

    expect(state).toEqual(treeCleanStore);
  });

  it("should use clean store as default state", () => {
    const action = actions.treeOnNewFolder("/test");
    const state = treeReducer(undefined, action);

    expect(state.sourceMedia).toEqual([]);
    expect(state.annotMedia).toEqual([]);
  });
});

// ============================================================================
// IMMUTABILITY TESTS
// ============================================================================

describe("Tree Store Immutability", () => {
  it("should not mutate original state on file addition", () => {
    const originalState = { ...treeCleanStore };
    const action = actions.sourceMediaAdded({ file: mockSourceMedia });

    treeReducer(treeCleanStore, action);

    expect(treeCleanStore).toEqual(originalState);
  });

  it("should not mutate original state on file deletion", () => {
    const initialState: types.TreeState = {
      ...treeCleanStore,
      sourceMedia: [mockSourceMedia],
    };
    const originalState = { ...initialState };
    const action = actions.fileDeleted(mockSourceMedia.blobURL);

    treeReducer(initialState, action);

    expect(initialState).toEqual(originalState);
  });

  it("should create new state object on each update", () => {
    const action1 = actions.sourceMediaAdded({ file: mockSourceMedia });
    const state1 = treeReducer(treeCleanStore, action1);

    const action2 = actions.sourceMediaAdded({
      file: { ...mockSourceMedia, name: "second.mp4", blobURL: "blob:second" },
    });
    const state2 = treeReducer(state1, action2);

    expect(state2).not.toBe(state1);
    expect(state2.sourceMedia).not.toBe(state1.sourceMedia);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Tree Store Integration", () => {
  it("should handle complete folder workflow", () => {
    let state = treeCleanStore;

    // Open new folder
    state = treeReducer(state, actions.treeOnNewFolder("/test/folder"));
    expect(state.folderPath).toBe("/test/folder");

    // Add source media
    state = treeReducer(
      state,
      actions.sourceMediaAdded({ file: mockSourceMedia }),
    );
    expect(state.sourceMedia.length).toBe(1);

    // Add annotation media
    state = treeReducer(
      state,
      actions.annotMediaAdded({ file: mockAnnotMedia }),
    );
    expect(state.annotMedia.length).toBe(1);

    // Add waveform to source
    state = treeReducer(
      state,
      actions.waveformAdded({
        ref: mockSourceMedia.blobURL,
        sourceAnnot: true,
        wavedata: "peaks:1,2,3",
      }),
    );
    expect(state.sourceMedia[0].waveform).toBe("peaks:1,2,3");

    // Mark annotation as allowed
    state = treeReducer(
      state,
      actions.setAnnotMediaWSAllowed(mockAnnotMedia.blobURL),
    );
    expect(state.annotMedia[0].wsAllowed).toBe(true);
  });

  it("should handle file replacement workflow", () => {
    let state = treeCleanStore;

    // Add file
    state = treeReducer(
      state,
      actions.sourceMediaAdded({ file: mockSourceMedia }),
    );

    // Update file
    const updatedMedia = { ...mockSourceMedia, waveform: "peaks:1,2,3" };
    state = treeReducer(
      state,
      actions.sourceMediaChanged({ file: updatedMedia }),
    );

    // Delete file
    state = treeReducer(state, actions.fileDeleted(mockSourceMedia.blobURL));

    expect(state.sourceMedia.length).toBe(0);
  });

  it("should handle multiple file operations", () => {
    let state = treeCleanStore;

    // Add multiple source files
    for (let i = 0; i < 3; i++) {
      const file = {
        ...mockSourceMedia,
        name: `file${i}.mp4`,
        blobURL: `blob:${i}`,
      };
      state = treeReducer(state, actions.sourceMediaAdded({ file }));
    }
    expect(state.sourceMedia.length).toBe(3);

    // Add multiple annotation files
    for (let i = 0; i < 2; i++) {
      const file = {
        ...mockAnnotMedia,
        name: `annot${i}.wav`,
        blobURL: `blob:a${i}`,
      };
      state = treeReducer(state, actions.annotMediaAdded({ file }));
    }
    expect(state.annotMedia.length).toBe(2);

    // Delete one source file
    state = treeReducer(state, actions.fileDeleted("blob:1"));
    expect(state.sourceMedia.length).toBe(2);

    // Delete one annotation file
    state = treeReducer(state, actions.fileDeleted("blob:a0"));
    expect(state.annotMedia.length).toBe(1);
  });

  it("should maintain state through mixed operations", () => {
    let state = treeCleanStore;

    // Open folder
    state = treeReducer(state, actions.treeOnNewFolder("/project"));

    // Add files
    state = treeReducer(
      state,
      actions.sourceMediaAdded({ file: mockSourceMedia }),
    );
    state = treeReducer(
      state,
      actions.annotMediaAdded({ file: mockAnnotMedia }),
    );

    // Change path
    state = treeReducer(state, actions.changePrevPath("/old/path"));

    // Update flags
    state = treeReducer(
      state,
      actions.setSourceMediaWSAllowed(mockSourceMedia.blobURL),
    );
    state = treeReducer(
      state,
      actions.setAnnotMediaInMilestones(mockAnnotMedia.blobURL),
    );

    expect(state.folderPath).toBe("/project");
    expect(state.prevPath).toBe("/old/path");
    expect(state.sourceMedia[0].wsAllowed).toBe(true);
    expect(state.annotMedia[0].inMilestones).toBe(true);
  });
});
