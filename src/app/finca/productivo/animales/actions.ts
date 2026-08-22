"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { GrupoAnimalId } from "@/lib/productivo/types";

export type EstadoFormularioAnimal = { error: string | null; ts?: number } | null;

export async function crearAnimal(
  _prevState: EstadoFormularioAnimal,
  formData: FormData,
): Promise<EstadoFormularioAnimal> {
  const supabase = await createClient();

  const grupo_id = String(formData.get("grupo_id") ?? "") as GrupoAnimalId;
  const chapeta = String(formData.get("chapeta") ?? "").trim();
  const fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim() || null;
  const fecha_ingreso = String(formData.get("fecha_ingreso") ?? "").trim();
  const madre_id = String(formData.get("madre_id") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!grupo_id) return { error: "Selecciona el grupo." };
  if (!chapeta) return { error: "Escribe la chapeta." };
  if (!fecha_ingreso) return { error: "Selecciona la fecha de ingreso." };

  const { error } = await supabase.from("animales").insert({
    grupo_id,
    chapeta,
    fecha_nacimiento,
    fecha_ingreso,
    madre_id,
    notas,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `Ya existe un animal con la chapeta "${chapeta}" en ese grupo.` };
    }
    return { error: `No se pudo registrar el animal: ${error.message}` };
  }

  revalidatePath("/finca/productivo/animales");
  revalidatePath("/finca/productivo");
  return { error: null, ts: Date.now() };
}
