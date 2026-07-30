import DeviceActivity
import Foundation
import ManagedSettings

final class WaterfirstDeviceActivityMonitor: DeviceActivityMonitor {
  private let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("WaterfirstSoftLock"))

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }
}
