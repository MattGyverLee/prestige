/**
 * WaveTableRow Component
 *
 * Renders a single row in the DeeJay waveform table, containing:
 * - VolumeButton for track control
 * - VolumeBar for volume adjustment
 * - Waveform visualization
 *
 * @module features/annotations/components
 */

import React from "react";
import { VolumeButton, VolumeBar } from "@features/player";
import { Waveform } from "@features/annotations";

interface WaveTableRowProps {
  /** Callback to get playback rate for this track */
  getPlaybackRate: () => number;
  /** Callback to get ready state for this track */
  getReady: () => boolean;
  /** Track index (0, 1, or 2) */
  index: number;
  /** Waveform click handler */
  onClick: (e: React.MouseEvent) => void;
}

/**
 * WaveTableRow - Renders a single waveform table row
 *
 * This component is a simple presentational wrapper that combines
 * the volume controls and waveform visualization for a single track.
 */
export function WaveTableRow({
  getPlaybackRate,
  getReady,
  index,
  onClick,
}: WaveTableRowProps): JSX.Element {
  return (
    <tr key={index.toString()}>
      <VolumeButton
        index={index}
        getPlaybackRate={getPlaybackRate}
        getReady={getReady}
      />
      <VolumeBar index={index} getReady={getReady} />
      <Waveform index={index} onClick={onClick} />
    </tr>
  );
}

export default WaveTableRow;
