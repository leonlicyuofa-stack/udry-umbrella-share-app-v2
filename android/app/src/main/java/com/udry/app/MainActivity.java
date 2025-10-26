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
    
    // Log Capacitor configuration before super.onCreate() which initializes the bridge
    try {
        String serverUrl = getServerUrl();
        if (serverUrl != null) {
            Log.d(TAG, "Capacitor Config: Server URL is defined as: " + serverUrl);
        } else {
            Log.d(TAG, "Capacitor Config: Server URL is null. App should be loading from local webDir.");
        }
        String webDir = getWebDir();
        Log.d(TAG, "Capacitor Config: webDir is set to: " + webDir);
    } catch (Exception e) {
        Log.e(TAG, "Error accessing Capacitor config before super.onCreate()", e);
    }

    // Initialize Capacitor plugins and the Bridge
    super.onCreate(savedInstanceState);
    
    Log.d(TAG, "--- MainActivity.onCreate() END --- (super.onCreate() has been called)");
  }

  @Override
  protected void onStart() {
      super.onStart();
      Log.d(TAG, "--- MainActivity.onStart() --- The activity is becoming visible to the user.");
  }

  @Override
  protected void onResume() {
      super.onResume();
      Log.d(TAG, "--- MainActivity.onResume() --- The activity has come to the foreground.");
  }

  @Override
  protected void onPause() {
      super.onPause();
      Log.d(TAG, "--- MainActivity.onPause() --- The activity is going into the background.");
  }

  @Override
  protected void onStop() {
      super.onStop();
      Log.d(TAG, "--- MainActivity.onStop() --- The activity is no longer visible.");
  }

  @Override
  protected void onDestroy() {
      super.onDestroy();
      Log.d(TAG, "--- MainActivity.onDestroy() --- The activity is being destroyed.");
  }
}
