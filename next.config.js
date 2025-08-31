/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `output: 'export'` option is re-enabled to generate a static site,
  // which is required by Capacitor to have an `index.html` entry point.
  output: 'export',

  // This is required for Capacitor. The default Next.js Image Optimization API
  // requires a server, which doesn't exist in a static export for a mobile app.
  // This setting ensures images work correctly in the native build.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
