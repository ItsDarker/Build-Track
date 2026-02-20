/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    resolveAlias: {
      'framer-motion': 'framer-motion',
    },
  },

  transpilePackages: ['antd', '@ant-design/icons', 'framer-motion'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ✅ In production, BACKEND_URL is set as an env var on the Cloud Run service.
  // In local dev it falls back to localhost:4000.
  // NOTE: BACKEND_URL (no NEXT_PUBLIC_ prefix) is read at Node.js runtime by
  // Next.js rewrites — it is NOT baked into the browser bundle.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/backend-uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
