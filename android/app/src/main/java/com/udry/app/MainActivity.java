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
    
    // Initialize Capacitor plugins and the Bridge first
    super.onCreate(savedInstanceState);
    
    // Now that the bridge is initialized, we can safely log the config
    try {
        // This is a protected method from BridgeActivity
        String serverUrl = getServerUrl();
        if (serverUrl != null) {
            Log.d(TAG, "Capacitor Config: Server URL is defined as: " + serverUrl);
        } else {
            Log.d(TAG, "Capacitor Config: Server URL is null. App should be loading from local webDir.");
        }
    } catch (Exception e) {
        Log.e(TAG, "Error accessing Capacitor config after super.onCreate()", e);
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
