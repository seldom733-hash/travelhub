"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

interface BuilderItem {
  id: string;
  type: string;
  icon: string;
  name: string;
  price: number;
  selected: boolean;
}

const availableServices: BuilderItem[] = [
  { id: "tour-1", type: "tour", icon: "🏖", name: "Тур в Анталью (7 ночей)", price: 650, selected: false },
  { id: "hotel-1", type: "hotel", icon: "🏨", name: "Hilton Baku (3 ночи)", price: 540, selected: false },
  { id: "transfer-1", type: "transfer", icon: "🚐", name: "Трансфер Аэропорт — Отель", price: 45, selected: false },
  { id: "excursion-1", type: "excursion", icon: "🏛", name: "Экскурсия по Памуккале", price: 55, selected: false },
  { id: "guide-1", type: "guide", icon: "🧭", name: "Гид в Стамбуле (день)", price: 80, selected: false },
  { id: "photo-1", type: "photo", icon: "📷", name: "Фотосессия (2 часа)", price: 100, selected: false },
  { id: "insurance-1", type: "insurance", icon: "🛡", name: "Страховка путешественника", price: 30, selected: false },
  { id: "visa-1", type: "visa", icon: "📋", name: "Помощь с визой", price: 50, selected: false },
];

const steps = [
  { id: 1, label: "Выбор услуг", icon: "📦" },
  { id: 2, label: "Даты и гости", icon: "📅" },
  { id: 3, label: "Итого", icon: "💰" },
];

export default function BuilderPage() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [items, setItems] = useState<BuilderItem[]>(availableServices);
  const [travelDates, setTravelDates] = useState({ start: "", end: "" });
  const [guests, setGuests] = useState(2);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectedItems = items.filter((item) => item.selected);
  const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * guests, 0);

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("nav.builder") }]} />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">🧩 Конструктор путешествия</h1>
          <p className="text-gray-500">Соберите идеальную поездку из разных услуг</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => step.id <= currentStep + 1 && setCurrentStep(step.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep >= step.id ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > step.id ? "✓" : step.icon}
              </button>
              <span className={`text-sm hidden sm:inline ${currentStep >= step.id ? "text-secondary font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && <div className={`w-12 h-1 rounded ${currentStep > step.id ? "bg-primary" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">Выберите услуги</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        item.selected
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        item.selected ? "bg-primary/10" : "bg-gray-100"
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-secondary text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{item.price} AZN</div>
                        <div className="text-xs text-gray-400">за чел.</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        item.selected ? "border-primary bg-primary text-white" : "border-gray-300"
                      }`}>
                        {item.selected && "✓"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">Даты и количество туристов</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Дата выезда</label>
                    <input
                      type="date"
                      value={travelDates.start}
                      onChange={(e) => setTravelDates({ ...travelDates, start: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Дата возвращения</label>
                    <input
                      type="date"
                      value={travelDates.end}
                      onChange={(e) => setTravelDates({ ...travelDates, end: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-secondary mb-2">Количество туристов</label>
                    <div className="flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 max-w-xs">
                      <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold">−</button>
                      <span className="flex-1 text-center text-sm font-semibold text-secondary">{guests}</span>
                      <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">Ваше путешествие</h2>
                <div className="space-y-3 mb-6">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.price} AZN × {guests} чел.</p>
                      </div>
                      <span className="font-bold text-primary">{item.price * guests} AZN</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-4 flex justify-between">
                  <span className="font-bold text-secondary text-lg">Итого</span>
                  <span className="font-bold text-primary text-2xl">{totalPrice} AZN</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all">
                  ← Назад
                </button>
              )}
              <button
                onClick={() => {
                  if (currentStep < 3) setCurrentStep(currentStep + 1);
                }}
                className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
              >
                {currentStep === 3 ? "🛒 В корзину" : "Далее →"}
              </button>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-secondary mb-4">Корзина</h3>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Выберите услуги</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <span>{item.icon}</span>
                      <span className="flex-1 text-gray-600 truncate">{item.name}</span>
                      <span className="font-medium text-secondary">{item.price}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500 text-sm">Услуг: {selectedItems.length}</span>
                  <span className="text-gray-500 text-sm">Туристов: {guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-secondary">Итого</span>
                  <span className="font-bold text-primary text-xl">{totalPrice} AZN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
