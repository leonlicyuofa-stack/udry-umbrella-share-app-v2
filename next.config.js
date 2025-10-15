/** @type {import('next').NextConfig} */

// This configuration has been updated to force a static export ('out') for all builds.
// This is the standard and required configuration for Capacitor apps.
const nextConfig = {
  // The `output: 'export'` option is required by Capacitor.
  output: 'export',

  // This setting is required for static exports to work correctly with the Next.js Image component.
  images: {
    unoptimized: true,
  },

  // This helps ensure client-side routing works correctly from the file:// protocol in Capacitor.
  trailingSlash: true,
};

module.exports = nextConfig;
