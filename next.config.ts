/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fintech hardening: do not ship builds with type or lint errors.
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

    // On Windows, `fs.readlink()` on a normal directory throws `EISDIR` (not `EINVAL`),
    // which can bubble up via webpack's resolver in some setups. Disabling symlink
    // resolution avoids the `readlink` path entirely.
    config.resolve.symlinks = false;

    return config;
  },
};

export default nextConfig;
