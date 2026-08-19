declare const process: {
  cwd(): string;
};

declare function require(moduleName: string): any;

const fs = require('fs');
const path = require('path');

const servicePath = path.join(
  process.cwd(),
  'modules/waterfirst-soft-lock/android/src/main/java/com/waterfirst/softlock/WaterfirstAccessibilityService.kt',
);

describe('Android Accessibility Service source safety', () => {
  const source = fs.readFileSync(servicePath, 'utf8');

  it('handles null accessibility events and null package names safely', () => {
    expect(source).toContain('event: AccessibilityEvent?');
    expect(source).toContain('event?.eventType');
    expect(source).toContain('event.packageName?.toString()?.trim()');
    expect(source).toContain('detectedPackageName.isNullOrBlank()');
  });

  it('ignores Waterfirst foreground events', () => {
    expect(source).toContain('detectedPackageName == applicationContext.packageName');
  });

  it('stores recent detected and blocked packages for debug verification', () => {
    expect(source).toContain('putString(WaterfirstSoftLockKeys.lastDetectedPackageKey');
    expect(source).toContain('putString(WaterfirstSoftLockKeys.lastBlockedPackageKey');
    expect(source).not.toContain('mutableListOf');
    expect(source).not.toContain('ArrayList');
  });

  it('checks synced protected packages and launches the blocking screen', () => {
    expect(source).toContain('WaterfirstSoftLockKeys.protectedPackageNamesKey');
    expect(source).toContain('protectedPackages.contains(packageName)');
    expect(source).toContain('WaterfirstBlockingActivity::class.java');
  });

  it('does not read accessibility node trees or window content', () => {
    expect(source).not.toContain('rootInActiveWindow');
    expect(source).not.toContain('getRootInActiveWindow');
    expect(source).not.toContain('findAccessibilityNodeInfos');
  });
});
