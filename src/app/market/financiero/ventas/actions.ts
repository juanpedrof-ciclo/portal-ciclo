"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirArchivo } from "@/lib/financiero/storage";
import { obtenerOCrearCliente } from "@/lib/financiero/entidades";
import { parseArchivoPedidos } from "@/lib/financiero/parse-pedidos";
import { agruparPedidos } from "@/lib/financiero/agrupar-pedidos";
import { inicioSemanaActual } from "@/lib/financiero/dates";
import { recalcularIngresoPedidos } from "@/lib/financiero/recalcular-ingreso-pedidos";
import type { Canal, MapeoColumnas } from "@/lib/financiero/types";

export type ResumenCarga = {
  pedidos: number;
  clientesNuevos: number;
  montoTotal: number;
  advertencias: string[];
};

export type EstadoFormularioCarga =
  | { error: string | null; resumen?: ResumenCarga; ts?: number }
  | null;

function fechaValida(texto: string | null): string | null {
  if (!texto) return null;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString().slice(0, 10);
}

export async function procesarCargaVentas(
  _prevState: EstadoFormularioCarga,
  formData: FormData,
): Promise<EstadoFormularioCarga> {
  const supabase = await createClient();

  const archivo = formData.get("archivo");
  const nombreFormato = String(formData.get("nombre_formato") ?? "").trim();
  const mapeoTexto = String(formData.get("mapeo") ?? "");
  const guardarFormato = formData.get("guardar_formato") === "on";
  const semanaLote = String(formData.get("semana") ?? "");
  const canal = (String(formData.get("canal") ?? "") || null) as Canal | null;

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }
  if (!nombreFormato) return { error: "Escribe un nombre para el formato (ej. Menú)." };
  if (!semanaLote) return { error: "Selecciona la semana del lote." };

  let mapeo: MapeoColumnas;
  try {
    mapeo = JSON.parse(mapeoTexto);
  } catch {
    return { error: "El mapeo de columnas no es válido." };
  }
  if (!mapeo.cliente || !mapeo.id_orden || !mapeo.total) {
    return { error: "Mapea al menos cliente, ID de pedido y total." };
  }

  const buffer = await archivo.arrayBuffer();
  let filas;
  try {
    ({ filas } = await parseArchivoPedidos(buffer, archivo.name));
  } catch {
    return { error: "No se pudo leer el archivo." };
  }

  const pedidosAgrupados = agruparPedidos(filas, mapeo);
  if (pedidosAgrupados.length === 0) {
    return {
      error:
        "No se encontraron pedidos válidos en el archivo. Revisa el mapeo de columnas.",
    };
  }

  let formato_id: string | null =
    String(formData.get("formato_id_existente") ?? "") || null;
  if (guardarFormato) {
    const { data: creado, error: errorFormato } = await supabase
      .from("formatos_carga")
      .insert({ nombre: nombreFormato, mapeo_columnas: mapeo })
      .select("id")
      .single();

    if (!errorFormato) {
      formato_id = creado.id;
    } else if (errorFormato.code === "23505") {
      const { data: actualizado, error: errorUpdate } = await supabase
        .from("formatos_carga")
        .update({ mapeo_columnas: mapeo })
        .eq("nombre", nombreFormato)
        .select("id")
        .single();
      if (errorUpdate) return { error: `No se pudo guardar el formato: ${errorUpdate.message}` };
      formato_id = actualizado.id;
    } else {
      return { error: `No se pudo guardar el formato: ${errorFormato.message}` };
    }
  }

  let archivo_origen: string | null = null;
  try {
    archivo_origen = await subirArchivo(supabase, "pedidos-archivos", archivo);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo subir el archivo." };
  }

  const { count: clientesAntes } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true });

  const filasPedidos = [];
  for (const pedido of pedidosAgrupados) {
    let cliente_id: string;
    try {
      cliente_id = await obtenerOCrearCliente(supabase, pedido.cliente, pedido.telefono);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "No se pudo crear el cliente." };
    }

    const fechaFila = fechaValida(pedido.fecha) ?? semanaLote;
    const semanaFila = inicioSemanaActual(new Date(`${fechaFila}T00:00:00Z`));

    filasPedidos.push({
      cliente_id,
      formato_id,
      plataforma: nombreFormato,
      id_orden_externo: pedido.idOrdenExterno,
      fecha: fechaFila,
      semana: semanaFila,
      canal,
      monto_total: pedido.montoTotal,
      estado: pedido.estado,
      archivo_origen,
    });
  }

  const { count: clientesDespues } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true });

  const { error: errorPedidos } = await supabase
    .from("pedidos")
    .upsert(filasPedidos, { onConflict: "plataforma,id_orden_externo" });

  if (errorPedidos) {
    return { error: `No se pudo guardar los pedidos: ${errorPedidos.message}` };
  }

  const advertencias: string[] = [];
  const semanasCanalTocados = new Map<string, { semana: string; canal: Canal | null }>();
  for (const fila of filasPedidos) {
    semanasCanalTocados.set(`${fila.semana}|${fila.canal ?? ""}`, {
      semana: fila.semana,
      canal: fila.canal,
    });
  }

  for (const { semana, canal: canalGrupo } of semanasCanalTocados.values()) {
    await recalcularIngresoPedidos(supabase, semana, canalGrupo);

    let manualQuery = supabase
      .from("ingresos_semanales")
      .select("id")
      .eq("semana", semana)
      .in("origen", ["manual", "excel"]);
    manualQuery = canalGrupo
      ? manualQuery.eq("canal", canalGrupo)
      : manualQuery.is("canal", null);
    const { data: manualExistente } = await manualQuery.maybeSingle();
    if (manualExistente) {
      advertencias.push(
        `La semana ${semana} ya tiene un ingreso manual/Excel además de los pedidos cargados. Revisa que no se esté contando dos veces.`,
      );
    }
  }

  revalidatePath("/market/financiero/ventas");
  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cartera-clientes");

  return {
    error: null,
    ts: Date.now(),
    resumen: {
      pedidos: filasPedidos.length,
      clientesNuevos: (clientesDespues ?? 0) - (clientesAntes ?? 0),
      montoTotal: filasPedidos.reduce((sum, f) => sum + f.monto_total, 0),
      advertencias,
    },
  };
}

export async function anularPedido(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("semana, canal")
    .eq("id", id)
    .single();
  if (!pedido) return { error: "El pedido ya no existe." };

  const { data: vista } = await supabase
    .from("vista_pedidos_saldo")
    .select("monto_aplicado")
    .eq("id", id)
    .maybeSingle();
  if (vista && Number(vista.monto_aplicado) > 0.01) {
    return {
      error:
        "Este pedido tiene un pago cruzado. Anula primero el pago aplicado antes de anular este pedido.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pedidos")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .eq("id", id);
  if (error) return { error: `No se pudo anular el pedido: ${error.message}` };

  await recalcularIngresoPedidos(supabase, pedido.semana, pedido.canal);

  revalidatePath("/market/financiero/ventas");
  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/pagos");

  return { error: null };
}
