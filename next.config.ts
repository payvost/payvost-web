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
    
    // Remove custom cache configuration that causes issues in Vercel
    // Next.js handles webpack caching automatically and doesn't need manual config
    // The previous custom cache config was causing "Can't resolve next.config.compiled.js" errors
    if (config.cache && config.cache.buildDependencies) {
      // Remove buildDependencies to let Next.js handle it automatically
      delete config.cache.buildDependencies.config;
    }
    
    return config;
  },
};

export default nextConfig;
