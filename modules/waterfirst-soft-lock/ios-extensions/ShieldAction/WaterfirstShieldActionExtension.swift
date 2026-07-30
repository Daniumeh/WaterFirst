import ManagedSettings
import ManagedSettingsUI

final class WaterfirstShieldActionExtension: ShieldActionDelegate {
  override func handle(action: ShieldAction, for application: Application, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    completionHandler(response(for: action))
  }

  override func handle(action: ShieldAction, for webDomain: WebDomain, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    completionHandler(response(for: action))
  }

  override func handle(action: ShieldAction, for category: ActivityCategory, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    completionHandler(response(for: action))
  }

  private func response(for action: ShieldAction) -> ShieldActionResponse {
    switch action {
    case .primaryButtonPressed:
      return .defer
    case .secondaryButtonPressed:
      return .close
    @unknown default:
      return .none
    }
  }
}
