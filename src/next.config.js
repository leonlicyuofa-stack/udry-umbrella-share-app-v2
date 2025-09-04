/** @type {import('next').NextConfig} */

// This configuration has been updated to conditionally apply the `output: 'export'`
// setting. It is now ONLY active when `npm run build` is executed. The development
// server (`npm run dev`) will run in standard mode, resolving the incompatibility.
const isProd = process.env.npm_lifecycle_event === 'build';

const nextConfig = {
  // The `output: 'export'` option is required by Capacitor for static exports.
  // It is now conditionally applied only for production builds.
  output: isProd ? 'export' : undefined,

  // This setting is required for static exports to work correctly with the Next.js Image component.
  // It disables the default server-based image optimization.
  images: {
    unoptimized: true,
  },

  // This helps ensure client-side routing works correctly from the file:// protocol in Capacitor.
  trailingSlash: true,
};

module.exports = nextConfig;
