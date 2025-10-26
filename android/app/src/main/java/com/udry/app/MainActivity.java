
package com.udry.app;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.getcapacitor.CapConfig;

public class MainActivity extends BridgeActivity {

  private static final String TAG = "UDRY_DIAGNOSTIC";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    Log.d(TAG, "--- MainActivity.onCreate() START ---");
    super.onCreate(savedInstanceState);
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

  // This override is the definitive fix. It allows us to set the server URL
  // correctly *before* the bridge and webview are fully initialized,
  // preventing the incorrect 'localhost' default.
  @Override
  public void load() {
    CapConfig config = this.getBridge().getConfig();
    config.setServerUrl("file:///android_asset/public");
    Log.d(TAG, "DEEP_DIAGNOSIS: Successfully FORCED server URL to local asset path via load() override.");
    super.load();
  }
}
