/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rendu PDF des rapports (route /dashboard/rapports/generer) : laissé à Node, hors bundle.
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer"],
    // pdfkit charge ses polices standard (Helvetica…) via un import dynamique que le
    // traçage de fichiers ne détecte pas : on les inclut explicitement dans la fonction.
    outputFileTracingIncludes: {
      "/dashboard/rapports/generer": ["./node_modules/pdfkit/js/standard-fonts/**/*", "./node_modules/pdfkit/js/data/**/*"],
    },
  },
};

export default nextConfig;
