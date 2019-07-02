// define child rescript
module.exports = config => {
  config.target = "electron-renderer";
  config.plugins = [
    new webpack.ProvidePlugin({
      WaveSurfer: "wavesurfer.js"
    })
  ];
  return config;
};
