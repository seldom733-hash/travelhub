"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";
import Breadcrumb from "@/components/Breadcrumb";

const levels = [
  { name: "TRAVELER", icon: "🎒", minPoints: 0, cashback: "2%", color: "from-gray-400 to-gray-500", perks: ["Базовый кешбэк 2%", "Доступ к акциям", "Email-поддержка"] },
  { name: "EXPLORER", icon: "🌍", minPoints: 500, cashback: "5%", color: "from-blue-400 to-blue-600", perks: ["Кешбэк 5%", "Приоритетная поддержка", "Эксклюзивные предложения", "Бесплатная отмена"] },
  { name: "PREMIUM", icon: "⭐", minPoints: 2000, cashback: "8%", color: "from-amber-400 to-orange-500", perks: ["Кешбэк 8%", "VIP-поддержка", "Ранний доступ к акциям", "Бесплатный апгрейд номера", "Подарок на день рождения"] },
  { name: "ELITE", icon: "💎", minPoints: 5000, cashback: "12%", color: "from-purple-500 to-pink-500", perks: ["Кешбэк 12%", "Персональный менеджер", "Лимитированные предложения", "Бесплатные трансферы", "Приглашения на мероприятия", "VIP-лounge в аэропортах"] },
];

interface Achievement {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
}

const defaultAchievements: Achievement[] = [
  { title: "Первое бронирование", description: "Совершите первое бронирование", icon: "🎯", unlocked: false },
  { title: "Путешественник", description: "Посетите 5 разных городов", icon: "🌍", unlocked: false },
  { title: "Фотограф", description: "Оставьте 10 отзывов", icon: "📸", unlocked: false },
  { title: "Эксперт", description: "Забронируйте 10 услуг", icon: "🏆", unlocked: false },
  { title: "VIP", description: "Достигните уровня Elite", icon: "💎", unlocked: false },
  { title: "Социальная бабочка", description: "Поделитесь 5 коллекциями", icon: "🦋", unlocked: false },
];

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface LoyaltyData {
  currentPoints: number;
  currentLevelName: string;
  transactions: Transaction[];
  achievements: Achievement[];
}

function transformLoyalty(json: unknown): LoyaltyData {
  const data = json as { user?: { bonusPoints?: number; level?: string }; transactions?: Transaction[]; achievements?: Achievement[] } | null;
  return {
    currentPoints: data?.user?.bonusPoints || 0,
    currentLevelName: data?.user?.level || "TRAVELER",
    transactions: data?.transactions || [],
    achievements: data?.achievements && data.achievements.length > 0 ? data.achievements : defaultAchievements,
  };
}

export default function LoyaltyPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"balance" | "transactions" | "achievements">("balance");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/loyalty");
    }
  }, [isAuthenticated, isLoading, router]);

  const { data, loading } = useFetch<LoyaltyData>(
    "/api/loyalty",
    { enabled: isAuthenticated, retries: 1, retryDelay: 2000, transform: transformLoyalty },
  );

  const currentPoints = data?.currentPoints ?? 0;
  const currentLevelName = data?.currentLevelName ?? "TRAVELER";
  const transactions = data?.transactions ?? [];
  const achievements = data?.achievements ?? defaultAchievements;

  if (isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentLevel = levels.find((l) => l.name === currentLevelName) || levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const progressPercent = nextLevel
    ? Math.min(100, ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
    : 100;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("loyalty.title") }]} />

        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary via-orange-500 to-primary-dark rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{currentLevel.icon}</span>
              <div>
                <h1 className="text-2xl font-bold">{t("loyalty.title")}</h1>
                <p className="text-white/80">{t("loyalty.level")}: {currentLevel.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-6">
              <div>
                <div className="text-3xl font-bold">{currentPoints}</div>
                <div className="text-sm text-white/70">{t("loyalty.points")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{currentLevel.cashback}</div>
                <div className="text-sm text-white/70">{t("loyalty.cashback")}</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{achievements.filter((a) => a.unlocked).length}/{achievements.length}</div>
                <div className="text-sm text-white/70">{t("loyalty.achievements")}</div>
              </div>
            </div>

            {nextLevel && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/80">{t("loyalty.progressTo")} {nextLevel.name}</span>
                  <span className="text-white font-medium">{currentPoints} / {nextLevel.minPoints}</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          {([["balance", "💰 Баллы"], ["transactions", "📋 История"], ["achievements", "🏆 Достижения"]] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "balance" && (
          <div className="space-y-6">
            {/* Levels */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-secondary mb-6">{t("loyalty.levelsTitle")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {levels.map((level) => {
                  const isActive = level.name === currentLevel.name;
                  return (
                    <div key={level.name} className={`rounded-2xl p-5 border-2 transition-all ${isActive ? "border-primary shadow-lg shadow-primary/10" : "border-gray-100"}`}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center text-3xl mb-3`}>
                        {level.icon}
                      </div>
                      <h3 className="font-bold text-secondary mb-1">{level.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">от {level.minPoints} баллов</p>
                      <div className="text-sm font-semibold text-primary mb-3">Кешбэк {level.cashback}</div>
                      <ul className="space-y-1.5">
                        {level.perks.map((perk) => (
                          <li key={perk} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-success shrink-0">✓</span>
                            {perk}
                          </li>
                        ))}
                      </ul>
                      {isActive && (
                        <div className="mt-3 px-3 py-1.5 bg-primary/10 rounded-lg text-xs font-semibold text-primary text-center">
                          Текущий уровень
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How to earn */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-secondary mb-4">{t("loyalty.earnTitle")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: "🛒", title: "Покупки", desc: "1 балл за каждые 10 AZN" },
                  { icon: "⭐", title: "Отзывы", desc: "10 баллов за отзыв с фото" },
                  { icon: "👥", title: "Рефералы", desc: "50 баллов за друга" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-secondary text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-secondary mb-6">{t("loyalty.historyTitle")}</h2>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    tx.type === "EARNED" ? "bg-green-100 text-green-600" :
                    tx.type === "SPENT" ? "bg-red-100 text-red-500" :
                    "bg-amber-100 text-amber-600"
                  }`}>
                    {tx.type === "EARNED" ? "💰" : tx.type === "SPENT" ? "🎁" : "🎉"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <span className={`font-bold text-sm ${tx.points > 0 ? "text-success" : "text-red-500"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-secondary mb-6">{t("loyalty.achievementsTab")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((ach) => (
                <div key={ach.title} className={`p-5 rounded-2xl border-2 transition-all ${ach.unlocked ? "border-success bg-success/5" : "border-gray-100 opacity-70"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{ach.icon}</span>
                    <div>
                      <h3 className="font-bold text-secondary text-sm">{ach.title}</h3>
                      {ach.unlocked && <span className="text-xs text-success font-medium">✓ Получено</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{ach.description}</p>
                  {ach.progress && (
                    <div className="text-xs text-primary font-medium">Прогресс: {ach.progress}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
