let webpack = require("webpack");
let reactHotReloadPlugin = require("react-hot-loader");
module.exports = {
  plugins: [{ plugin: reactHotReloadPlugin }],
  webpack: {
    configure: {
      target: "electron-renderer",
      alias: {
        "react-dom": "@hot-loader/react-dom"
      },
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
