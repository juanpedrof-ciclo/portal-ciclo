import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Facturas (PDF/imagen) y Excel de ingresos pueden superar el 1MB por defecto.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
