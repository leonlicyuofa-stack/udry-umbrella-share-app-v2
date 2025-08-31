
const fs = require('fs');
const path = require('path');
const plist = require('plist');

const infoPlistPath = path.resolve(__dirname, '../ios/App/App/Info.plist');
const bundleIdentifier = 'com.udry.app';
const urlScheme = 'udry';

console.log(`Reading Info.plist from: ${infoPlistPath}`);

if (!fs.existsSync(infoPlistPath)) {
  console.error('Error: Info.plist file not found!');
  process.exit(1);
}

try {
  const infoPlistXml = fs.readFileSync(infoPlistPath, 'utf8');
  const infoPlistJson = plist.parse(infoPlistXml);

  // Ensure CFBundleURLTypes array exists
  if (!infoPlistJson.CFBundleURLTypes) {
    infoPlistJson.CFBundleURLTypes = [];
    console.log('Created CFBundleURLTypes array.');
  }

  // Check if our app's specific URL Type definition already exists
  let urlTypeEntry = infoPlistJson.CFBundleURLTypes.find(
    (entry) => entry.CFBundleURLName === bundleIdentifier
  );

  if (urlTypeEntry) {
    console.log('Found existing URL Type entry. Ensuring scheme is present.');
    // Ensure CFBundleURLSchemes array exists within the entry
    if (!urlTypeEntry.CFBundleURLSchemes) {
      urlTypeEntry.CFBundleURLSchemes = [];
    }
    // Add our scheme if it's not already there
    if (!urlTypeEntry.CFBundleURLSchemes.includes(urlScheme)) {
      urlTypeEntry.CFBundleURLSchemes.push(urlScheme);
      console.log(`Added '${urlScheme}' to existing schemes.`);
    } else {
      console.log(`'${urlScheme}' scheme already exists. No changes needed.`);
    }
  } else {
    // If the entry doesn't exist, create it
    console.log('URL Type entry not found. Creating a new one.');
    infoPlistJson.CFBundleURLTypes.push({
      CFBundleURLName: bundleIdentifier,
      CFBundleURLSchemes: [urlScheme],
    });
  }

  // Convert back to XML and write to the file
  const updatedInfoPlistXml = plist.build(infoPlistJson);
  fs.writeFileSync(infoPlistPath, updatedInfoPlistXml);

  console.log('✅ Successfully configured Info.plist with URL scheme.');
  process.exit(0);

} catch (error) {
  console.error('An error occurred during plist configuration:', error);
  process.exit(1);
}
