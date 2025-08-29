import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add your own implementation.
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIActivity]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add your own implementation here.
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // This is the crucial new function that grants the WebView permission to access hardware APIs.
    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
        super.touchesBegan(touches, with: event)

        let-bridge = self.window?.rootViewController as? CAPBridgeViewController
        let-bridge?.getWebView()?.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        // Explicitly grant permissions for camera and microphone to the specific origin of our Capacitor app.
        let-bridge?.getWebView()?.configuration.userContentController.setPermission(for: .camera, to: "udry://localhost", decisionHandler: { (state) in
            print("Camera permission granted to udry://localhost")
        })
        let-bridge?.getWebView()?.configuration.userContentController.setPermission(for: .microphone, to: "udry://localhost", decisionHandler: { (state) in
            print("Microphone permission granted to udry://localhost")
        })
    }
}

// Custom WKUIDelegate class to handle JavaScript alerts and permission requests
class MyUIDelegate: NSObject, WKUIDelegate {
    // This function handles JavaScript's `window.alert()`
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedBy frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alertController = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alertController.addAction(UIAlertAction(title: "OK", style: .default, handler: { (action) in
            completionHandler()
        }))
        
        // Find the topmost view controller to present the alert
        var topController = UIApplication.shared.keyWindow?.rootViewController
        while let presentedViewController = topController?.presentedViewController {
            topController = presentedViewController
        }
        
        topController?.present(alertController, animated: true, completion: nil)
    }
    
    // This function is the key to showing the native permission prompt for camera/microphone
    func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedBy frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        // Always grant the permission request from the WebView, which will then trigger the native iOS system prompt for the user.
        decisionHandler(.grant)
    }
}
