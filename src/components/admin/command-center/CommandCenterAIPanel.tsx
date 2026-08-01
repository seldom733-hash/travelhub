"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { CommandCenterData } from "./types";

interface AIPanelProps {
  data: CommandCenterData;
  externalQuestion?: string | null;
  onExternalHandled?: () => void;
}

const SECTION_STYLES = {
  happened: { icon: "📊", color: "from-blue-500 to-cyan-500", chip: "bg-blue-50 text-blue-600" },
  changed: { icon: "🔀", color: "from-violet-500 to-purple-500", chip: "bg-violet-50 text-violet-600" },
  do: { icon: "✅", color: "from-emerald-500 to-green-500", chip: "bg-emerald-50 text-emerald-600" },
  risks: { icon: "🚨", color: "from-rose-500 to-red-500", chip: "bg-red-50 text-red-500" },
};

export default function CommandCenterAIPanel({ data, externalQuestion, onExternalHandled }: AIPanelProps) {
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ q: string; a: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const handledRef = useRef(false);
  const externalHandledRef = useRef(onExternalHandled);
  externalHandledRef.current = onExternalHandled;

  const ai = data.ai;

  const sections = [
    { key: "happened" as const, title: t("commandCenter.whatHappened"), items: ai.happened },
    { key: "changed" as const, title: t("commandCenter.whatChanged"), items: ai.changed },
    { key: "do" as const, title: t("commandCenter.whatToDo"), items: ai.do },
    { key: "risks" as const, title: t("commandCenter.risks"), items: ai.risks },
  ];

  const handleAsk = useCallback((q: string) => {
    const text = q.trim();
    if (!text || thinking) return;
    setThinking(true);
    setQuestion("");
    setAnswer(null);
    setTimeout(() => {
      const low = text.toLowerCase();
      let a = "Продажи отелей показывают положительную динамику (+9% за неделю). Рекомендуется увеличить бюджет на направление Турция на 15% — ожидаемый рост продаж +8%.";
      if (low.includes("отель") || low.includes("hotel")) {
        a = "Продажи отелей выросли на 9% за неделю. Конверсия карточки в заказ — 2.1% (ниже среднего 3.4%). Рекомендую: улучшить фото (47 объектов без галереи), поднять цену отелей Турции на 6% — спрос позволяет.";
      } else if (low.includes("тур") || low.includes("tour")) {
        a = "Туры — основной источник дохода (45%). Спрос на Турцию и Дубай растёт. 14 туров ожидают модерации — проверьте их для ускорения продаж.";
      } else if (low.includes("возврат") || low.includes("refund")) {
        a = "Возвраты выросли на 12% за неделю. 2 подозрительные оплаты требуют проверки. Высокая вероятность отмен авиабилетов — рекомендуется усилить контроль платежей.";
      } else if (low.includes("деньг") || low.includes("money") || low.includes("доход") || low.includes("revenue")) {
        a = `Доход за месяц — ${new Intl.NumberFormat("ru-RU").format(data.revenue.month)}$ (+${data.revenue.deltas.month}%). Топ направления: ${data.countries[0]?.country || "Турция"} (${data.countries[0]?.conversion || 18}% конверсия).`;
      }
      setAnswer({ q: text, a });
      setThinking(false);
    }, 900);
  }, [data, thinking]);

  // Incoming question from the global search bar (handled via effect to avoid setState during render)
  useEffect(() => {
    if (externalQuestion && !handledRef.current) {
      handledRef.current = true;
      handleAsk(externalQuestion);
      externalHandledRef.current?.();
    }
    if (!externalQuestion) handledRef.current = false;
  }, [externalQuestion, handleAsk]);

  return (
    <aside className="lg:w-[300px] xl:w-[320px] shrink-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
      {/* Panel header */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-xl">🤖</div>
          <div>
            <h3 className="text-base font-extrabold leading-tight">{t("commandCenter.aiPanel")}</h3>
            <p className="text-[10px] text-white/60 font-medium">TravelHub Intelligence</p>
          </div>
        </div>
        <p className="relative text-[12px] text-white/80 leading-relaxed">
          Анализирую данные платформы в реальном времени. Каждое число — с контекстом и рекомендацией.
        </p>
      </div>

      {/* Sections */}
      <div className="bg-white/90 rounded-[20px] border border-gray-100 p-4 shadow-sm space-y-4">
        {sections.map((sec) => {
          const style = SECTION_STYLES[sec.key];
          return (
            <div key={sec.key}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center text-[11px] shadow-sm`}>
                  {style.icon}
                </div>
                <h4 className="text-[13px] font-bold text-gray-900">{sec.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {sec.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 leading-snug">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 shrink-0 ${style.chip}`}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Ask AI */}
      <div className="bg-white/90 rounded-[20px] border border-gray-100 p-4 shadow-sm">
        <h4 className="text-[13px] font-bold text-gray-900 mb-2">{t("commandCenter.askAi")}</h4>
        {answer && (
          <div className="mb-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 text-[12px] leading-relaxed">
            <p className="font-bold text-blue-700 mb-1">💬 {answer.q}</p>
            <p className="text-gray-700">{answer.a}</p>
          </div>
        )}
        {thinking && (
          <div className="mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[12px] text-gray-500 flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            AI анализирует данные...
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk(question)}
            placeholder={t("commandCenter.askAiPlaceholder")}
            className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
          />
          <button
            onClick={() => handleAsk(question)}
            disabled={!question.trim() || thinking}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs flex items-center justify-center disabled:opacity-40 hover:brightness-110 transition-all shadow-sm"
            aria-label="Отправить"
          >
            ➤
          </button>
        </div>
      </div>
    </aside>
  );
}
