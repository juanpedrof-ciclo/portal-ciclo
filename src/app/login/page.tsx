import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar · Portal Ciclo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Portal Ciclo
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ingresa con tu cuenta para continuar.
        </p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
