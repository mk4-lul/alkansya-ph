/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      { source: "/compound", destination: "/calculators/compound" },
      { source: "/mp2", destination: "/calculators/mp2" },
      { source: "/investment", destination: "/calculators/investment" },
      { source: "/afford", destination: "/calculators/afford" },
      { source: "/utang", destination: "/calculators/utang" },
      { source: "/usdphp", destination: "/calculators/usdphp" },
    ];
  },
}
module.exports = nextConfig
