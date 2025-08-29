import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }

    override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
      return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
      return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // This is the updated, backward-compatible function to handle webview permissions for Camera and Bluetooth.
    func application(_ application: UIApplication, didCreate newSceneSession: UISceneSession, for connectionOptions: UIScene.ConnectionOptions, with bridge: CAPBridgeProtocol) {
        if let webView = bridge.webView {
            // This is a legacy method, but it's the most reliable way to ask the webview
            // to grant permissions for media capture (camera/microphone) on our specific app origin.
            // This is the key line that enables the native permission pop-up to be triggered by our web code.
            WKWebsiteDataStore.default().requestMediaCapturePermission(for: webView.configuration.websiteDataStore, origin: webView.url!, initiatedByFrame: nil) { (granted) in
                if granted {
                    print("Media capture permission granted to webview.")
                } else {
                    print("Media capture permission denied to webview.")
                }
            }
        }
    }
}
