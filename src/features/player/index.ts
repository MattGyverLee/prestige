/**
 * Player Feature Module
 *
 * This module provides player-related components, hooks, and utilities.
 * It serves as the public API for the player feature.
 */

// Components
export { VolumeButton } from "./components/VolumeButton/VolumeButton";
export { VolumeBar } from "./components/VolumeBar/VolumeBar";
export { PlayerZone } from "./components/PlayerZone/PlayerZone";
export { ControlRow } from "./components/ControlRow/ControlRow";

// Hooks
export { useDraggable, useReactPlayer, usePlayerControls } from "./hooks";
export type {
  PlayerControlsState,
  PlayerControlsMethods,
  UsePlayerControlsReturn,
} from "./hooks";
