import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://34.42.246.103:8000'}/api/:path*`, // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
