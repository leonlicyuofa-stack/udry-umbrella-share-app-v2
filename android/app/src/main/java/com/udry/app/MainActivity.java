
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
    
    // The previous attempt to log the server URL here was incorrect and broke the build.
    // That code has been removed. We are keeping the other lifecycle logs for diagnostics.
    
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
