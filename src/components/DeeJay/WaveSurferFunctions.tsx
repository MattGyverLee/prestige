/**
 * DeeJay WaveSurfer Functions
 *
 * This module provides utility functions for creating and configuring
 * WaveSurfer instances in the DeeJay audio editor component.
 *
 * WaveSurfer is a customizable audio waveform visualization library that
 * displays audio as an interactive waveform. The DeeJay component uses
 * three WaveSurfer instances:
 * - Instance 0: Source video/audio track
 * - Instance 1: Careful annotation track (French voiceover)
 * - Instance 2: Translation track (English voiceover)
 *
 * Key Features:
 * - Creates WaveSurfer instances with consistent styling
 * - Configures regions plugin for milestone visualization
 * - Calculates optimal row heights based on available space
 * - Sets initial volume (source track audible, annotation tracks muted)
 *
 * @module DeeJay/WaveSurferFunctions
 */

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import store from "../../store/store";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * WaveSurfer instance with its regions plugin
 *
 * This interface encapsulates both the WaveSurfer instance and its
 * associated regions plugin for milestone visualization.
 */
export interface WaveSurferWithRegions {
  /** WaveSurfer instance for waveform display and playback */
  wavesurfer: WaveSurfer;

  /** Regions plugin for drawing milestone boundaries */
  regionsPlugin: RegionsPlugin;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default row height when dimensions are unavailable (pixels)
 */
const DEFAULT_ROW_HEIGHT = 128;

/**
 * Fixed vertical space used by DeeJay controls and padding (pixels)
 */
const DEEJAY_CONTROLS_HEIGHT = 130;

/**
 * Number of WaveSurfer rows to display (source + 2 annotation tracks)
 */
const NUMBER_OF_ROWS = 3;

// ============================================================================
// WAVESURFER CREATION
// ============================================================================

/**
 * Create a new WaveSurfer instance with regions plugin
 *
 * Creates and configures a WaveSurfer instance for a specific track index.
 * The instance is bound to a DOM element with id `#waveform{idx}` and
 * initialized with:
 * - Consistent visual styling (colors, cursor, bar width)
 * - Regions plugin for milestone visualization
 * - Default volume settings (source audible, annotations muted)
 *
 * Volume Settings:
 * - idx = 0 (source track): Volume set to 1.0 (100% audible)
 * - idx ≠ 0 (annotation tracks): Volume set to 0.0 (muted)
 *
 * This prevents audio overlap during initialization. Users can adjust
 * volumes through the UI.
 *
 * @param {number} idx - WaveSurfer track index (0 = source, 1 = Careful, 2 = Translation)
 * @returns {WaveSurferWithRegions} Object containing WaveSurfer instance and regions plugin
 *
 * @example
 * // Create source track WaveSurfer
 * const ws0 = createWaveSurfer(0);
 * ws0.wavesurfer.load(audioURL);
 * ws0.wavesurfer.play();
 *
 * @example
 * // Create Careful annotation track WaveSurfer
 * const ws1 = createWaveSurfer(1);
 * ws1.wavesurfer.load(carefulAudioURL);
 * // Volume is 0 by default, user can adjust via UI
 *
 * @example
 * // Access regions plugin
 * const ws = createWaveSurfer(0);
 * ws.regionsPlugin.addRegion({
 *   start: 5.0,
 *   end: 8.0,
 *   color: 'rgba(0, 200, 255, 0.1)'
 * });
 */
export function createWaveSurfer(idx: number): WaveSurferWithRegions {
  // Create regions plugin for milestone visualization
  const regionsPlugin = RegionsPlugin.create();

  // Create WaveSurfer instance with configuration
  const newWS = WaveSurfer.create({
    container: "#waveform" + idx.toString(),
    barWidth: 1,
    cursorWidth: 4,
    progressColor: "#fff",
    cursorColor: "#4a74a5",
    waveColor: "#00ccff",
    hideScrollbar: true,
    height: 128,
    plugins: [regionsPlugin],
  });

  // Initialize with empty waveform
  newWS.empty();

  // Set volume: Source track (idx=0) audible, annotation tracks muted
  // +(idx === 0) converts boolean to number: true -> 1, false -> 0
  newWS.setVolume(+(idx === 0));

  return { wavesurfer: newWS, regionsPlugin };
}

// ============================================================================
// LAYOUT CALCULATION
// ============================================================================

/**
 * Calculate optimal row height for WaveSurfer displays
 *
 * Computes the ideal height for each WaveSurfer row based on available
 * vertical space. This ensures WaveSurfer instances fit proportionally
 * within the DeeJay component's allocated space.
 *
 * Calculation:
 * ```
 * idealHeight = (AppBody height - Player height - DeeJay controls) / 3 rows
 * ```
 *
 * Returns DEFAULT_ROW_HEIGHT (128px) if:
 * - Component dimensions are not yet measured
 * - Any required dimension is unavailable or -1 (unmeasured)
 *
 * @returns {number} Calculated row height in pixels, or default if dimensions unavailable
 *
 * @example
 * // With full dimensions available
 * // AppBody.height = 800, AppPlayer.height = 200
 * // Available = 800 - 200 - 130 = 470
 * // Per row = 470 / 3 = 156 (rounded)
 * const height = rowHeight();
 * // Returns: 156
 *
 * @example
 * // During initial render (dimensions not measured)
 * const height = rowHeight();
 * // Returns: 128 (default)
 *
 * @example
 * // With minimal space
 * // AppBody.height = 400, AppPlayer.height = 200
 * // Available = 400 - 200 - 130 = 70
 * // Per row = 70 / 3 = 23 (rounded)
 * const height = rowHeight();
 * // Returns: 23 (very compact)
 */
export function rowHeight(): number {
  const state = store.getState();

  // Check if all required dimensions are available and measured
  if (
    state.system.dimensions !== undefined &&
    state.system.dimensions.AppDeeJay !== undefined &&
    state.system.dimensions.AppDeeJay.height !== undefined &&
    state.system.dimensions.AppDeeJay.height !== -1 &&
    state.system.dimensions.AppBody.height !== undefined &&
    state.system.dimensions.AppBody.height !== -1 &&
    state.system.dimensions.AppPlayer.height !== undefined &&
    state.system.dimensions.AppPlayer.height !== -1
  ) {
    // Calculate available vertical space
    const availableHeight =
      state.system.dimensions.AppBody.height -
      DEEJAY_CONTROLS_HEIGHT -
      state.system.dimensions.AppPlayer.height;

    // Divide equally among the three WaveSurfer rows
    const idealHeight = Math.round(availableHeight / NUMBER_OF_ROWS);

    return idealHeight;
  } else {
    // Dimensions not available yet, use default
    return DEFAULT_ROW_HEIGHT;
  }
}
