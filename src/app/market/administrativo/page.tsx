import { ModulePlaceholder } from "@/components/module-placeholder";
import { getBusinessUnit, getModule } from "@/lib/business-units";

const unit = getBusinessUnit("market")!;
const mod = getModule("market", "administrativo")!;

export const metadata = { title: `${mod.name} · Ciclo Market · Portal Ciclo` };

export default function MarketAdministrativoPage() {
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
