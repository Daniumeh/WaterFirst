import ExpoModulesCore
import Foundation

#if canImport(FamilyControls) && canImport(ManagedSettings) && canImport(SwiftUI)
import FamilyControls
import ManagedSettings
import SwiftUI
#endif

public class WaterfirstSoftLockModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WaterfirstSoftLock")

    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await WaterfirstSoftLockIOS.shared.requestAuthorization()
    }

    AsyncFunction("presentApplicationPicker") { () async throws -> [String: Int] in
      let count = try await WaterfirstSoftLockIOS.shared.presentApplicationPicker(appContext: self.appContext)
      return ["selectedApplicationCount": count]
    }

    AsyncFunction("activateSoftLock") { (input: [String: Any]) async throws in
      try await WaterfirstSoftLockIOS.shared.activateSoftLock(input: input)
    }

    AsyncFunction("deactivateSoftLock") { (input: [String: Any]) async throws in
      try await WaterfirstSoftLockIOS.shared.deactivateSoftLock(input: input)
    }

    AsyncFunction("getStatus") { () async throws -> [String: Any?] in
      try await WaterfirstSoftLockIOS.shared.getStatus()
    }

    AsyncFunction("clearApplicationSelection") { () async throws in
      try await WaterfirstSoftLockIOS.shared.clearApplicationSelection()
    }
  }
}

private enum SoftLockError: Error, LocalizedError {
  case unsupported
  case authorizationDenied
  case appGroupMissing
  case invalidInput(String)
  case noApplicationSelection
  case presentationUnavailable
  case sessionMismatch

  var errorDescription: String? {
    switch self {
    case .unsupported:
      return "Waterfirst Soft Lock requires iOS Screen Time APIs in a development or production iOS build."
    case .authorizationDenied:
      return "Screen Time authorization is required before Waterfirst can shield selected apps."
    case .appGroupMissing:
      return "Waterfirst Soft Lock App Group storage is not configured."
    case .invalidInput(let message):
      return message
    case .noApplicationSelection:
      return "Choose at least one app with Apple's app picker before activating Soft Lock."
    case .presentationUnavailable:
      return "Waterfirst could not present Apple's app picker from the current screen."
    case .sessionMismatch:
      return "The requested Soft Lock session does not match the active native session."
    }
  }
}

#if canImport(FamilyControls) && canImport(ManagedSettings) && canImport(SwiftUI)
@available(iOS 16.0, *)
private final class FamilyActivityPickerHost: UIHostingController<FamilyActivityPickerHostView> {
  init(selection: Binding<FamilyActivitySelection>, onDone: @escaping () -> Void) {
    super.init(rootView: FamilyActivityPickerHostView(selection: selection, onDone: onDone))
  }

  @MainActor @available(*, unavailable)
  required dynamic init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

@available(iOS 16.0, *)
private struct FamilyActivityPickerHostView: View {
  @Binding var selection: FamilyActivitySelection
  let onDone: () -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Shield apps")
        .toolbar {
          ToolbarItem(placement: .confirmationAction) {
            Button("Done", action: onDone)
          }
        }
    }
  }
}
#endif

private final class WaterfirstSoftLockIOS {
  static let shared = WaterfirstSoftLockIOS()

  private let storeName = ManagedSettingsStore.Name("WaterfirstSoftLock")
  private let appGroupIdentifier = Bundle.main.object(forInfoDictionaryKey: "WATERFIRST_SOFT_LOCK_APP_GROUP") as? String
  private let sessionKey = "waterfirst.softLock.activeSession"
  private let selectionKey = "waterfirst.softLock.familyActivitySelection"

  private init() {}

  func requestAuthorization() async throws -> String {
    #if canImport(FamilyControls)
    guard #available(iOS 16.0, *) else {
      return "unsupported"
    }

