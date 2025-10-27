
package com.udry.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // This is the crucial bug fix.
        // It disables hardware acceleration for the WebView to work around a
        // low-level graphics driver issue in the Android Emulator. This prevents the "white screen" crash.
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
    }
}
