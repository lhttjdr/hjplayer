module.exports = {
  context: __dirname + '/src',
  entry: {
    'hjplayer': './hjplayer.js',
  },
  output: {
    path: __dirname + '/dist/js',
    filename: '[name].js'
  },
  module: {
    loaders: [ {
        test: /jquery-mousewheel/,
        loader: "imports-loader?define=>false&this=>window"
      },
      {
        test: /malihu-custom-scrollbar-plugin/,
        loader: "imports-loader?define=>false&this=>window"
      }
    ]
  }
};
