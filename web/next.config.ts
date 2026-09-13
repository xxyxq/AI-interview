import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/Node.js 部署模式（standalone 输出）
  output: 'standalone',
  reactCompiler: true,
  // 允许外部图片
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

