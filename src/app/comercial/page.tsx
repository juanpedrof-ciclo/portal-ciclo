import { AppPlaceholder } from "@/components/app-placeholder";
import { apps } from "@/lib/apps";

const app = apps.find((a) => a.slug === "comercial")!;

export const metadata = { title: "Comercial · Portal Ciclo" };

export default function ComercialPage() {
  return (
    <AppPlaceholder
      title={app.name}
      description="Seguimiento de ventas semanales: aquí vivirá el registro y análisis de ventas del área comercial."
      icon={app.icon}
      iconBg={app.colors.iconBg}
    />
  );
}
