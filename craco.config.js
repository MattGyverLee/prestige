// eslint-disable-next-line @typescript-eslint/no-var-requires
let webpack = require("webpack");
module.exports = {
  webpack: {
    configure: {
      target: "electron-renderer",
      plugins: [
        new webpack.ProvidePlugin({
          WaveSurfer: "wavesurfer.js",
        }),
        new webpack.DefinePlugin({
          "process.env.FLUENTFFMPEG_COV": false,
        }),
      ],
    },
  },
};
