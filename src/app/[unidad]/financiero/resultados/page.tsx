import { redirect } from "next/navigation";

export default async function ResultadosIndexPage({
  params,
}: {
  params: Promise<{ unidad: string }>;
}) {
  const { unidad } = await params;
  redirect(`/${unidad}/financiero/resultados/pg`);
}
