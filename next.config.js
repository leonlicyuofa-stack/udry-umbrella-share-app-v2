/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the crucial line that tells Next.js to build a static site
  // into the 'out' directory, which is required by Capacitor.
  output: 'export',

  // By adding trailingSlash: true, Next.js will generate pages in the format
  // that Firebase Hosting expects (e.g., /about -> /about/index.html).
  // This resolves the 404 error when accessing pages directly via URL.
  trailingSlash: true,
  
  // This is also required for Capacitor. The default Next.js Image Optimization API
  // requires a server, which doesn't exist in a static export for a mobile app.
  // This setting ensures images work correctly in the native build.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
