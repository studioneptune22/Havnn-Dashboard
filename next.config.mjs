/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rendu PDF des rapports (route /dashboard/rapports/generer) : laissé à Node, hors bundle.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
  },
};

export default nextConfig;
