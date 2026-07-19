import { BackLink } from "@/components/back-link";
import { TabNav } from "@/components/tab-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { getBusinessUnit, getModule } from "@/lib/business-units";
import { createClient } from "@/lib/supabase/server";

const unit = getBusinessUnit("market")!;
const mod = getModule("market", "financiero")!;

const TABS = [
  { href: "/market/financiero/ingresos", label: "Ingresos" },
  { href: "/market/financiero/ventas", label: "Ventas" },
  { href: "/market/financiero/costos", label: "Costos y gastos" },
  { href: "/market/financiero/pagos", label: "Recibos de pago" },
  { href: "/market/financiero/resultados", label: "Resultados" },
];

export default async function FinancieroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <BackLink href={`/${unit.slug}`} label={unit.name} />
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex size-10 items-center justify-center rounded-xl ${mod.colors.iconBg}`}
              >
                <mod.icon className="size-5" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {mod.name}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {mod.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.email && (
                <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
                  {user.email}
                </span>
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-6">
          <TabNav items={TABS} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
