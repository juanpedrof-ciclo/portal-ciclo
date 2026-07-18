import { ModulePlaceholder } from "@/components/module-placeholder";
import { getBusinessUnit, getModule } from "@/lib/business-units";

const unit = getBusinessUnit("finca")!;
const mod = getModule("finca", "administrativo-financiero")!;

export const metadata = { title: `${mod.name} · Ciclo Finca · Portal Ciclo` };

export default function FincaAdministrativoFinancieroPage() {
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
