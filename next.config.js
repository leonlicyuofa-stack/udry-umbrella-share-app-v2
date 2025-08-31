/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `output: 'export'` option has been removed to enable the standard
  // Next.js server-based build, which is required for dynamic authentication
  // and to resolve the re-rendering loop with Capacitor.

  // This is required for Capacitor. The default Next.js Image Optimization API
  // requires a server, which doesn't exist in a static export for a mobile app.
  // This setting ensures images work correctly in the native build.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
