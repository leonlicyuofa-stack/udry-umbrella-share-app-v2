/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `output: 'export'` option is required by Capacitor to generate a static site
  // with an `index.html` entry point. The build process will place the output in the `/out` directory.
  output: 'export',

  // This setting is required for static exports to work correctly with the Next.js Image component.
  // It disables the default server-based image optimization.
  images: {
    unoptimized: true,
  },

  // NEW: This disables the modern App Router's advanced features that are incompatible with a static export.
  // This helps ensure client-side routing works correctly from the file:// protocol.
  trailingSlash: true,
};

module.exports = nextConfig;
