
package com.udry.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Logger;
import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import org.json.JSONException;

public class MainActivity extends BridgeActivity {

  private static final String TAG = "UDRY_DIAGNOSTIC";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "--- MainActivity.onCreate() START ---");
    
    super.onCreate(savedInstanceState);
    
    // --- DEEPER DIAGNOSTIC LOGGING AND FIX ---
    // This block will log what Capacitor is trying to do and then
    // programmatically remove the incorrect localhost override if it exists.
    try {
        Bridge bridge = this.getBridge();
        if (bridge != null) {
            JSObject config = bridge.getConfig();
            if (config.has("server")) {
                JSObject serverConfig = config.getJSObject("server");
                if (serverConfig != null && serverConfig.has("url")) {
                    String serverUrl = serverConfig.getString("url");
                    Log.d(TAG, "DEEP_DIAGNOSIS: Detected 'server.url' override: " + serverUrl);
                    // This is the critical fix: remove the incorrect URL override.
                    serverConfig.remove("url");
                    config.put("server", serverConfig);
                    // We must apply this modified config back to the bridge.
                    bridge.setConfig(config);
                    Log.d(TAG, "DEEP_DIAGNOSIS: Successfully REMOVED server.url override at runtime.");
                }
            } else {
                 Log.d(TAG, "DEEP_DIAGNOSIS: No 'server.url' override was found in the configuration.");
            }
        } else {
            Log.e(TAG, "DEEP_DIAGNOSIS: CRITICAL - Bridge object was null. Cannot inspect config.");
        }
    } catch (Exception e) {
        Log.e(TAG, "DEEP_DIAGNOSIS: CRITICAL - An error occurred while trying to modify the Capacitor config.", e);
    }
    
    Log.d(TAG, "--- MainActivity.onCreate() END ---");
  }

  @Override
  public void onStart() {
      super.onStart();
      Log.d(TAG, "--- MainActivity.onStart() --- The activity is becoming visible to the user.");
  }

  @Override
  public void onResume() {
      super.onResume();
      Log.d(TAG, "--- MainActivity.onResume() --- The activity has come to the foreground.");
  }

  @Override
  public void onPause() {
      super.onPause();
      Log.d(TAG, "--- MainActivity.onPause() --- The activity is going into the background.");
  }

  @Override
  public void onStop() {
      super.onStop();
      Log.d(TAG, "--- MainActivity.onStop() --- The activity is no longer visible.");
  }

  @Override
  public void onDestroy() {
      super.onDestroy();
      Log.d(TAG, "--- MainActivity.onDestroy() --- The activity is being destroyed.");
  }
}
