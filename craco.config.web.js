let webpack = require("webpack");
let reactHotReloadPlugin = require("react-hot-loader");
module.exports = {
  plugins: [{ plugin: reactHotReloadPlugin }],
  webpack: {
    configure: {
      target: "web",
      plugins: [
        new webpack.ProvidePlugin({
          WaveSurfer: "wavesurfer.js"
        })
      ]
    }
  }
};
