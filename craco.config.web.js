let webpack = require("webpack");
module.exports = {
  webpack: {
    configure: {
      target: "web",
      plugins: [
        new webpack.ProvidePlugin({
          WaveSurfer: "wavesurfer.js"
        }),
        new webpack.DefinePlugin({
          'process.env.FLUENTFFMPEG_COV': false
      })  
      ]
    }
  }
};
