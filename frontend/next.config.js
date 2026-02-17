/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Resolve aliases for compatibility
    resolveAlias: {
      // Ensure framer-motion works correctly
      'framer-motion': 'framer-motion',
    },
  },

  // Transpile packages that need it
  transpilePackages: ['antd', '@ant-design/icons', 'framer-motion'],

  // Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ✅ Proxy backend API to Express on :4000 (avoids cookie/CORS issues)
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/backend-uploads/:path*',
        destination: 'http://localhost:4000/uploads/:path*',
      },
    ];
  },

  // Disable server actions warning for now
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig

