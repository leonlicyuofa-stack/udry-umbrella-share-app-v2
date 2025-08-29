import UIKit
import Capacitor
import WebKit

class ViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Instantiate our custom UI delegate
        let myUIDelegate = MyUIDelegate()
        
        // Assign the custom delegate to the webView
        // This is necessary for the permission requests to be handled correctly.
        self.bridge?.getWebView()?.uiDelegate = myUIDelegate
    }
}
