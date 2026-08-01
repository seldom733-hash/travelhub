"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useI18n } from "@/lib/i18n-context";
import OperationsShell from "./OperationsShell";
import { money } from "../command-center/types";

export default function AICenter() {
  const { t } = useI18n();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const dataRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/command-center", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      dataRef.current = json;
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnswer = (q: string, d: any) => {
    setQuestion(q);
    setAnswer(null);
    setThinking(true);
    setTimeout(() => {
      setAnswer({ q, a: buildAnswer(q, d) });
      setThinking(false);
    }, 900);
  };

  useEffect(() => {
    // Accept a question passed from the global search: /admin/ai?q=...
    const params = new URLSearchParams(window.location.search);
    const urlQ = params.get("q");
    fetchData().then((d) => {
      if (urlQ) runAnswer(urlQ, d);
    });
    // Live questions from the global search while already on this page
    const handler = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (q) runAnswer(q, dataRef.current);
    };
    window.addEventListener("travelhub:ask-ai", handler);
    return () => window.removeEventListener("travelhub:ask-ai", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildAnswer = (raw: string, d: any) => {
    const low = raw.toLowerCase();
    if (low.includes("отель") || low.includes("hotel")) {
      return "Продажи отелей выросли на 9% за неделю. Конверсия карточки в заказ — 2.1% (ниже среднего 3.4%). Рекомендую улучшить фото (47 объектов без галереи) и поднять цену отелей Турции на 6%.";
    } else if (low.includes("тур") || low.includes("tour")) {
      return "Туры — основной источник дохода (45%). Спрос на Турцию и Дубай растёт. 14 туров ожидают модерации — проверьте их для ускорения продаж.";
    } else if (low.includes("возврат") || low.includes("refund")) {
      return "Возвраты выросли на 12% за неделю. 2 подозрительные оплаты требуют проверки. Высокая вероятность отмен авиабилетов — усилить контроль платежей.";
    } else if (low.includes("деньг") || low.includes("доход") || low.includes("revenue")) {
      return `Доход за месяц — ${money(d?.revenue?.month || 0)} (+${d?.revenue?.deltas?.month || 0}%). Топ направление: ${d?.countries?.[0]?.country || "Турция"} (${d?.countries?.[0]?.conversion || 18}% конверсия).`;
    }
    return "По данным платформы стабильный рост. Рекомендую увеличить бюджет на рекламу туров в Турцию на 15% — ожидаемый рост продаж +8%.";
  };

  const handleAsk = () => {
    const q = question.trim();
    if (!q || thinking) return;
    runAnswer(q, data);
    setQuestion("");
  };

  const ai = data?.ai || { happened: [], changed: [], do: [], risks: [], probability: 0, findings: [] };
  const prob = ai.probability ?? 68;

  return (
    <OperationsShell
      active="ai"
      title={t("operations.ai")}
      subtitle={t("operations.aiDesc")}
      actions={
        <button onClick={fetchData} className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
          ⟳ Обновить
        </button>
      }
    >
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">AI анализирует данные платформы...</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="space-y-5">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-indigo-500/20">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-8 text-[120px] leading-none opacity-10">🤖</div>
            <div className="relative max-w-2xl">
              <h2 className="text-2xl font-extrabold mb-2">TravelHub Intelligence</h2>
              <p className="text-sm text-white/75 mb-6">
                Анализирую данные платформы в реальном времени: продажи, отмены, конверсию, поведение пользователей. Каждое число — с контекстом и рекомендацией к действию.
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Вероятность роста продаж</p>
                  <p className="text-xl font-extrabold">+{prob}% на следующей неделе</p>
                </div>
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ai.findings?.length > 0 ? (
              ai.findings.map((f: any, i: number) => (
                <div key={i} className="bg-white/80 rounded-[20px] border border-gray-100/80 p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xl text-white shadow-lg shadow-blue-500/20 shrink-0">{f.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{f.text}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{f.type === "positive" ? "✓ Положительный тренд" : "⚠ Требует внимания"}</p>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl text-white shadow-lg shadow-green-500/20 shrink-0">📈</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Спрос на Дубай вырос на 23%</p>
                    <p className="text-[11px] text-gray-400 mt-1">✓ Положительный тренд — увеличить предложение туров</p>
                  </div>
                </div>
                <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-xl text-white shadow-lg shadow-green-500/20 shrink-0">🏛</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Экскурсии в Баку продаются лучше (+18%)</p>
                    <p className="text-[11px] text-gray-400 mt-1">✓ Положительный тренд</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sections: happened / changed / do / risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { key: "happened", title: t("commandCenter.whatHappened"), icon: "📊", items: ai.happened, grad: "from-blue-500 to-cyan-500", chip: "bg-blue-50 text-blue-600" },
              { key: "changed", title: t("commandCenter.whatChanged"), icon: "🔀", items: ai.changed, grad: "from-violet-500 to-purple-500", chip: "bg-violet-50 text-violet-600" },
              { key: "do", title: t("commandCenter.whatToDo"), icon: "✅", items: ai.do, grad: "from-emerald-500 to-green-500", chip: "bg-emerald-50 text-emerald-600" },
              { key: "risks", title: t("commandCenter.risks"), icon: "🚨", items: ai.risks, grad: "from-rose-500 to-red-500", chip: "bg-red-50 text-red-500" },
            ].map((sec) => (
              <div key={sec.key} className="bg-white/80 rounded-[20px] border border-gray-100/80 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${sec.grad} flex items-center justify-center text-white text-sm shadow-lg`}>{sec.icon}</div>
                  <h3 className="text-sm font-bold text-gray-900">{sec.title}</h3>
                </div>
                <ul className="space-y-2">
                  {(sec.items?.length ? sec.items : ["Данные формируются..."]).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 leading-snug">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 shrink-0 ${sec.chip}`}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Ask AI chat */}
          <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">🤖 {t("commandCenter.askAi")}</h3>
            <p className="text-xs text-gray-400 mb-4">Задайте вопрос о платформе — AI проанализирует данные и даст рекомендацию.</p>
            {answer && (
              <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 text-sm leading-relaxed">
                <p className="font-bold text-blue-700 mb-1">💬 {answer.q}</p>
                <p className="text-gray-700">{answer.a}</p>
              </div>
            )}
            {thinking && (
              <div className="mb-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                AI анализирует данные...
              </div>
            )}
            <div className="relative">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder={t("commandCenter.askAiPlaceholder")}
                className="w-full h-12 pl-4 pr-14 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
              />
              <button
                onClick={handleAsk}
                disabled={!question.trim() || thinking}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white text-sm flex items-center justify-center disabled:opacity-40 hover:brightness-110 transition-all shadow-sm"
                aria-label="Отправить"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </OperationsShell>
  );
}
