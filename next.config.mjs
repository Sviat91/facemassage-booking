/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['googleapis', 'pino']
  },
  reactStrictMode: true
};

export default nextConfig;

