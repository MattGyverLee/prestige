module.exports = config => {
  config.target = "electron-renderer";
  config.plugins = [
    new webpack.ProvidePlugin({
      WaveSurfer: "wavesurfer.js"
    }),
    new webpack.DefinePlugin({
      "process.env.FLUENTFFMPEG_COV": false
    })
  ];
  return config;
};
