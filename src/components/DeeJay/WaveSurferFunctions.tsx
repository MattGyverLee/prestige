import WaveSurfer from "wavesurfer.js";
import store from "../../store/store";

export function createWaveSurfer(idx: number): WaveSurfer {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const regionsPlugin = require("../../../node_modules/wavesurfer.js/dist/plugin/wavesurfer.regions");
  const newWS = WaveSurfer.create({
    container: "#waveform" + idx.toString(),
    barWidth: 1,
    cursorWidth: 2,
    backend: "MediaElement",
    progressColor: "#4a74a5",
    cursorColor: "#4a74a5",
    responsive: true,
    waveColor: "#ccc",
    hideScrollbar: true,
    height: rowHeight(),
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
    state.system.dimensions.AppDeeJay.height !== -1
  ) {
    return Math.round((state.system.dimensions.AppDeeJay.height * 0.8) / 4);
  } else {
    return 128;
  }
}
