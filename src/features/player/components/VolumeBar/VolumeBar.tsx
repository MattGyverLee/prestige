import React from "react";
import { useSelector, useDispatch } from "react-redux";
import * as actions from "../../../../store";
import { roundIt } from "../../../../components/globalFunctions";

interface VolumeBarProps {
  index: number;
  getReady: () => boolean;
}

/**
 * VolumeBar Component
 *
 * A slider control for adjusting the volume of individual WaveSurfer instances.
 * Uses a native HTML range input with a logarithmic volume curve (power of 4)
 * to provide more natural volume control perception.
 *
 * The volume value is stored in Redux state and synchronized across all
 * components using the same WaveSurfer instance index.
 *
 * Volume transformation:
 * - Display value: volume^4 (linear 0-1 for UI)
 * - Actual value: value^0.25 (logarithmic for audio perception)
 *
 * @param props.index - Index of the WaveSurfer instance (0=Source, 1=Careful, 2=Translation)
 * @param props.getReady - Function that returns whether the player is ready
 *
 * @example
 * ```tsx
 * <VolumeBar index={0} getReady={() => isPlayerReady} />
 * ```
 */
export function VolumeBar({ index, getReady }: VolumeBarProps): JSX.Element {
  const volumes = useSelector(
    (state: actions.StateProps) => state.deeJay.volumes,
  );
  const dispatch = useDispatch();

  /**
   * Handle volume slider change
   * Converts linear slider value to logarithmic volume value
   */
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const targetId = parseInt(e.target.id);
    const linearValue = parseFloat(e.target.value);
    const logarithmicValue = linearValue ** 0.25;

    dispatch(actions.setWSVolume(targetId, logarithmicValue));
  };

  return (
    <td className="wave-table-volume">
      <input
        id={index.toString()}
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={roundIt(volumes[index] ** 4, 2)}
        onChange={handleVolumeChange}
        disabled={!getReady()}
      />
    </td>
  );
}

export default VolumeBar;
