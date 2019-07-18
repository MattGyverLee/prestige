let webpack = require("webpack");
let reactHotReloadPlugin = require("craco-plugin-react-hot-reload");
module.exports = {
  plugins: [{ plugin: reactHotReloadPlugin }],
  webpack: {
    configure: {
      target: "electron-renderer",
      plugins: [
        new webpack.ProvidePlugin({
          WaveSurfer: "wavesurfer.js"
        }),
        new webpack.DefinePlugin({
          "process.env.FLUENTFFMPEG_COV": false
        })
      ]
    }
  }
};
