"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { CommandCenterData } from "./types";
import { PlatformState, NeedsAttention, RevenueBlock, AIBlock } from "./CommandCenterBlocks";
import CommandCenterSecond from "./CommandCenterSecond";
import CommandCenterAIPanel from "./CommandCenterAIPanel";

export default function CommandCenter() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/command-center", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      fetchData();
    } else {
      router.push("/auth/login?redirect=/admin");
    }
  }, [isLoading, isAuthenticated, user, fetchData, router]);

  // Watchdog: never leave the user on an infinite spinner
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      setError("Request timed out");
      setLoading(false);
    }, 15000);
    return () => clearTimeout(t);
  }, [loading]);

  // Auto refresh every 60s
  useEffect(() => {
    if (!data) return;
    const id = setInterval(() => fetchData(), 60000);
    return () => clearInterval(id);
  }, [data, fetchData]);

  // Listen for AI questions from the global search in the top bar
  useEffect(() => {
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (q) setAiQuestion(q);
    };
    window.addEventListener("travelhub:ask-ai", handler);
    return () => window.removeEventListener("travelhub:ask-ai", handler);
  }, []);

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

  if (!isAuthenticated) return null;

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">{t("commandCenter.loading")}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md">
          <div className="text-5xl mb-4">🛡</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("commandCenter.error")}</h2>
          <p className="text-sm text-gray-500 mb-4">{error || t("commandCenter.noData")}</p>
          <button onClick={fetchData} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
            {t("commandCenter.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* ═══ FIRST SCREEN — 4 blocks ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <PlatformState data={data} />
            <NeedsAttention data={data} />
            <RevenueBlock data={data} />
            <AIBlock data={data} />
          </div>

          {/* ═══ SECOND SCREEN ═══ */}
          <CommandCenterSecond data={data} />
        </div>

        {/* Right: fixed AI panel */}
        <CommandCenterAIPanel data={data} externalQuestion={aiQuestion} onExternalHandled={() => setAiQuestion(null)} />
      </div>
    </div>
  );
}
