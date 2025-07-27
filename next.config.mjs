/** @type {import('next').NextConfig} */
const nextConfig = {
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
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@opentelemetry\/exporter-jaeger$/,
      }),
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/cjs/handlebars.js',
    };
    return config;
  },
};

// next.config.mjs
import nextPWA from 'next-pwa'
import { join } from 'path'

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true
})

const pwaNextConfig = {
  ...nextConfig,
  reactStrictMode: true,
  experimental: {
    // This allows cross-origin requests to the Next.js dev server.
    // This is required to allow devices on your local network (like your mobile phone)
    // to access the dev server.
    // The IP address should be the origin of the device making the request.
    // You may need to adjust the port if your client is not running on port 3000.
    allowedDevOrigins: ['http://192.168.237.4:3000'],
  },
}

export default withPWA(pwaNextConfig);
