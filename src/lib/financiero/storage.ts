import type { SupabaseClient } from "@supabase/supabase-js";

export async function subirArchivo(
  supabase: SupabaseClient,
  bucket: string,
  file: File,
): Promise<string> {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const path = `${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  return path;
}

export async function urlFirmada(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  expiresIn = 60 * 10,
): Promise<string | null> {
  const { data } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
