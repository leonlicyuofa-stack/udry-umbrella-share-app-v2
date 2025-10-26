
/** @type {import('next').NextConfig} */

// This configuration has been updated to use 'standalone' output, which is better
// suited for server-like environments such as the one provided by Capacitor.
const nextConfig = {
  output: 'standalone',

  // This setting is required for static exports to work correctly with the Next.js Image component.
  images: {
    unoptimized: true,
  },

  // This helps ensure client-side routing works correctly from the file:// protocol in Capacitor.
  trailingSlash: true,
};

module.exports = nextConfig;
