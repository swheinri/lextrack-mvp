// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_APP_BUILD_DATE: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  },
};

module.exports = nextConfig;