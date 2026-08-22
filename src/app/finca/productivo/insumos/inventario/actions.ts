"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { obtenerOCrearInsumoCategoria } from "@/lib/productivo/entidades";
import type { UnidadMedida } from "@/lib/productivo/types";

export type EstadoFormularioInsumo = { error: string | null; ts?: number } | null;

const NUEVO = "__nuevo__";
const UNIDADES_MEDIDA = ["kg", "bultos", "litros", "unidades"];

export async function crearInsumo(
  _prevState: EstadoFormularioInsumo,
  formData: FormData,
): Promise<EstadoFormularioInsumo> {
  const supabase = await createClient();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaSeleccionada = String(formData.get("categoria_id") ?? "");
  const nuevaCategoriaNombre = String(formData.get("nueva_categoria_nombre") ?? "").trim();
  const unidad_medida = String(formData.get("unidad_medida") ?? "") as UnidadMedida;
  const stockMinimoTexto = String(formData.get("stock_minimo") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim() || null;

  if (!nombre) return { error: "Escribe el nombre del insumo." };
  if (!categoriaSeleccionada) return { error: "Selecciona o crea una categoría." };
  if (categoriaSeleccionada === NUEVO && !nuevaCategoriaNombre) {
    return { error: "Escribe el nombre de la nueva categoría." };
  }
  if (!UNIDADES_MEDIDA.includes(unidad_medida)) return { error: "Selecciona la unidad de medida." };

  let stock_minimo: number | null = null;
  if (stockMinimoTexto) {
    stock_minimo = Number(stockMinimoTexto);
    if (Number.isNaN(stock_minimo) || stock_minimo < 0) {
      return { error: "El stock mínimo debe ser un número válido." };
    }
  }

  let categoria_id = categoriaSeleccionada;
  if (categoriaSeleccionada === NUEVO) {
    try {
      categoria_id = await obtenerOCrearInsumoCategoria(supabase, nuevaCategoriaNombre);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Error inesperado." };
    }
  }

  const { error } = await supabase
    .from("insumos")
    .insert({ nombre, categoria_id, unidad_medida, stock_minimo, notas });

  if (error) {
    if (error.code === "23505") return { error: `Ya existe un insumo con el nombre "${nombre}".` };
    return { error: `No se pudo crear el insumo: ${error.message}` };
  }

  revalidatePath("/finca/productivo/insumos/inventario");
  revalidatePath("/finca/productivo/insumos/entradas");
  revalidatePath("/finca/productivo/insumos/salidas");
  revalidatePath("/finca/productivo/alimentacion");
  revalidatePath("/finca/productivo");
  return { error: null, ts: Date.now() };
}
