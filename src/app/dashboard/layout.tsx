import { CompanySwitcher } from "@/components/admin/company-switcher";
import { HavnnLogo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserCard } from "@/components/layout/user-card";
import { getCompanyOptions, getSession } from "@/lib/data/queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const footer = <UserCard session={session} />;
  const admin = session.admin ? { companies: await getCompanyOptions(), companyId: session.company.id } : undefined;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-card/40 p-4 lg:flex">
        <HavnnLogo withTagline className="mb-8 px-2 pt-1" />
        {admin && (
          <div className="mb-6">
            <CompanySwitcher companies={admin.companies} value={admin.companyId} />
          </div>
        )}
        <SidebarNav admin={Boolean(admin)} />
        <div className="mt-auto space-y-3">
          {session.demo && (
            <div className="rounded-lg border border-havnn-blue/25 bg-havnn-blue/10 px-3 py-2 text-xs text-blue-200">
              Mode démo — données fictives
            </div>
          )}
          {footer}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <MobileNav footer={footer} admin={admin} />
          <HavnnLogo />
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
