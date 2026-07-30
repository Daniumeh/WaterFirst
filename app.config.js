const baseConfig = require('./app.json');

const softLockPluginOptions = {
  appGroupIdentifier: process.env.WATERFIRST_APP_GROUP_IDENTIFIER,
  bundleIdentifier: process.env.WATERFIRST_IOS_BUNDLE_IDENTIFIER,
};

module.exports = ({ config }) => ({
  ...baseConfig.expo,
  ...config,
  ios: {
    ...baseConfig.expo.ios,
    ...config.ios,
    ...(process.env.WATERFIRST_IOS_BUNDLE_IDENTIFIER
      ? { bundleIdentifier: process.env.WATERFIRST_IOS_BUNDLE_IDENTIFIER }
      : {}),
  },
  android: {
    ...baseConfig.expo.android,
    ...config.android,
    package: 'com.waterfirstapp.lebechi',
  },
  plugins: [
    ...(baseConfig.expo.plugins ?? []),
    './plugins/withWaterfirstAndroidBuildProperties',
    ['./plugins/withWaterfirstSoftLock', softLockPluginOptions],
  ],
});
