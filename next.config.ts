import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __filename equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      // Serve flag assets from /public/flag when requested via /flags
      { source: '/flags/:path*', destination: '/flag/:path*' },
    ];
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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'qwibil-remit.firebasestorage.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Webpack config is only used when NOT using Turbopack
  // When --turbopack flag is used, this config is ignored
  webpack: (config: any, { webpack, isServer }: { webpack: any; isServer: boolean }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@opentelemetry\/exporter-jaeger$/,
      }),
    );
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/cjs/handlebars.js',
    };
    
    // Fix webpack cache issues on Windows
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    return config;
  },
};

export default nextConfig;
