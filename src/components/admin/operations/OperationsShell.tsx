"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";

interface OperationsShellProps {
  active?: "partners" | "users" | "finance" | "marketing" | "ai" | "analytics" | "revenue";
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function OperationsShell({ title, subtitle, children, actions }: OperationsShellProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/login?redirect=" + pathname);
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl shadow-blue-500/30 mx-auto mb-4 animate-pulse">T</div>
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">{t("commandCenter.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-w-0">
      {/* Page header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/70 shadow-sm">
        <div className="flex items-center gap-4 h-16 px-4 lg:px-8 max-w-[1400px] mx-auto">
          <div className="min-w-0 flex-1">
            <h1 className="text-base lg:text-lg font-extrabold text-gray-900 tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </header>

      {/* Content */}
      <main className="p-4 lg:p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
