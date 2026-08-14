/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dotads/contracts", "@dotads/auth", "@dotads/db"],
};

export default nextConfig;
