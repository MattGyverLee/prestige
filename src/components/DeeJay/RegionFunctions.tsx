/**
 * DeeJay Region Functions
 *
 * This module provides utility functions for managing WaveSurfer regions
 * in the DeeJay audio editor component. Regions are visual markers on
 * waveforms that highlight milestone boundaries.
 *
 * Key Concepts:
 * - **Region**: A visual box overlaid on a waveform marking a time range
 * - **Region Color**: HSL color with alpha transparency for visibility
 * - **Region Alpha**: Transparency value (0.0 = invisible, 0.1 = default visible)
 * - **Region Toggle**: Three states - off (0), on (1), unavailable (2)
 *
 * Region Colors:
 * - Generated using golden ratio conjugate for aesthetically pleasing distribution
 * - Default alpha: 0.1 (10% opaque, 90% transparent)
 * - Format: `hsl(hue, 60%, 50%, alpha)`
 *
 * @module DeeJay/RegionFunctions
 */

import store from "../../store/store";
import { LooseObject } from "../../store/annot/types";
import { roundIt } from "../globalFunctions";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Golden ratio conjugate for generating aesthetically pleasing color distribution
 * This ensures colors are well-distributed across the hue spectrum
 */
const GOLDEN_RATIO_CONJUGATE = (1.0 + Math.sqrt(5.0)) / 2.0;

/**
 * Default saturation for region colors (60%)
 */
const REGION_COLOR_SATURATION = 60;

/**
 * Default lightness for region colors (50%)
 */
const REGION_COLOR_LIGHTNESS = 50;

/**
 * Default alpha transparency for visible regions (10% opaque)
 */
const REGION_ALPHA_VISIBLE = 0.1;

/**
 * Alpha transparency for invisible regions (fully transparent)
 */
const REGION_ALPHA_INVISIBLE = 0.0;

// ============================================================================
// COLOR GENERATION
// ============================================================================

/**
 * Generate aesthetically pleasing HSL color using golden ratio
 *
 * Uses the golden ratio conjugate to generate evenly distributed hue values
 * across the color spectrum. This produces colors that are visually distinct
 * without appearing random.
 *
 * Algorithm from:
 * - https://gist.github.com/AlexLamson/6785065
 * - https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
 *
 * @param {number} [colorPos=0] - Position in color sequence (affects hue calculation)
 * @returns {string} HSL color string with 10% opacity
 *
 * @example
 * const color1 = getNiceHSLColor(0);
 * // Returns: "hsl(234, 60%, 50%, 0.1)"
 *
 * @example
 * const color2 = getNiceHSLColor(1);
 * // Returns: "hsl(102, 60%, 50%, 0.1)" (different hue)
 */
export function getNiceHSLColor(colorPos = 0): string {
  // Start with random hue
  let hue = Math.random();

  // Apply golden ratio for even distribution
  hue += GOLDEN_RATIO_CONJUGATE * (colorPos / (5 * Math.random()));
  hue = hue % 1; // Keep in [0, 1] range

  // Convert to degrees [0, 359]
  hue = roundIt(359 * hue, 0);

  return `hsl(${hue}, ${REGION_COLOR_SATURATION}%, ${REGION_COLOR_LIGHTNESS}%, ${REGION_ALPHA_VISIBLE})`;
}

/**
 * Generate random RGBA color (currently returns fully transparent)
 *
 * This function generates a random RGB color but with 0 alpha, making it
 * effectively invisible. Likely used as a placeholder or for special cases.
 *
 * @returns {string} RGBA color string with 0 opacity
 *
 * @example
 * const color = getRandomRGBAColor();
 * // Returns: "rgba(123,45,67,0.0)" (random RGB, but fully transparent)
 */
export function getRandomRGBAColor(): string {
  const rgb =
    "rgba(" +
    [
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      ~~(Math.random() * 255),
      0.0,
    ] +
    ")";
  return rgb;
}

/**
 * Generate array of region colors for all milestones in the current timeline
 *
 * Creates one color per milestone using the golden ratio distribution
 * algorithm. This ensures each milestone has a distinct, aesthetically
 * pleasing color.
 *
 * @returns {string[]} Array of HSL color strings, one per milestone
 *
 * @example
 * // With 5 milestones in timeline
 * const colors = generateRegionColors();
 * // Returns: [
 * //   "hsl(234, 60%, 50%, 0.1)",
 * //   "hsl(102, 60%, 50%, 0.1)",
 * //   "hsl(324, 60%, 50%, 0.1)",
 * //   "hsl(47, 60%, 50%, 0.1)",
 * //   "hsl(189, 60%, 50%, 0.1)"
 * // ]
 *
 * @example
 * // No timeline selected
 * const colors = generateRegionColors();
 * // Returns: []
 */
export function generateRegionColors(): string[] {
  const state = store.getState();
  const regionColors: string[] = [];
  let pos = 0;

  if (state.annot.currentTimeline !== -1) {
    state.annot.timeline[state.annot.currentTimeline].milestones.forEach(() => {
      regionColors.push(getNiceHSLColor(pos));
      pos += 1;
    });
  }

  return regionColors;
}

