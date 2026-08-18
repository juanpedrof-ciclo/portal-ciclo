import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { createClient } from "@/lib/supabase/server";
import { EditarFormatoForm } from "./editar-formato-form";
import type { FormatoCarga, Unidad } from "@/lib/financiero/types";

export const metadata = { title: "Editar formato · Módulo Financiero" };

export default async function EditarFormatoPage({
  params,
}: {
  params: Promise<{ unidad: string; id: string }>;
}) {
  const { unidad, id } = (await params) as { unidad: Unidad; id: string };
  const supabase = await createClient();
  const { data: formato } = await supabase
    .from("formatos_carga")
    .select("*")
    .eq("unidad", unidad)
    .eq("id", id)
    .maybeSingle<FormatoCarga>();

  if (!formato) notFound();

  return (
    <div className="flex flex-col gap-4">
      <BackLink href={`/${unidad}/financiero/ventas/formatos`} label="Formatos de carga" />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Editar formato: {formato.nombre}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Escribe el nombre exacto de la columna tal como aparece en el archivo. El cambio solo
          aplica a las próximas cargas que usen este formato; los pedidos ya cargados no se
          reprocesan.
        </p>
      </div>

      <EditarFormatoForm unidad={unidad} formato={formato} />
    </div>
  );
}
