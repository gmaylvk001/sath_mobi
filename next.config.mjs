/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sathyamobiles.com",
        pathname: "/uploads/categories/**",
      },
      {
        protocol: "https",
        hostname: "www.sathyamobiles.com",
        pathname: "/uploads/categories/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/categories/**",
      },
    ],
  },
};

export default nextConfig;
