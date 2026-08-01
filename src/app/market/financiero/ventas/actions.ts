"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subirArchivo } from "@/lib/financiero/storage";
import { obtenerOCrearCliente } from "@/lib/financiero/entidades";
import { parseArchivoPedidos } from "@/lib/financiero/parse-pedidos";
import { agruparPedidos } from "@/lib/financiero/agrupar-pedidos";
import { recalcularIngresoPedidos } from "@/lib/financiero/recalcular-ingreso-pedidos";
import type { Canal, MapeoColumnas } from "@/lib/financiero/types";
import { formatFechaCorta } from "@/lib/financiero/types";
import type { ResultadoAnulacionLote } from "@/lib/financiero/anulacion-lote";

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
  const fechaLote = String(formData.get("fecha_lote") ?? "");
  const canal = (String(formData.get("canal") ?? "") || null) as Canal | null;

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo." };
  }
  if (!nombreFormato) return { error: "Escribe un nombre para el formato (ej. Menú)." };
  if (!fechaLote) return { error: "Selecciona la fecha del despacho/venta." };

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

    const fechaFila = fechaValida(pedido.fecha) ?? fechaLote;

    filasPedidos.push({
      cliente_id,
      formato_id,
      plataforma: nombreFormato,
      id_orden_externo: pedido.idOrdenExterno,
      fecha: fechaFila,
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
  const fechasCanalTocados = new Map<string, { fecha: string; canal: Canal | null }>();
  for (const fila of filasPedidos) {
    fechasCanalTocados.set(`${fila.fecha}|${fila.canal ?? ""}`, {
      fecha: fila.fecha,
      canal: fila.canal,
    });
  }

  for (const { fecha, canal: canalGrupo } of fechasCanalTocados.values()) {
    try {
      await recalcularIngresoPedidos(supabase, fecha, canalGrupo);
    } catch (err) {
      return {
        error: `Los pedidos se guardaron, pero no se pudo actualizar el ingreso automático de la fecha ${fecha}: ${
          err instanceof Error ? err.message : "error desconocido"
        }. Revísalo manualmente en Ingresos.`,
      };
    }

    let manualQuery = supabase
      .from("ingresos_semanales")
      .select("id")
      .eq("fecha", fecha)
      .in("origen", ["manual", "excel"]);
    manualQuery = canalGrupo
      ? manualQuery.eq("canal", canalGrupo)
      : manualQuery.is("canal", null);
    const { data: manualExistente } = await manualQuery.maybeSingle();
    if (manualExistente) {
      advertencias.push(
        `La fecha ${fecha} ya tiene un ingreso manual/Excel además de los pedidos cargados. Revisa que no se esté contando dos veces.`,
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
    .select("fecha, canal")
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

  try {
    await recalcularIngresoPedidos(supabase, pedido.fecha, pedido.canal);
  } catch (err) {
    return {
      error: `El pedido se anuló, pero no se pudo actualizar el ingreso automático de la fecha: ${
        err instanceof Error ? err.message : "error desconocido"
      }. Revísalo manualmente en Ingresos.`,
    };
  }

  revalidatePath("/market/financiero/ventas");
  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/pagos");

  return { error: null };
}

export async function anularPedidosLote(ids: string[]): Promise<ResultadoAnulacionLote> {
  if (ids.length === 0) return { anulados: 0, bloqueados: [] };
  const supabase = await createClient();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, fecha, canal, id_orden_externo")
    .in("id", ids);

  const { data: vistas } = await supabase
    .from("vista_pedidos_saldo")
    .select("id, monto_aplicado")
    .in("id", ids);
  const montoAplicadoPorId = new Map(
    (vistas ?? []).map((v) => [v.id, Number(v.monto_aplicado)]),
  );

  const bloqueados: { id: string; referencia: string; motivo: string }[] = [];
  const anulables: { id: string; fecha: string; canal: Canal | null }[] = [];

  for (const p of pedidos ?? []) {
    const referencia = `Pedido ${p.id_orden_externo} (${formatFechaCorta(p.fecha)})`;
    const montoAplicado = montoAplicadoPorId.get(p.id) ?? 0;
    if (montoAplicado > 0.01) {
      bloqueados.push({ id: p.id, referencia, motivo: "tiene un pago cruzado" });
    } else {
      anulables.push({ id: p.id, fecha: p.fecha, canal: p.canal });
    }
  }

  if (anulables.length === 0) return { anulados: 0, bloqueados };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("pedidos")
    .update({ anulado: true, anulado_at: new Date().toISOString(), anulado_por: user?.id ?? null })
    .in(
      "id",
      anulables.map((p) => p.id),
    );

  if (error) {
    return {
      anulados: 0,
      bloqueados: [
        ...bloqueados,
        ...anulables.map((p) => ({
          id: p.id,
          referencia: `Pedido del ${formatFechaCorta(p.fecha)}`,
          motivo: `error al anular: ${error.message}`,
        })),
      ],
    };
  }

  const combos = new Map<string, { fecha: string; canal: Canal | null }>();
  for (const p of anulables) {
    combos.set(`${p.fecha}|${p.canal ?? ""}`, { fecha: p.fecha, canal: p.canal });
  }

  const advertencias: string[] = [];
  for (const { fecha, canal } of combos.values()) {
    try {
      await recalcularIngresoPedidos(supabase, fecha, canal);
    } catch (err) {
      advertencias.push(
        `No se pudo actualizar el ingreso automático del ${formatFechaCorta(fecha)}: ${
          err instanceof Error ? err.message : "error desconocido"
        }. Revísalo manualmente en Ingresos.`,
      );
    }
  }

  revalidatePath("/market/financiero/ventas");
  revalidatePath("/market/financiero/ingresos");
  revalidatePath("/market/financiero");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/pagos");

  return {
    anulados: anulables.length,
    bloqueados,
    advertencias: advertencias.length ? advertencias : undefined,
  };
}
