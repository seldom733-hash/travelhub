"use client";

import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";



export default function CartPage() {
  const { t } = useI18n();
  const { items, isLoading, removeItem, updateQuantity, subtotal, serviceFee, total } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">{t("cart.title")}</h1>
          <p className="text-gray-500">{items.length} {items.length === 1 ? t("cart.service") : t("cart.services")} {t("cart.itemsCount").split("{count}")[1]?.split("{label}")[0] || "в корзине"}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-secondary mb-2">{t("cart.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("cart.emptyDesc")}</p>
            <a href="/" className="inline-flex h-12 px-8 bg-primary text-white rounded-2xl font-semibold items-center hover:bg-primary-dark transition-all">
              {t("cart.browseOffers")}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const typeIcons: Record<string, string> = { tour: "🏖", hotel: "🏨", excursion: "🏛", transfer: "🚐", guide: "🧭", photographer: "📷" };
                const typeColors: Record<string, string> = { tour: "bg-primary/10 text-primary", hotel: "bg-blue-100 text-blue-600", excursion: "bg-emerald-100 text-emerald-600", transfer: "bg-amber-100 text-amber-600", guide: "bg-violet-100 text-violet-600", photographer: "bg-pink-100 text-pink-600" };
                const typeInfo = { label: t(`cart.typeLabels.${item.type}` as string), icon: typeIcons[item.type] || "📦", color: typeColors[item.type] || "bg-gray-100 text-gray-600" };
                const itemTotal = item.pricePerPerson * item.guests * item.quantity;

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.icon} {typeInfo.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-secondary truncate">{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.country}, {item.city}</p>
                            <p className="text-sm text-gray-500">📅 {item.date}</p>
                          </div>
                          <button onClick={() => removeItem(item.serviceId)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                            ✕
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-50"
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold text-secondary w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                            <span className="text-xs text-gray-400 ml-2">× {item.guests} {t("cart.tourists")}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400">{item.pricePerPerson} AZN × {item.guests} × {item.quantity}</span>
                            <div className="text-lg font-bold text-primary">{itemTotal} AZN</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("cart.total")}</h2>

                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-500 truncate max-w-[200px]">{item.name}</span>
                      <span className="font-medium text-secondary">{item.pricePerPerson * item.guests * item.quantity} AZN</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("cart.subtotal")}</span>
                    <span className="font-medium text-secondary">{subtotal} AZN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t("cart.serviceFee")}</span>
                    <span className="font-medium text-secondary">{serviceFee} AZN</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-secondary text-lg">{t("cart.total")}</span>
                    <span className="font-bold text-primary text-2xl">{total} AZN</span>
                  </div>
                </div>

                <a
                  href="/checkout"
                  className="block w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg text-center transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] mt-6"
                >
                  {t("cart.checkout")}
                </a>

                <p className="text-center text-xs text-gray-400 mt-3">
                  {t("cart.securePayment")}
                </p>

                {/* Promo Code */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-secondary mb-2">{t("cart.promoCode")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t("cart.promoPlaceholder")}
                      className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-sm focus:border-primary outline-none"
                    />
                    <button className="h-10 px-4 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl text-sm font-medium transition-colors">
                      {t("cart.applyPromo")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
