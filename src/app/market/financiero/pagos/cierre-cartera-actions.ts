"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PreviewCierreCartera = {
  pedidos: { cantidad: number; total: number };
  ingresos: { cantidad: number; total: number };
  total: { cantidad: number; total: number };
};

export type ResultadoCierreCartera = {
  error: string | null;
  cerrados?: { pedidos: number; ingresos: number };
  total?: number;
};

type ObjetivoPendiente = { id: string; saldo_pendiente: number };

function revalidarCierreCartera() {
  revalidatePath("/market/financiero/pagos");
  revalidatePath("/market/financiero/resultados/cartera-clientes");
  revalidatePath("/market/financiero/resultados/cuentas-por-cobrar");
  revalidatePath("/market/financiero/resultados/pg");
  revalidatePath("/market/financiero/ventas");
  revalidatePath("/market/financiero");
}

async function buscarPendientes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fecha: string,
) {
  const [pedidosRes, ingresosRes] = await Promise.all([
    supabase
      .from("vista_pedidos_saldo")
      .select("id, saldo_pendiente")
      .lt("fecha", fecha)
      .gt("saldo_pendiente", 0.01)
      .returns<ObjetivoPendiente[]>(),
    supabase
      .from("vista_ingresos_saldo")
      .select("id, saldo_pendiente")
      .neq("origen", "pedidos")
      .lt("fecha", fecha)
      .gt("saldo_pendiente", 0.01)
      .returns<ObjetivoPendiente[]>(),
  ]);

  if (pedidosRes.error || ingresosRes.error) {
    return {
      pedidos: null,
      ingresos: null,
      error: `No se pudo consultar la cartera pendiente: ${pedidosRes.error?.message ?? ingresosRes.error?.message}`,
    };
  }

  return { pedidos: pedidosRes.data ?? [], ingresos: ingresosRes.data ?? [], error: null };
}

export async function previewCierreCartera(
  fecha: string,
): Promise<{ data: PreviewCierreCartera | null; error: string | null }> {
  if (!fecha) return { data: null, error: "Selecciona la fecha de corte." };
  const supabase = await createClient();

  const { pedidos, ingresos, error } = await buscarPendientes(supabase, fecha);
  if (error || !pedidos || !ingresos) return { data: null, error };

  const pedidosResumen = {
    cantidad: pedidos.length,
    total: pedidos.reduce((s, p) => s + Number(p.saldo_pendiente), 0),
  };
  const ingresosResumen = {
    cantidad: ingresos.length,
    total: ingresos.reduce((s, i) => s + Number(i.saldo_pendiente), 0),
  };

  return {
    data: {
      pedidos: pedidosResumen,
      ingresos: ingresosResumen,
      total: {
        cantidad: pedidosResumen.cantidad + ingresosResumen.cantidad,
        total: pedidosResumen.total + ingresosResumen.total,
      },
    },
    error: null,
  };
}

export async function ejecutarCierreCartera(fecha: string): Promise<ResultadoCierreCartera> {
  if (!fecha) return { error: "Selecciona la fecha de corte." };
  const supabase = await createClient();

  const { pedidos, ingresos, error } = await buscarPendientes(supabase, fecha);
  if (error || !pedidos || !ingresos) return { error };

  if (pedidos.length === 0 && ingresos.length === 0) {
    return { error: null, cerrados: { pedidos: 0, ingresos: 0 }, total: 0 };
  }

  type Objetivo = {
    referencia: string;
    monto: number;
    pedidoId: string | null;
    ingresoId: string | null;
  };

  const objetivos: Objetivo[] = [
    ...pedidos.map((p) => ({
      referencia: `hist:pedido:${p.id}`,
      monto: Number(p.saldo_pendiente),
      pedidoId: p.id,
      ingresoId: null,
    })),
    ...ingresos.map((i) => ({
      referencia: `hist:ingreso:${i.id}`,
      monto: Number(i.saldo_pendiente),
      pedidoId: null,
      ingresoId: i.id,
    })),
  ];

  const { data: pagosCreados, error: errorPagos } = await supabase
    .from("pagos")
    .insert(
      objetivos.map((o) => ({
        tipo: "cobro_cliente",
        fecha,
        monto: o.monto,
        destino: "historico",
        referencia: o.referencia,
        notas: `Cierre masivo de cartera histórica · corte ${fecha}`,
      })),
    )
    .select("id, referencia")
    .returns<{ id: string; referencia: string }[]>();

  if (errorPagos || !pagosCreados) {
    return { error: `No se pudo registrar el cierre: ${errorPagos?.message}` };
  }

  const idPorReferencia = new Map(pagosCreados.map((p) => [p.referencia, p.id]));

  if (idPorReferencia.size !== objetivos.length) {
    await supabase.from("pagos").delete().in("id", pagosCreados.map((p) => p.id));
    return { error: "No se pudo correlacionar los pagos generados con la cartera a cerrar. Se revirtió el cierre." };
  }

  const aplicaciones = objetivos.map((o) => ({
    pago_id: idPorReferencia.get(o.referencia) as string,
    pedido_id: o.pedidoId,
    ingreso_id: o.ingresoId,
    monto_aplicado: o.monto,
  }));

  const { error: errorAplicaciones } = await supabase.from("pago_aplicaciones").insert(aplicaciones);

  if (errorAplicaciones) {
    await supabase.from("pagos").delete().in("id", pagosCreados.map((p) => p.id));
    return { error: `No se pudo aplicar el cierre, se revirtió: ${errorAplicaciones.message}` };
  }

  revalidarCierreCartera();

  return {
    error: null,
    cerrados: { pedidos: pedidos.length, ingresos: ingresos.length },
    total: objetivos.reduce((s, o) => s + o.monto, 0),
  };
}
