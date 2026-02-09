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

  // Disable server actions warning for now
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
