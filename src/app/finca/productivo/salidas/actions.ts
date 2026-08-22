"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DestinoSalida, GrupoAnimalId } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioSalida = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/salidas";
const DESTINOS = ["ciclo_market", "tercero", "otro"];

function revalidarTodo(animalIds: string[] = []) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/lotes");
  revalidatePath("/finca/productivo/indicadores");
  for (const id of animalIds) revalidatePath(`/finca/productivo/animales/${id}`);
}

export async function crearSalida(
  _prevState: EstadoFormularioSalida,
  formData: FormData,
): Promise<EstadoFormularioSalida> {
  const supabase = await createClient();

  const modo = String(formData.get("modo") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const destino = String(formData.get("destino") ?? "") as DestinoSalida;
  const comprador = String(formData.get("comprador") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!fecha) return { error: "Selecciona la fecha." };
  if (!DESTINOS.includes(destino)) return { error: "Selecciona el destino." };

  if (modo === "lote") {
    const grupo_id = String(formData.get("grupo_id") ?? "") as GrupoAnimalId;
    const cantidadTexto = String(formData.get("cantidad") ?? "");
    const cantidad = Number(cantidadTexto);
    if (!grupo_id) return { error: "Selecciona el grupo." };
    if (!cantidadTexto || !Number.isInteger(cantidad) || cantidad <= 0) {
      return { error: "Ingresa una cantidad válida." };
    }

    const { error } = await supabase
      .from("salidas_lote")
      .insert({ grupo_id, fecha, cantidad, destino, comprador, notas });
    if (error) return { error: `No se pudo guardar la salida: ${error.message}` };

    revalidarTodo();
    return { error: null, ts: Date.now() };
  }

  const animalIds = formData.getAll("animal_ids").map(String).filter(Boolean);
  if (animalIds.length === 0) return { error: "Selecciona al menos un animal." };

  // Un solo venta_grupo_id compartido para poder anular la venta completa de un
  // clic aunque cubra varias chapetas; sin esto cada fila tomaría su propio
  // default aleatorio y quedarían desligadas entre sí.
  const ventaGrupoId = crypto.randomUUID();
  const { error } = await supabase.from("salidas_individuales").insert(
    animalIds.map((animal_id) => ({
      animal_id,
      fecha,
      destino,
      comprador,
      notas,
      venta_grupo_id: ventaGrupoId,
    })),
  );
  if (error) return { error: `No se pudo guardar la salida: ${error.message}` };

  revalidarTodo(animalIds);
  return { error: null, ts: Date.now() };
}

export async function anularSalida(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = { anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null };

  const { data: individual } = await supabase
    .from("salidas_individuales")
    .update(marca)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (!individual) {
    const { error } = await supabase.from("salidas_lote").update(marca).eq("id", id);
    if (error) return { error: `No se pudo anular el registro: ${error.message}` };
  }

  revalidarTodo();
  return { error: null };
}

export async function anularSalidasLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = { anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null };

  const { data: individuales } = await supabase
    .from("salidas_individuales")
    .update(marca)
    .in("id", ids)
    .select("id");
  const idsIndividuales = new Set((individuales ?? []).map((r) => r.id));
  const idsRestantes = ids.filter((id) => !idsIndividuales.has(id));

  if (idsRestantes.length > 0) {
    await supabase.from("salidas_lote").update(marca).in("id", idsRestantes);
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
