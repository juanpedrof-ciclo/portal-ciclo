import { ModulePlaceholder } from "@/components/module-placeholder";
import { getBusinessUnit, getModule } from "@/lib/business-units";

const unit = getBusinessUnit("finca")!;
const mod = getModule("finca", "productivo")!;

export const metadata = { title: `${mod.name} · Ciclo Finca · Portal Ciclo` };

export default function FincaProductivoPage() {
  return (
    <ModulePlaceholder
      unitName={unit.name}
      unitHref={`/${unit.slug}`}
      moduleName={mod.name}
      icon={mod.icon}
      colors={mod.colors}
    />
  );
}
