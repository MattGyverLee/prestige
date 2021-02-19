import WaveSurfer from "wavesurfer.js";
import store from "../../store/store";

export function createWaveSurfer(idx: number): WaveSurfer {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const regionsPlugin = require("../../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
  const newWS = WaveSurfer.create({
    container: "#waveform" + idx.toString(),
    barWidth: 1,
    cursorWidth: 4,
    backend: "MediaElement",
    progressColor: "#fff",
    cursorColor: "#4a74a5",
    responsive: true,
    waveColor: "#00ccff",
    hideScrollbar: true,
    height: 128,
    plugins: [regionsPlugin.create()],
  });
  newWS.empty();
  newWS.setVolume(+(idx === 0));

  return newWS;
}

export function rowHeight() {
  const state = store.getState();
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
    const idealHeight = Math.round(
      (state.system.dimensions.AppBody.height -
        130 -
        state.system.dimensions.AppPlayer.height) /
        3
    );
    return idealHeight;
  } else {
    return 128;
  }
}
