import "@testing-library/jest-dom";
import { expect, vi } from "vitest";

// Mock Electron APIs globally
const mockElectronAPI = {
  getCwd: vi.fn(() => Promise.resolve("/test/path")),
  readDir: vi.fn(() => Promise.resolve([])),
  readFile: vi.fn(() => Promise.resolve("")),
  writeFile: vi.fn(() => Promise.resolve()),
  watchFolder: vi.fn(() => Promise.resolve()),
  unwatchFolder: vi.fn(() => Promise.resolve()),
  exportVideo: vi.fn(() =>
    Promise.resolve({ output: "/test/output.mp4", clips: 1 }),
  ),
  getFileStats: vi.fn(() =>
    Promise.resolve({ size: 1000, modified: Date.now() }),
  ),
  selectFolder: vi.fn(() => Promise.resolve("/test/selected/folder")),
};

// Make electronAPI available globally
global.window = global.window || {};
(global.window as any).electronAPI = mockElectronAPI;

// Mock AudioContext for wavesurfer tests
class MockAudioContext {
  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createMediaElementSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  get destination() {
    return {};
  }
}

(global.window as any).AudioContext = MockAudioContext;
(global.window as any).webkitAudioContext = MockAudioContext;

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, "load", {
  configurable: true,
  value: vi.fn(),
});

// Helper to reset all mocks between tests
export function resetAllMocks() {
  Object.values(mockElectronAPI).forEach((mock) => {
    if (typeof mock === "function" && "mockClear" in mock) {
      mock.mockClear();
    }
  });
}

// Export mock for direct access in tests
export { mockElectronAPI };
