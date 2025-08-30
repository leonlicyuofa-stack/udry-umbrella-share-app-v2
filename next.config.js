/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the crucial line that tells Next.js to build a static site
  // into the 'out' directory, which is required by Capacitor.
  output: 'export',

  // By removing trailingSlash, Next.js will generate pages in the format
  // /about.html instead of /about/index.html. This is a more modern
  // approach and resolves the 404 error without complex server rules.
  
  // This is also required for Capacitor. The default Next.js Image Optimization API
  // requires a server, which doesn't exist in a static export for a mobile app.
  // This setting ensures images work correctly in the native build.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