    do {
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return authorizationStatus()
    } catch {
      return authorizationStatus()
    }
    #else
    return "unsupported"
    #endif
  }

  func presentApplicationPicker(appContext: AppContext?) async throws -> Int {
    #if canImport(FamilyControls) && canImport(SwiftUI)
    guard #available(iOS 16.0, *) else {
      throw SoftLockError.unsupported
    }

    guard authorizationStatus() == "approved" else {
      throw SoftLockError.authorizationDenied
    }

    return try await MainActor.run {
      guard let presenter = appContext?.utilities?.currentViewController() else {
        throw SoftLockError.presentationUnavailable
      }

      var selection = readSelection() ?? FamilyActivitySelection()

      return try await withCheckedThrowingContinuation { continuation in
        let binding = Binding<FamilyActivitySelection>(
          get: { selection },
          set: { selection = $0 }
        )

        let host = FamilyActivityPickerHost(selection: binding) {
          do {
            try self.saveSelection(selection)
            presenter.dismiss(animated: true) {
              continuation.resume(returning: self.selectionCount(selection))
            }
          } catch {
            presenter.dismiss(animated: true) {
              continuation.resume(throwing: error)
            }
          }
        }

        presenter.present(host, animated: true)
      }
    }
    #else
    throw SoftLockError.unsupported
    #endif
  }

  func activateSoftLock(input: [String: Any]) async throws {
    #if canImport(FamilyControls) && canImport(ManagedSettings)
    guard #available(iOS 16.0, *) else {
      throw SoftLockError.unsupported
    }

    guard authorizationStatus() == "approved" else {
      throw SoftLockError.authorizationDenied
    }

    let sessionId = try requiredString(input["sessionId"], fieldName: "sessionId")
    let requiredAmountCl = try requiredPositiveInt(input["requiredAmountCl"], fieldName: "requiredAmountCl")
    let activatedAt = try requiredString(input["activatedAt"], fieldName: "activatedAt")

    if let activeSession = readSession(), activeSession.sessionId == sessionId {
      return
    }

    guard let selection = readSelection(), selectionCount(selection) > 0 else {
      throw SoftLockError.noApplicationSelection
    }

    let session = SharedSoftLockSession(
      sessionId: sessionId,
      requiredAmountCl: requiredAmountCl,
      loggedAmountCl: 0,
      activatedAt: activatedAt,
      isActive: true,
      skipAllowed: true
    )

    try saveSession(session)

    let store = ManagedSettingsStore(named: storeName)
    store.shield.applications = selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens.isEmpty ? nil : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens
    #else
    throw SoftLockError.unsupported
    #endif
  }

  func deactivateSoftLock(input: [String: Any]) async throws {
    #if canImport(ManagedSettings)
    guard #available(iOS 16.0, *) else {
      throw SoftLockError.unsupported
    }

    let sessionId = try requiredString(input["sessionId"], fieldName: "sessionId")

    guard let activeSession = readSession() else {
      clearWaterfirstStore()
      return
    }

    guard activeSession.sessionId == sessionId else {
      throw SoftLockError.sessionMismatch
    }

    clearWaterfirstStore()
    try clearSession()
    #else
    throw SoftLockError.unsupported
    #endif
  }

  func getStatus() async throws -> [String: Any?] {
    #if canImport(FamilyControls)
    guard #available(iOS 16.0, *) else {
      return unsupportedStatus()
    }

    let session = readSession()
    let selection = readSelection()

    return [
      "supported": true,
      "authorizationStatus": authorizationStatus(),
      "isActive": session?.isActive ?? false,
      "selectedApplicationCount": selection.map(selectionCount) ?? 0,
      "activeSessionId": session?.sessionId
    ]
    #else
    return unsupportedStatus()
    #endif
  }

  func clearApplicationSelection() async throws {
    guard let defaults = sharedDefaults() else {
      throw SoftLockError.appGroupMissing
    }

    defaults.removeObject(forKey: selectionKey)
  }

  private func unsupportedStatus() -> [String: Any?] {
    [
      "supported": false,
      "authorizationStatus": "unsupported",
      "isActive": false,
      "selectedApplicationCount": 0,
      "activeSessionId": nil
    ]
  }

  private func authorizationStatus() -> String {
    #if canImport(FamilyControls)
    guard #available(iOS 16.0, *) else {
      return "unsupported"
    }

    switch AuthorizationCenter.shared.authorizationStatus {
    case .notDetermined:
      return "notDetermined"
    case .approved:
      return "approved"
    case .denied:
      return "denied"
    @unknown default:
      return "unknown"
    }
    #else
    return "unsupported"
    #endif
  }

  private func sharedDefaults() -> UserDefaults? {
    guard let appGroupIdentifier, !appGroupIdentifier.isEmpty else {
      return nil
    }

    return UserDefaults(suiteName: appGroupIdentifier)
  }

  #if canImport(FamilyControls)
  @available(iOS 16.0, *)
  private func saveSelection(_ selection: FamilyActivitySelection) throws {
    guard let defaults = sharedDefaults() else {
      throw SoftLockError.appGroupMissing
    }

    defaults.set(try JSONEncoder().encode(selection), forKey: selectionKey)
  }

  @available(iOS 16.0, *)
  private func readSelection() -> FamilyActivitySelection? {
    guard let data = sharedDefaults()?.data(forKey: selectionKey) else {
      return nil
    }

    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  @available(iOS 16.0, *)
  private func selectionCount(_ selection: FamilyActivitySelection) -> Int {
    selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
  }
  #endif

  private func saveSession(_ session: SharedSoftLockSession) throws {
    guard let defaults = sharedDefaults() else {
      throw SoftLockError.appGroupMissing
    }

    defaults.set(try JSONEncoder().encode(session), forKey: sessionKey)
  }

  private func readSession() -> SharedSoftLockSession? {
    guard let data = sharedDefaults()?.data(forKey: sessionKey) else {
      return nil
    }

    return try? JSONDecoder().decode(SharedSoftLockSession.self, from: data)
  }

  private func clearSession() throws {
    guard let defaults = sharedDefaults() else {
      throw SoftLockError.appGroupMissing
    }

    defaults.removeObject(forKey: sessionKey)
  }

  private func clearWaterfirstStore() {
    #if canImport(ManagedSettings)
    if #available(iOS 16.0, *) {
      let store = ManagedSettingsStore(named: storeName)
      store.shield.applications = nil
      store.shield.applicationCategories = nil
      store.shield.webDomains = nil
    }
    #endif
  }

  private func requiredString(_ value: Any?, fieldName: String) throws -> String {
    guard let value = value as? String, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      throw SoftLockError.invalidInput("\(fieldName) is required.")
    }

    return value
  }

  private func requiredPositiveInt(_ value: Any?, fieldName: String) throws -> Int {
    guard let number = value as? Int, number > 0 else {
      throw SoftLockError.invalidInput("\(fieldName) must be greater than 0.")
    }

    return number
  }
}

private struct SharedSoftLockSession: Codable {
  let sessionId: String
  let requiredAmountCl: Int
  let loggedAmountCl: Int
  let activatedAt: String
  let isActive: Bool
  let skipAllowed: Bool
}
