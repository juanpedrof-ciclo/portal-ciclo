import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoPL } from "./types";

export async function obtenerOCrearProveedor(
  supabase: SupabaseClient,
  nombre: string,
): Promise<string> {
  const nombreLimpio = nombre.trim();
  const { data: creado, error } = await supabase
    .from("proveedores")
    .insert({ nombre: nombreLimpio })
    .select("id")
    .single();

  if (!error) return creado.id;

  if (error.code === "23505") {
    const { data: existente } = await supabase
      .from("proveedores")
      .select("id")
      .eq("nombre", nombreLimpio)
      .single();
    if (existente) return existente.id;
  }

  throw new Error(`No se pudo crear el proveedor: ${error.message}`);
}

export async function obtenerOCrearCliente(
  supabase: SupabaseClient,
  nombre: string,
  telefono: string,
): Promise<string> {
  const nombreLimpio = nombre.trim();
  const telefonoLimpio = telefono.trim();

  const { data: creado, error } = await supabase
    .from("clientes")
    .insert({ nombre: nombreLimpio, telefono: telefonoLimpio })
    .select("id")
    .single();

  if (!error) return creado.id;

  if (error.code === "23505") {
    const { data: existente } = await supabase
      .from("clientes")
      .select("id")
      .eq("nombre", nombreLimpio)
      .eq("telefono", telefonoLimpio)
      .single();
    if (existente) return existente.id;
  }

  throw new Error(`No se pudo crear el cliente: ${error.message}`);
}

export async function obtenerOCrearCategoria(
  supabase: SupabaseClient,
  nombre: string,
  tipoPl: TipoPL,
): Promise<string> {
  const nombreLimpio = nombre.trim();
  const { data: creada, error } = await supabase
    .from("categorias")
    .insert({ nombre: nombreLimpio, tipo_pl: tipoPl })
    .select("id")
    .single();

  if (!error) return creada.id;

  if (error.code === "23505") {
    const { data: existente } = await supabase
      .from("categorias")
      .select("id")
      .eq("nombre", nombreLimpio)
      .single();
    if (existente) return existente.id;
  }

  throw new Error(`No se pudo crear la categoría: ${error.message}`);
}
