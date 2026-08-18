"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirArchivo } from "@/lib/financiero/storage";
import {
  obtenerOCrearCategoria,
  obtenerOCrearProveedor,
} from "@/lib/financiero/entidades";
import type { EstadoFactura, TipoPL, Unidad } from "@/lib/financiero/types";
import { formatFechaCorta } from "@/lib/financiero/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

export type EstadoFormularioFactura = {
  error: string | null;
  ts?: number;
  advertenciaDuplicado?: string | null;
} | null;

const NUEVO = "__nuevo__";

export async function crearFactura(
  unidad: Unidad,
  _prevState: EstadoFormularioFactura,
  formData: FormData,
): Promise<EstadoFormularioFactura> {
  const supabase = await createClient();

  const proveedorSeleccionado = String(formData.get("proveedor_id") ?? "");
  const nuevoProveedorNombre = String(
    formData.get("nuevo_proveedor_nombre") ?? "",
  ).trim();
  const categoriaSeleccionada = String(formData.get("categoria_id") ?? "");
  const nuevaCategoriaNombre = String(
    formData.get("nueva_categoria_nombre") ?? "",
  ).trim();
  const nuevaCategoriaTipoPl = String(
    formData.get("nueva_categoria_tipo_pl") ?? "",
  ) as TipoPL;
  const fecha = String(formData.get("fecha") ?? "");
  const montoTexto = String(formData.get("monto") ?? "");
  const monto = Number(montoTexto);
  const estado = String(formData.get("estado") ?? "pendiente") as EstadoFactura;
  const numeroFactura = String(formData.get("numero_factura") ?? "").trim() || null;
  const notas = String(formData.get("notas") ?? "").trim() || null;
  const soporte = formData.get("soporte");

  if (!proveedorSeleccionado) return { error: "Selecciona o crea un proveedor." };
  if (proveedorSeleccionado === NUEVO && !nuevoProveedorNombre) {
    return { error: "Escribe el nombre del nuevo proveedor." };
  }
  if (!categoriaSeleccionada) return { error: "Selecciona o crea una categoría." };
  if (categoriaSeleccionada === NUEVO && !nuevaCategoriaNombre) {
    return { error: "Escribe el nombre de la nueva categoría." };
  }
  if (!fecha) return { error: "Selecciona la fecha de la factura." };
  if (!montoTexto || Number.isNaN(monto) || monto <= 0) {
    return { error: "Ingresa un monto válido." };
  }

  let proveedor_id = proveedorSeleccionado;
  let categoria_id = categoriaSeleccionada;

  try {
    if (proveedorSeleccionado === NUEVO) {
      proveedor_id = await obtenerOCrearProveedor(
        supabase,
        unidad,
        nuevoProveedorNombre,
      );
    }
    if (categoriaSeleccionada === NUEVO) {
      categoria_id = await obtenerOCrearCategoria(
        supabase,
        unidad,
        nuevaCategoriaNombre,
        nuevaCategoriaTipoPl,
      );
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error inesperado." };
  }

  const forzarGuardado = String(formData.get("forzar_guardado") ?? "") === "true";
  if (numeroFactura && !forzarGuardado) {
    const { data: duplicado } = await supabase
      .from("facturas")
      .select("fecha")
      .eq("unidad", unidad)
      .eq("proveedor_id", proveedor_id)
      .eq("numero_factura", numeroFactura)
      .eq("anulado", false)
      .maybeSingle();
    if (duplicado) {
      return {
        error: null,
        advertenciaDuplicado: `Ya existe una factura de este proveedor con el número ${numeroFactura}, registrada el ${formatFechaCorta(duplicado.fecha)}.`,
      };
    }
  }

  let soporte_url: string | null = null;
  if (soporte instanceof File && soporte.size > 0) {
    try {
      soporte_url = await subirArchivo(supabase, "facturas-soportes", soporte);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "No se pudo subir el soporte.",
      };
    }
  }

  const { error } = await supabase.from("facturas").insert({
    unidad,
    proveedor_id,
    categoria_id,
    fecha,
    monto,
    estado,
    numero_factura: numeroFactura,
    notas,
    soporte_url,
  });

  if (error) return { error: `No se pudo guardar la factura: ${error.message}` };

  revalidatePath(`/${unidad}/financiero/costos`);
  revalidatePath(`/${unidad}/financiero`);
  revalidatePath(`/${unidad}/financiero/resultados/pg`);
  revalidatePath(`/${unidad}/financiero/resultados/cuentas-por-pagar`);
  return { error: null, ts: Date.now() };
}

export async function anularFactura(
  unidad: Unidad,
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: vista } = await supabase
    .from("vista_facturas_saldo")
    .select("monto_aplicado")
    .eq("unidad", unidad)
    .eq("id", id)
    .maybeSingle();
  if (vista && Number(vista.monto_aplicado) > 0.01) {
    return {
      error:
        "Esta factura tiene un pago cruzado. Anula primero el pago aplicado antes de anular esta factura.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("facturas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("unidad", unidad)
    .eq("id", id);
  if (error) return { error: `No se pudo anular la factura: ${error.message}` };

  revalidatePath(`/${unidad}/financiero/costos`);
  revalidatePath(`/${unidad}/financiero`);
  revalidatePath(`/${unidad}/financiero/resultados/pg`);
  revalidatePath(`/${unidad}/financiero/resultados/cuentas-por-pagar`);
  revalidatePath(`/${unidad}/financiero/pagos`);

  return { error: null };
}

export async function anularFacturasLote(
  unidad: Unidad,
  ids: string[],
): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();

  const { data: facturas } = await supabase
    .from("facturas")
    .select("id, fecha, numero_factura")
    .eq("unidad", unidad)
    .in("id", ids);

  const { data: vistas } = await supabase
    .from("vista_facturas_saldo")
    .select("id, monto_aplicado")
    .eq("unidad", unidad)
    .in("id", ids);
  const montoAplicadoPorId = new Map(
    (vistas ?? []).map((v) => [v.id, Number(v.monto_aplicado)]),
  );

  const bloqueados: { id: string; referencia: string; motivo: string }[] = [];
  const anulables: string[] = [];

  for (const f of facturas ?? []) {
    const referencia = `Factura ${f.numero_factura ?? "sin número"} (${formatFechaCorta(f.fecha)})`;
    const montoAplicado = montoAplicadoPorId.get(f.id) ?? 0;
    if (montoAplicado > 0.01) {
      bloqueados.push({ id: f.id, referencia, motivo: "tiene un pago cruzado" });
    } else {
      anulables.push(f.id);
    }
  }

  if (anulables.length === 0) return { anulados: 0, bloqueados };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("facturas")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("unidad", unidad)
    .in("id", anulables);

  if (error) {
    return {
      anulados: 0,
      bloqueados: [
        ...bloqueados,
        ...anulables.map((id) => ({
          id,
          referencia: `Factura ${id}`,
          motivo: `error al anular: ${error.message}`,
        })),
      ],
    };
  }

  revalidatePath(`/${unidad}/financiero/costos`);
  revalidatePath(`/${unidad}/financiero`);
  revalidatePath(`/${unidad}/financiero/resultados/pg`);
  revalidatePath(`/${unidad}/financiero/resultados/cuentas-por-pagar`);
  revalidatePath(`/${unidad}/financiero/pagos`);

  return { anulados: anulables.length, bloqueados };
}
