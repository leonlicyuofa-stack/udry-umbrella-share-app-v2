
const fs = require('fs');
const path = require('path');
const plist = require('plist');

const infoPlistPath = path.resolve(__dirname, '../ios/App/App/Info.plist');
const bundleIdentifier = 'com.udry.app';
const urlScheme = 'udry';
const cameraUsageDescription = 'To scan QR codes on umbrella stalls for renting and returning.';
const bluetoothUsageDescription = 'This app uses Bluetooth to connect to and unlock U-Dry umbrella machines.';

console.log(`Reading Info.plist from: ${infoPlistPath}`);

if (!fs.existsSync(infoPlistPath)) {
  console.error('Error: Info.plist file not found!');
  process.exit(1);
}

try {
  const infoPlistXml = fs.readFileSync(infoPlistPath, 'utf8');
  const infoPlistJson = plist.parse(infoPlistXml);

  // --- 1. Ensure URL Scheme ---
  console.log('Ensuring URL Scheme is configured...');
  if (!infoPlistJson.CFBundleURLTypes) {
    infoPlistJson.CFBundleURLTypes = [];
    console.log('Created CFBundleURLTypes array.');
  }

  let urlTypeEntry = infoPlistJson.CFBundleURLTypes.find(
    (entry) => entry.CFBundleURLName === bundleIdentifier
  );

  if (urlTypeEntry) {
    console.log('Found existing URL Type entry. Ensuring scheme is present.');
    if (!urlTypeEntry.CFBundleURLSchemes) {
      urlTypeEntry.CFBundleURLSchemes = [];
    }
    if (!urlTypeEntry.CFBundleURLSchemes.includes(urlScheme)) {
      urlTypeEntry.CFBundleURLSchemes.push(urlScheme);
      console.log(`Added '${urlScheme}' to existing schemes.`);
    } else {
      console.log(`'${urlScheme}' scheme already exists. No changes needed.`);
    }
  } else {
    console.log('URL Type entry not found. Creating a new one.');
    infoPlistJson.CFBundleURLTypes.push({
      CFBundleURLName: bundleIdentifier,
      CFBundleURLSchemes: [urlScheme],
    });
  }
  console.log('✅ URL Scheme configuration is correct.');


  // --- 2. Ensure Camera Permission ---
  console.log('Ensuring Camera Usage Description is present...');
  if (infoPlistJson.NSCameraUsageDescription) {
    console.log(`Camera permission already exists: "${infoPlistJson.NSCameraUsageDescription}"`);
  } else {
    infoPlistJson.NSCameraUsageDescription = cameraUsageDescription;
    console.log('Added NSCameraUsageDescription.');
  }
  console.log('✅ Camera permission configuration is correct.');


  // --- 3. Ensure Bluetooth Permission ---
  console.log('Ensuring Bluetooth Usage Description is present...');
  if (infoPlistJson.NSBluetoothAlwaysUsageDescription) {
    console.log(`Bluetooth permission already exists: "${infoPlistJson.NSBluetoothAlwaysUsageDescription}"`);
  } else {
    infoPlistJson.NSBluetoothAlwaysUsageDescription = bluetoothUsageDescription;
    console.log('Added NSBluetoothAlwaysUsageDescription.');
  }
  console.log('✅ Bluetooth permission configuration is correct.');


  // Convert back to XML and write to the file
  const updatedInfoPlistXml = plist.build(infoPlistJson);
  fs.writeFileSync(infoPlistPath, updatedInfoPlistXml);

  console.log('✅ Successfully configured Info.plist for all required native features.');
  process.exit(0);

} catch (error) {
  console.error('An error occurred during plist configuration:', error);
  process.exit(1);
}
