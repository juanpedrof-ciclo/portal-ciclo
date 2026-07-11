import { AppPlaceholder } from "@/components/app-placeholder";
import { apps } from "@/lib/apps";

const app = apps.find((a) => a.slug === "cartera")!;

export const metadata = { title: "Cartera · Portal Ciclo" };

export default function CarteraPage() {
  return (
    <AppPlaceholder
      title={app.name}
      description="Control de cobros y pagos: aquí vivirá el estado de cartera de clientes y proveedores."
      icon={app.icon}
      iconBg={app.colors.iconBg}
    />
  );
}
