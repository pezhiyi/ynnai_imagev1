/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ynnaiiamge.gz.bcebos.com',
        pathname: '/images/**',
      }
    ],
  },
  // 确保开发服务器支持热重载
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 启用Fast Refresh
      config.optimization.runtimeChunk = 'single';
    }
    return config;
  },
  // 将BOS配置暴露给客户端
  env: {
    NEXT_PUBLIC_BAIDU_BOS_ENDPOINT: process.env.BAIDU_BOS_ENDPOINT,
    NEXT_PUBLIC_BAIDU_BOS_BUCKET: process.env.BAIDU_BOS_BUCKET,
    NEXT_PUBLIC_BAIDU_BOS_DOMAIN: process.env.BAIDU_BOS_DOMAIN,
  },
  async rewrites() {
    return [
      {
        source: '/api/baidu/:path*',
        destination: '/api/baidu/:path*',
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig 