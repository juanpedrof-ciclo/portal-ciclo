import { UnitView } from "@/components/unit-view";
import { getBusinessUnit } from "@/lib/business-units";

const unit = getBusinessUnit("finca")!;

export const metadata = { title: "Ciclo Finca · Portal Ciclo" };

export default function FincaPage() {
  return <UnitView unit={unit} />;
}
