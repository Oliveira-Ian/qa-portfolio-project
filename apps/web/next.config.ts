import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Minimal self-contained server + node_modules for the Docker image.
  output: 'standalone',
};

export default nextConfig;
