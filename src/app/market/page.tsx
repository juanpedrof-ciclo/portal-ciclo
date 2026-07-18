import { UnitView } from "@/components/unit-view";
import { getBusinessUnit } from "@/lib/business-units";

const unit = getBusinessUnit("market")!;

export const metadata = { title: "Ciclo Market · Portal Ciclo" };

export default function MarketPage() {
  return <UnitView unit={unit} />;
}
