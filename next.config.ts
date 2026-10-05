import type { NextConfig } from 'next';

// GitHub Pages build: GITHUB_PAGES=true → static export served from /<repo> sub-path.
const isPages = process.env.GITHUB_PAGES === 'true';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = isPages
  ? {
      output: 'export',
      basePath,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      distDir: process.env.NODE_ENV === 'production' ? '.next-production' : '.next',
    };

export default nextConfig;
