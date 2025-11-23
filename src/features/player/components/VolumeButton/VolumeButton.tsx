import React from "react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import * as actions from "../../../../store";
import { roundIt } from "../../../../components/globalFunctions";
import disabled50 from "../../../../assets/buttons/disabled50.png";
import enabled50 from "../../../../assets/buttons/enabled50.png";

interface VolumeButtonProps {
  index: number;
  getReady: () => boolean;
  getPlaybackRate?: () => number;
}

/**
 * VolumeButton Component
 *
 * A toggleable volume button that cycles through three volume states:
 * - 100% (Main/Full volume)
 * - 50% (Background)
 * - 0% (Muted)
 *
 * The button displays a visual indicator showing the current volume level
 * through opacity changes on an enabled/disabled button image overlay.
 *
 * @param props.index - Index of the WaveSurfer instance (0=Source, 1=Careful, 2=Translation)
 * @param props.getReady - Function that returns whether the player is ready
 * @param props.getPlaybackRate - Optional function that returns the current playback rate
 */
export function VolumeButton({
  index,
  getReady,
  getPlaybackRate: _getPlaybackRate,
}: VolumeButtonProps): JSX.Element {
  const volumes = useSelector(
    (state: actions.StateProps) => state.deeJay.volumes,
  );
  const dispatch = useDispatch();

  /**
   * Display a toast notification message
   */
  const sendSnackbar = (
    message: string,
    key?: string,
    vType?: string,
  ): void => {
    if (vType === "error") {
      toast.error(message);
    } else if (vType === "success") {
      toast.success(message);
    } else {
      toast(message);
    }
  };

  /**
   * Toggle volume between three predetermined states:
   * - If volume > 50%: Set to 50% (Background)
   * - If volume = 0%: Set to 100% (Main)
   * - If volume <= 50%: Set to 0% (Muted)
   */
  const toggleVol = (): void => {
    if (!getReady()) return;

    const name = `${
      !index ? "Original" : index === 1 ? "Careful" : "Translation"
    } Audio Set to `;

    const currentVolume = volumes[index];

    if (currentVolume > 0.5 ** 0.25) {
      // High volume -> Set to 50%
      sendSnackbar(name + "50% (Background)", "vol" + index.toString());
      dispatch(actions.setWSVolume(index, 0.5 ** 0.25));
    } else if (currentVolume === 0) {
      // Muted -> Set to 100%
      sendSnackbar(name + "100% (Main)", "vol" + index.toString());
      dispatch(actions.setWSVolume(index, 1));
    } else if (currentVolume <= 0.5 ** 0.25) {
      // Medium volume -> Mute
      sendSnackbar(name + "0% (Muted)", "vol" + index.toString());
      dispatch(actions.setWSVolume(index, 0));
    }
  };

  return (
    <td className="wave-table-enable">
      <div className="buttonWrapper">
        <div
          className="ThreeDimButton"
          onClick={toggleVol}
          onMouseDown={() => false}
        >
          <img
            className="black"
            width={50}
            height={50}
            alt=""
            src={disabled50}
          />
          <div className="overlay">
            <img
              className="green"
              width={50}
              height={50}
              alt=""
              style={{
                opacity: roundIt(getReady() ? volumes[index] : 0, 2),
              }}
              src={enabled50}
            />
          </div>
        </div>
      </div>
    </td>
  );
}

export default VolumeButton;
