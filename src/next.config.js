/** @type {import('next').NextConfig} */

// Check if the build is running in a production environment (e.g., via 'npm run build')
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // The `output: 'export'` option is required by Capacitor.
  // We only apply this during a production build (`npm run build`) to avoid
  // breaking the development server (`npm run dev`).
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
