/** @type {import('next').NextConfig} */

// Load environment variables from the root .env file
require('dotenv').config({ path: '../.env' });

const nextConfig = {
  // Your existing Next.js configuration can go here.
  // For now, we only need to ensure the .env file is loaded.
};

module.exports = nextConfig;
