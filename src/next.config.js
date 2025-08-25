/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  webpack: (config, { isServer }) => {
    if (isServer) {
      // These packages are required by Firebase but depend on browser APIs.
      // We mark them as external so they are not bundled on the server.
      config.externals.push(
        'encoding',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/functions',
        'firebase/storage'
      );
    }
    return config;
  },
};

module.exports = nextConfig;
