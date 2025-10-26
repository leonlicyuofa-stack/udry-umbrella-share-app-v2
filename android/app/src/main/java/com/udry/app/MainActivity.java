
package com.udry.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.CapConfig;

public class MainActivity extends BridgeActivity {

  private static final String TAG = "UDRY_DIAGNOSTIC";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "--- MainActivity.onCreate() START ---");
    
    // TEMPORARY DIAGNOSTIC OVERRIDE
    // This block creates a new CapConfig builder, sets the *server URL* before the bridge is initialized,
    // and then creates the bridge with this temporary config. This is the correct way to
    // force the app to load a specific page for debugging.
    CapConfig.Builder configBuilder = new CapConfig.Builder(this);
    configBuilder.setServerUrl("file:///android_asset/public/diag.html");
    CapConfig config = configBuilder.create();
    this.init(savedInstanceState, config);
    // END TEMPORARY OVERRIDE
    
    // We are calling init() above instead of super.onCreate() to use our custom config.
    // super.onCreate(savedInstanceState); 
    
    Log.d(TAG, "--- MainActivity.onCreate() (super.onCreate() finished) ---");
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
