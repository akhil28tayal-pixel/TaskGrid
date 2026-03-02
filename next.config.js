/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  // Netlify configuration
  output: 'standalone',
};

module.exports = nextConfig;