// ============================================================================
// REGION MANIPULATION
// ============================================================================

/**
 * Update the alpha transparency of a specific region
 *
 * Finds a region by its start/end times and updates its color's alpha channel
 * to the specified value. This is used for showing/hiding regions or
 * highlighting the current milestone.
 *
 * @param {any[]} regions - Array of WaveSurfer region objects
 * @param {number} alpha - New alpha value (0.0 = invisible, 0.1 = default visible)
 * @param {number} start - Region start time in seconds
 * @param {number} end - Region end time in seconds
 *
 * @example
 * // Make region visible (10% opaque)
 * updateRegionAlpha(wsRegions, 0.1, 5.0, 8.0);
 *
 * @example
 * // Make region invisible (fully transparent)
 * updateRegionAlpha(wsRegions, 0.0, 5.0, 8.0);
 *
 * @example
 * // Highlight current milestone (50% opaque)
 * updateRegionAlpha(wsRegions, 0.5, milestone.startTime, milestone.stopTime);
 */
export function updateRegionAlpha(
  regions: any[],
  alpha: number,
  start: number,
  end: number,
): void {
  const region = findRegion(regions, start, end);
  if (region) {
    // Parse existing color and replace alpha value
    const newColor = region.color
      .split(",")
      .map((v: string) => (v.endsWith(")") ? `${alpha})` : v))
      .join(",");

    region.setOptions({
      color: newColor,
    });
  }
}

/**
 * Find a region by its start and end times
 *
 * Searches through an array of regions to find one with matching
 * start and end times.
 *
 * @param {any[]} regions - Array of WaveSurfer region objects
 * @param {number} start - Region start time in seconds
 * @param {number} end - Region end time in seconds
 * @returns {any | undefined} The matching region, or undefined if not found
 *
 * @example
 * const region = findRegion(wsRegions, 5.0, 8.0);
 * if (region) {
 *   console.log("Found region:", region);
 * }
 */
function findRegion(regions: any[], start: number, end: number): any {
  return regions.find((r: any) => r.start === start && r.end === end);
}

// ============================================================================
// REGION VISIBILITY CONTROL
// ============================================================================

/**
 * Toggle visibility of all regions across WaveSurfer tracks
 *
 * Cycles through region visibility states based on regionsOn parameter:
 * - regionsOn = 0: Make all regions invisible (alpha = 0.0)
 * - regionsOn = 1: Make all regions visible (alpha = 0.1)
 * - regionsOn = 2: Regions unavailable (no action taken)
 *
 * This function updates regions for:
 * - Source track (wsRegions[0]): Uses milestone start/stop times
 * - Careful track (wsRegions[1]): Uses CarefulMerged clipStart/clipStop
 * - Translation track (wsRegions[2]): Uses TranslationMerged clipStart/clipStop
 *
 * @param {number} regionsOn - Region visibility state (0=off, 1=on, 2=unavailable)
 * @param {boolean} noIncrement - If true, don't increment regionsOn (unused parameter)
 * @param {any[]} wsRegions - Array of region arrays, one per WaveSurfer track
 *
 * @example
 * // Hide all regions
 * toggleAllRegions(0, false, wsRegions);
 *
 * @example
 * // Show all regions
 * toggleAllRegions(1, false, wsRegions);
 *
 * @example
 * // Regions unavailable (no action)
 * toggleAllRegions(2, false, wsRegions);
 *
 * @note
 * FIXME: Last region in all WaveSurfer tracks may not be drawn correctly
 */
export function toggleAllRegions(
  regionsOn: number,
  noIncrement: boolean,
  wsRegions: any[],
): void {
  const state = store.getState();

  // Only process if timeline exists and regions are not in unavailable state
  if (state.annot.currentTimeline !== -1 && regionsOn !== 2) {
    // Calculate alpha: regionsOn=1 -> 0.1 (visible), regionsOn=0 -> 0.0 (invisible)
    const alpha = regionsOn ? REGION_ALPHA_VISIBLE : REGION_ALPHA_INVISIBLE;

    // Update regions for each milestone
    state.annot.timeline[state.annot.currentTimeline].milestones.forEach(
      (m: any) => {
        // Update source track region (wsRegions[0])
        updateRegionAlpha(wsRegions[0], alpha, m.startTime, m.stopTime);

        // Update annotation track regions (wsRegions[1] and wsRegions[2])
        m.data.forEach((d: LooseObject) => {
          // Calculate wsNum: 0 for non-Merged, 1 for CarefulMerged, 2 for TranslationMerged
          const wsNum =
            +d.channel.endsWith("Merged") *
            (1 + +d.channel.startsWith("Translation"));

          if (wsNum && d.clipStart !== undefined && d.clipStop !== undefined) {
            updateRegionAlpha(wsRegions[wsNum], alpha, d.clipStart, d.clipStop);
          }
        });
      },
    );
  }
}
