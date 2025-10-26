
package com.udry.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Logger;

public class MainActivity extends BridgeActivity {

  private static final String TAG = "UDRY_DIAGNOSTIC";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "--- MainActivity.onCreate() START ---");
    
    // This forces the app to use the bundled `out` directory instead of a localhost server.
    // It must be called BEFORE super.onCreate() to take effect.
    setServerBaseUrl("file:///android_asset/public");
    
    super.onCreate(savedInstanceState);
    
    // --- DEEPER DIAGNOSTIC LOGGING ---
    // This block will definitively log what server URL the compiled app is using.
    try {
        // The 'bridge' object is available after super.onCreate() is called.
        String serverUrl = bridge.getConfig().getServerUrl(); 
        if (serverUrl != null) {
            Log.d(TAG, "DEEP_DIAGNOSIS: Capacitor is loading from an explicit Server URL: " + serverUrl);
        } else {
            Log.d(TAG, "DEEP_DIAGNOSIS: Capacitor is loading from the default webDir (file:// protocol). No server override detected.");
        }
    } catch (Exception e) {
        Log.e(TAG, "DEEP_DIAGNOSIS: CRITICAL - Could not read Capacitor config from the bridge.", e);
    }
    
    Log.d(TAG, "--- MainActivity.onCreate() END --- (super.onCreate() has been called)");
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
