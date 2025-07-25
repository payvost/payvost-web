import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// ✅ Use Firebase Hosting backend domain for static assets in production
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'backend--payvost.us-central1.hosted.app',
      },
    ],
  },
  assetPrefix: isProd ? 'https://backend--payvost.us-central1.hosted.app' : undefined,
};

// Injected by Firebase Studio
const { setConfig } = require('next/config');
setConfig(nextConfig);

export default nextConfig;
