"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import CommandCenterTopBar from "@/components/admin/command-center/CommandCenterTopBar";
import CommandCenterNav from "@/components/admin/command-center/CommandCenterNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // If the admin asks AI from the global search on a non-Command-Center page,
  // route the question to the AI Center.
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (!q) return;
      if (pathname === "/admin" || pathname.startsWith("/admin/ai")) return; // handled by the page itself
      router.push(`/admin/ai?q=${encodeURIComponent(q)}`);
    };
    window.addEventListener("travelhub:ask-ai", handler);
    return () => window.removeEventListener("travelhub:ask-ai", handler);
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/40">
      {/* Top block: logo | global search | admin profile */}
      <div className="sticky top-0 z-40">
        <CommandCenterTopBar />
        {/* Below it — the new horizontal admin menu */}
        <CommandCenterNav onLogout={handleLogout} />
      </div>
      <div>{children}</div>
    </div>
  );
}
