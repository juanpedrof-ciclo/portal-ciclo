"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GrupoAnimalId } from "@/lib/productivo/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioNacimiento = { error: string | null; ts?: number } | null;

const RUTA = "/finca/productivo/nacimientos";

function revalidarTodo(animalId?: string | null) {
  revalidatePath(RUTA);
  revalidatePath("/finca/productivo");
  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo/lotes");
  revalidatePath("/finca/productivo/indicadores");
  if (animalId) revalidatePath(`/finca/productivo/animales/${animalId}`);
}

export async function crearNacimiento(
  _prevState: EstadoFormularioNacimiento,
  formData: FormData,
): Promise<EstadoFormularioNacimiento> {
  const supabase = await createClient();

  const modo = String(formData.get("modo") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!fecha) return { error: "Selecciona la fecha." };

  if (modo === "lote") {
    const grupo_id = String(formData.get("grupo_id") ?? "") as GrupoAnimalId;
    const cantidadTexto = String(formData.get("cantidad") ?? "");
    const cantidad = Number(cantidadTexto);
    if (!grupo_id) return { error: "Selecciona el grupo." };
    if (!cantidadTexto || !Number.isInteger(cantidad) || cantidad <= 0) {
      return { error: "Ingresa una cantidad válida." };
    }

    const { error } = await supabase
      .from("nacimientos_lote")
      .insert({ grupo_id, fecha, cantidad, notas });
    if (error) return { error: `No se pudo guardar el nacimiento: ${error.message}` };

    revalidarTodo();
    return { error: null, ts: Date.now() };
  }

  // modo === "individual"
  const madre_id = String(formData.get("madre_id") ?? "");
  const numCriasTexto = String(formData.get("num_crias") ?? "");
  const num_crias = Number(numCriasTexto);
  const criasVivasTexto = String(formData.get("crias_vivas") ?? "");
  const crias_vivas = Number(criasVivasTexto);
  const criasMachosTexto = String(formData.get("crias_machos") ?? "0");
  const crias_machos = Number(criasMachosTexto);
  const criasHembrasTexto = String(formData.get("crias_hembras") ?? "0");
  const crias_hembras = Number(criasHembrasTexto);
  const criaChapeta = String(formData.get("cria_chapeta") ?? "").trim() || null;

  if (!madre_id) return { error: "Selecciona la madre." };
  if (!Number.isInteger(num_crias) || num_crias <= 0) {
    return { error: "Ingresa el número de crías nacidas." };
  }
  if (!Number.isInteger(crias_vivas) || crias_vivas < 0 || crias_vivas > num_crias) {
    return { error: "El número de crías vivas no es válido." };
  }
  const crias_muertas = num_crias - crias_vivas;
  if (!Number.isInteger(crias_machos) || !Number.isInteger(crias_hembras) || crias_machos + crias_hembras !== crias_vivas) {
    return { error: "Machos + hembras debe ser igual al número de crías vivas." };
  }
  if (criaChapeta && crias_vivas !== 1) {
    return { error: "Solo puedes asignar chapeta a la cría cuando nace una sola con vida." };
  }

  const { data: madre } = await supabase
    .from("animales")
    .select("grupo_id")
    .eq("id", madre_id)
    .maybeSingle();
  if (!madre) return { error: "La madre seleccionada ya no existe." };

  let cria_animal_id: string | null = null;
  if (criaChapeta) {
    const { data: criaCreada, error: errorCria } = await supabase
      .from("animales")
      .insert({
        grupo_id: madre.grupo_id,
        chapeta: criaChapeta,
        fecha_nacimiento: fecha,
        fecha_ingreso: fecha,
        madre_id,
      })
      .select("id")
      .single();
    if (errorCria) {
      if (errorCria.code === "23505") {
        return { error: `Ya existe un animal con la chapeta "${criaChapeta}" en ese grupo.` };
      }
      return { error: `No se pudo registrar la cría: ${errorCria.message}` };
    }
    cria_animal_id = criaCreada.id;
  }

  const { error } = await supabase.from("nacimientos_individuales").insert({
    madre_id,
    fecha,
    num_crias,
    crias_vivas,
    crias_muertas,
    crias_machos,
    crias_hembras,
    cria_chapeta: criaChapeta,
    cria_animal_id,
    notas,
  });

  if (error) return { error: `No se pudo guardar el nacimiento: ${error.message}` };

  revalidarTodo(madre_id);
  return { error: null, ts: Date.now() };
}

export async function anularNacimiento(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Prueba en ambas tablas: el id puede ser de un nacimiento individual o de lote.
  const { data: individual } = await supabase
    .from("nacimientos_individuales")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (!individual) {
    const { error } = await supabase
      .from("nacimientos_lote")
      .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
      .eq("id", id);
    if (error) return { error: `No se pudo anular el nacimiento: ${error.message}` };
  }

  revalidarTodo();
  return { error: null };
}

export async function anularNacimientosLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const marca = { anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null };

  const { data: individuales } = await supabase
    .from("nacimientos_individuales")
    .update(marca)
    .in("id", ids)
    .select("id");
  const idsIndividuales = new Set((individuales ?? []).map((r) => r.id));
  const idsRestantes = ids.filter((id) => !idsIndividuales.has(id));

  if (idsRestantes.length > 0) {
    await supabase.from("nacimientos_lote").update(marca).in("id", idsRestantes);
  }

  revalidarTodo();
  return { anulados: ids.length, bloqueados: [] };
}
