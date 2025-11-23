/**
 * Duration Component
 *
 * Displays a formatted time duration in HH:MM:SS or MM:SS format.
 * Used for showing elapsed time and total duration in the player controls.
 *
 * @module features/player/components/ControlRow/Duration
 */

import React from "react";

/**
 * Props for the Duration component
 */
interface DurationProps {
  /** CSS class name for styling */
  className: string;
  /** Duration in seconds to display */
  seconds: number;
}

/**
 * Duration Component
 *
 * Renders a time duration as a formatted string. Automatically handles
 * hours, minutes, and seconds with appropriate zero-padding.
 *
 * Format:
 * - If hours > 0: "H:MM:SS" or "HH:MM:SS"
 * - If hours = 0: "M:SS" or "MM:SS"
 *
 * @param {DurationProps} props - Component props
 * @returns {JSX.Element} Formatted time element
 *
 * @example
 * ```tsx
 * // Displays "1:23"
 * <Duration className="elapsed" seconds={83} />
 * ```
 *
 * @example
 * ```tsx
 * // Displays "1:23:45"
 * <Duration className="total" seconds={5025} />
 * ```
 */
export default function Duration({
  className,
  seconds,
}: DurationProps): JSX.Element {
  return (
    <time dateTime={`P${Math.round(seconds)}S`} className={className}>
      {format(seconds)}
    </time>
  );
}

/**
 * Format seconds into HH:MM:SS or MM:SS string
 *
 * Converts a duration in seconds to a human-readable time format.
 * Omits hours if the duration is less than one hour.
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 *
 * @example
 * format(83) // returns "1:23"
 * format(5025) // returns "1:23:45"
 * format(61) // returns "1:01"
 */
function format(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = pad(date.getUTCSeconds());

  if (hh) {
    return `${hh}:${pad(mm)}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Pad a number with leading zero if needed
 *
 * Ensures time components are always two digits (e.g., "09" instead of "9").
 *
 * @param {number} value - Number to pad
 * @returns {string} Zero-padded string
 *
 * @example
 * pad(5) // returns "05"
 * pad(12) // returns "12"
 */
function pad(value: number): string {
  return ("0" + value).slice(-2);
}
