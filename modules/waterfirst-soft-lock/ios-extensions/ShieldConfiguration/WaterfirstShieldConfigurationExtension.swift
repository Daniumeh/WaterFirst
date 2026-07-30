import ManagedSettings
import ManagedSettingsUI
import UIKit

final class WaterfirstShieldConfigurationExtension: ShieldConfigurationDataSource {
  override func configuration(shielding application: Application) -> ShieldConfiguration {
    configuration()
  }

  override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
    configuration()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    configuration()
  }

  private func configuration() -> ShieldConfiguration {
    ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 0.012, green: 0.063, blue: 0.110, alpha: 1),
      icon: UIImage(named: "Icon"),
      title: ShieldConfiguration.Label(
        text: "Hydration check-in",
        color: UIColor.white
      ),
      subtitle: ShieldConfiguration.Label(
        text: "Drink and log your water in Waterfirst to continue.",
        color: UIColor(red: 0.608, green: 0.702, blue: 0.769, alpha: 1)
      ),
      primaryButtonLabel: ShieldConfiguration.Label(
        text: "Return to Waterfirst",
        color: UIColor.white
      ),
      primaryButtonBackgroundColor: UIColor(red: 0.125, green: 0.780, blue: 1.000, alpha: 1),
      secondaryButtonLabel: ShieldConfiguration.Label(
        text: "Skip for now",
        color: UIColor(red: 0.486, green: 0.902, blue: 1.000, alpha: 1)
      )
    )
  }
}
