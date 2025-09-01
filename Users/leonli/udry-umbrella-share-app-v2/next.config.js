/** @type {import('next').NextConfig} */

// The conditional logic has been removed. 
// The `output: 'export'` is now always set for `npm run build`.
// The `npm run dev` script will be modified to ignore this setting.
const nextConfig = {
  // The `output: 'export'` option is required by Capacitor for static exports.
  output: 'export',

  // This setting is required for static exports to work correctly with the Next.js Image component.
  // It disables the default server-based image optimization.
  images: {
    unoptimized: true,
  },

  // This helps ensure client-side routing works correctly from the file:// protocol in Capacitor.
  trailingSlash: true,
};

module.exports = nextConfig;
