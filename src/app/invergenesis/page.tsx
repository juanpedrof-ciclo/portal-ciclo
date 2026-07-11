import { AppPlaceholder } from "@/components/app-placeholder";
import { apps } from "@/lib/apps";

const app = apps.find((a) => a.slug === "invergenesis")!;

export const metadata = { title: "Invergénesis · Portal Ciclo" };

export default function InvergenesisPage() {
  return (
    <AppPlaceholder
      title={app.name}
      description="Costos y cartera de proveedor: aquí vivirá el seguimiento financiero del proyecto Invergénesis."
      icon={app.icon}
      iconBg={app.colors.iconBg}
    />
  );
}
