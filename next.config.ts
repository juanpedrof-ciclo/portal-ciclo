import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unpdf empaqueta pdf.js (~1.5MB). Lo sacamos del bundle de Server Components /
  // Route Handlers para que se cargue con require nativo y solo en la función que
  // lo usa (el route leer-factura), nunca arrastrado a otras rutas.
  serverExternalPackages: ["unpdf"],
  experimental: {
    serverActions: {
      // Facturas (PDF/imagen) y Excel de ingresos pueden superar el 1MB por defecto.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
