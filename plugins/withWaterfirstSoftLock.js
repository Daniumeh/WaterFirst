const {
  AndroidConfig,
  createRunOncePlugin,
  withDangerousMod,
  withAndroidManifest,
  withEntitlementsPlist,
  withInfoPlist,
  withStringsXml,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const pkg = require('../modules/waterfirst-soft-lock/package.json');

const accessibilityDescription =
  'Waterfirst Soft Lock detects when you open apps you selected for hydration accountability. It does not read screen content, messages, passwords or typed text.';
const accessibilityServiceClassName = 'com.waterfirst.softlock.WaterfirstAccessibilityService';
const accessibilityServiceXml = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:accessibilityEventTypes="typeWindowStateChanged"
  android:accessibilityFeedbackType="feedbackGeneric"
  android:canRetrieveWindowContent="false"
  android:description="@string/waterfirst_accessibility_description"
  android:notificationTimeout="100" />
`;

function resolveBundleIdentifier(config, props) {
  return (
    props?.bundleIdentifier ||
    config.ios?.bundleIdentifier ||
    process.env.WATERFIRST_IOS_BUNDLE_IDENTIFIER ||
    null
  );
}

function resolveAppGroupIdentifier(props) {
  return props?.appGroupIdentifier || process.env.WATERFIRST_APP_GROUP_IDENTIFIER || null;
}

function withWaterfirstSoftLock(config, props = {}) {
  const bundleIdentifier = resolveBundleIdentifier(config, props);
  const appGroupIdentifier = resolveAppGroupIdentifier(props);

  config.ios = {
    ...config.ios,
    ...(bundleIdentifier ? { bundleIdentifier } : {}),
  };

  config.extra = {
    ...config.extra,
    waterfirstSoftLock: {
      appGroupConfigured: Boolean(appGroupIdentifier),
      bundleIdentifierConfigured: Boolean(bundleIdentifier),
      extensionBundleIdentifiers: bundleIdentifier
        ? {
            deviceActivityMonitor: `${bundleIdentifier}.DeviceActivityMonitor`,
            shieldAction: `${bundleIdentifier}.ShieldAction`,
            shieldConfiguration: `${bundleIdentifier}.ShieldConfiguration`,
          }
        : null,
    },
  };

  config = withEntitlementsPlist(config, (modConfig) => {
    modConfig.modResults['com.apple.developer.family-controls'] = true;

    if (appGroupIdentifier) {
      modConfig.modResults['com.apple.security.application-groups'] = [appGroupIdentifier];
    }

    return modConfig;
  });

  config = withInfoPlist(config, (modConfig) => {
    if (appGroupIdentifier) {
      modConfig.modResults.WATERFIRST_SOFT_LOCK_APP_GROUP = appGroupIdentifier;
    }

    return modConfig;
  });

  config = withAndroidManifest(config, (modConfig) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(modConfig.modResults);
    mainApplication.$ = {
      ...mainApplication.$,
      'android:usesCleartextTraffic': mainApplication.$?.['android:usesCleartextTraffic'] ?? 'false',
    };
    mainApplication.service = mainApplication.service ?? [];

    const hasAccessibilityService = mainApplication.service.some(
      (service) => service.$?.['android:name'] === accessibilityServiceClassName,
    );

    if (!hasAccessibilityService) {
      mainApplication.service.push({
        $: {
          'android:name': accessibilityServiceClassName,
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.accessibilityservice.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/waterfirst_accessibility_service',
            },
          },
        ],
      });
    }

    return modConfig;
  });

  config = withStringsXml(config, (modConfig) => {
    const strings = modConfig.modResults.resources.string ?? [];
    const descriptionString = {
      $: {
        name: 'waterfirst_accessibility_description',
      },
      _: accessibilityDescription,
    };
    const existingIndex = strings.findIndex(
      (item) => item.$?.name === 'waterfirst_accessibility_description',
    );

    if (existingIndex >= 0) {
      strings[existingIndex] = descriptionString;
    } else {
      strings.push(descriptionString);
    }

    modConfig.modResults.resources.string = strings;

    return modConfig;
  });

  config = withDangerousMod(config, [
    'android',
    (modConfig) => {
      const xmlDirectory = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      fs.mkdirSync(xmlDirectory, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDirectory, 'waterfirst_accessibility_service.xml'),
        accessibilityServiceXml,
      );

      return modConfig;
    },
  ]);

  return config;
}

module.exports = createRunOncePlugin(withWaterfirstSoftLock, pkg.name, pkg.version);
