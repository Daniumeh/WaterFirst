const { createRunOncePlugin, withGradleProperties } = require('@expo/config-plugins');

const pkg = require('../package.json');

const ANDROID_BUILD_ABIS = ['arm64-v8a'];

function updateGradleProperty(properties, key, value) {
  const existing = properties.find((item) => item.type === 'property' && item.key === key);

  if (existing) {
    existing.value = value;
  } else {
    properties.push({
      type: 'property',
      key,
      value,
    });
  }
}

function withWaterfirstAndroidBuildProperties(config) {
  return withGradleProperties(config, (modConfig) => {
    updateGradleProperty(
      modConfig.modResults,
      'reactNativeArchitectures',
      ANDROID_BUILD_ABIS.join(','),
    );

    return modConfig;
  });
}

module.exports = createRunOncePlugin(
  withWaterfirstAndroidBuildProperties,
  'withWaterfirstAndroidBuildProperties',
  pkg.version,
);
