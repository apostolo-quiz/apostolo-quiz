/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.BUILD_TARGET === 'android' ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
