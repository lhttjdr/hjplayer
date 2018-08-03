var packager = require('electron-packager');
var config = require('./package.json');

packager({
  dir: './',
  out: './dist',
  name: config.name,
  platform: 'win32',
  arch: 'all',
  electronVersion: '2.0.6',
  icon: './assert/win/jplayer.ico',

  overwrite: true,
  asar: true,
  prune: true,
  ignore: "test"
}, function done (err, appPath) {
  if(err) {
    throw new Error(err);
  }
  console.log('Done!!');
});
