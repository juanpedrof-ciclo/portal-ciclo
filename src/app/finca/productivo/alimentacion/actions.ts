"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GrupoAnimalId, TipoAlimento } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioAlimentacion = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/alimentacion";

export async function crearAlimentacion(
  _prevState: EstadoFormularioAlimentacion,
  formData: FormData,
): Promise<EstadoFormularioAlimentacion> {
  const supabase = await createClient();

  const grupo_id = String(formData.get("grupo_id") ?? "") as GrupoAnimalId;
  const fecha = String(formData.get("fecha") ?? "");
  const kgTexto = String(formData.get("kg_alimento") ?? "");
  const kg_alimento = Number(kgTexto);
  const tipo_alimento = String(formData.get("tipo_alimento") ?? "") as TipoAlimento;
  const insumo_id = String(formData.get("insumo_id") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!grupo_id) return { error: "Selecciona el grupo." };
  if (!fecha) return { error: "Selecciona la fecha." };
  if (!kgTexto || Number.isNaN(kg_alimento) || kg_alimento <= 0) {
    return { error: "Ingresa un peso de alimento válido." };
  }
  if (!["concentrado", "pasto", "otro"].includes(tipo_alimento)) {
    return { error: "Selecciona el tipo de alimento." };
  }

  const { error } = await supabase
    .from("alimentacion_registros")
    .insert({ grupo_id, fecha, kg_alimento, tipo_alimento, insumo_id, notas });

  if (error) return { error: `No se pudo guardar el registro: ${error.message}` };

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  revalidatePath("/finca/productivo/insumos/inventario");
  return { error: null, ts: Date.now() };
}

export async function anularAlimentacion(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("alimentacion_registros")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el registro: ${error.message}` };

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  revalidatePath("/finca/productivo/insumos/inventario");
  return { error: null };
}

export async function anularAlimentacionLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("alimentacion_registros")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in("id", ids);

  if (error) {
    return {
      anulados: 0,
      bloqueados: ids.map((id) => ({ id, referencia: `Registro ${id}`, motivo: `error al anular: ${error.message}` })),
    };
  }

  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/indicadores");
  revalidatePath("/finca/productivo/insumos/inventario");
  return { anulados: ids.length, bloqueados: [] };
}
