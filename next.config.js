/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [];
  },
  async rewrites() {
    return [
      {
        source: '/r/:slug',
        destination: '/api/r/:slug',
      },
    ];
  },
};

module.exports = nextConfig;
