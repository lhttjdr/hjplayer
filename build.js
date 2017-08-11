var packager = require('electron-packager');
var config = require('./package.json');

packager({
  dir: './',
  out: './dist',
  name: config.name,
  platform: 'win32',
  arch: 'all',
  electronVersion: '1.4.13',
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
