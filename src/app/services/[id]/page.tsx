"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/components/Toast";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Breadcrumb from "@/components/Breadcrumb";
import ServiceJsonLd from "@/components/ServiceJsonLd";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  photos: string[];
  createdAt: string;
  user: { firstName: string; lastName: string; avatar: string | null };
  reply?: { text: string; createdAt: string } | null;
}

interface ServiceDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  type: string;
  price: number;
  currency: string;
  discountPrice: number | null;
  city: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  videoUrl: string | null;
  duration: string | null;
  maxGuests: number | null;
  languages: string[];
  isActive: boolean;
  isFeatured: boolean;
  isHot: boolean;
  hotDiscount: number | null;
  tourCategory: string | null;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    avatar: string | null;
    role: string;
  };
  amenities: { id: string; name: string; icon: string | null }[];
  flightDetails: { id: string; flightNumber: string | null; airline: string | null; departureCity: string; departureCode: string | null; departureTime: string; arrivalCity: string; arrivalCode: string | null; arrivalTime: string; returnFlight: boolean; sortOrder: number }[];
  tourHotels: { id: string; hotelName: string; hotelClass: number | null; roomType: string; mealPlan: string; description: string | null }[];
  transferDetails: { id: string; included: boolean; type: string; description: string | null; fromPlace: string | null; toPlace: string | null }[];
  reviews: Review[];
  _count: { reviews: number; bookings: number };
  schedules?: { date: string; available: boolean; slots: number }[];
}

const typeKeyMap: Record<string, string> = {
  TOUR: "nav.tours",
  HOTEL: "nav.hotels",
  SANATORIUM: "nav.sanatoriums",
  EXCURSION: "nav.excursions",
  GUIDE: "nav.guides",
  PHOTOGRAPHER: "nav.photographers",
  TRANSFER: "nav.transfers",
  FLIGHT: "nav.flights",
  TRAIN: "nav.trains",
};

const typeIcons: Record<string, string> = {
  TOUR: "🏖",
  HOTEL: "🏨",
  SANATORIUM: "🏥",
  EXCURSION: "🏛",
  GUIDE: "🧭",
  PHOTOGRAPHER: "📷",
  TRANSFER: "🚐",
  FLIGHT: "✈",
  TRAIN: "🚄",
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const getTypeLabel = (type: string) => {
    const key = typeKeyMap[type];
    return key ? t(key) : type;
  };

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "similar">("description");
  const [isFavorite, setIsFavorite] = useState(false);
  const [guests, setGuests] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(`/api/services/${id}`);
        if (!res.ok) throw new Error(t("serviceDetail.notFound"));
        const data = await res.json();
        setService(data.service);
        // Extract unavailable dates from schedule
        if (data.service.schedules) {
          const unavail = data.service.schedules
            .filter((s: { available: boolean }) => !s.available)
            .map((s: { date: string }) => s.date.split("T")[0]);
          setUnavailableDates(unavail);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("serviceDetail.loadingError"));
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id, t]);

  useEffect(() => {
    if (!isAuthenticated || !service) return;
    async function checkFavorite() {
      try {
        const res = await fetch("/api/favorites", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const found = data.favorites?.some((f: { serviceId: string }) => f.serviceId === service?.id);
          setIsFavorite(found);
        }
      } catch {
        // ignore
      }
    }
    checkFavorite();
  }, [isAuthenticated, service]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=" + encodeURIComponent(`/services/${id}`));
      return;
    }
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const url = isFavorite ? `/api/favorites/${service?.id}` : "/api/favorites";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...(method === "POST" ? { body: JSON.stringify({ serviceId: service?.id }) } : {}),
      });
      if (res.ok) setIsFavorite(!isFavorite);
    } catch {
      // ignore
    }
  };

  const handleAddToCart = () => {
    if (!service) return;
    addItem({
      serviceId: service.id,
      name: service.title,
      image: service.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
      city: service.city,
      country: service.country,
      date: checkIn || new Date().toISOString().split("T")[0],
      guests,
      pricePerPerson: service.discountPrice || service.price,
      quantity: 1,
      type: service.type,
    });
    router.push("/cart");
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=" + encodeURIComponent(`/services/${id}`));
      return;
    }
    if (!checkIn || !checkOut) {
      toast(t("filter.selectDates"), "info");
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: service?.id,
          checkIn,
          checkOut,
          guests,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("serviceDetail.bookingError"));
      }
      toast(t("filter.bookingCreated"), "success");
      router.push("/bookings");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("serviceDetail.bookingError"), "error");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=" + encodeURIComponent(`/services/${id}`));
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: service?.id,
          rating: reviewRating,
          title: reviewTitle,
          text: reviewText,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("serviceDetail.reviewError"));
      }
      toast(t("filter.reviewAdded"), "success");
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewText("");
      setReviewRating(5);
      // Reload service data
      const svcRes = await fetch(`/api/services/${id}`);
      if (svcRes.ok) {
        const svcData = await svcRes.json();
        setService(svcData.service);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : t("serviceDetail.reviewError"), "error");
    } finally {
      setReviewLoading(false);
    }
  };

  const getTodayStr = () => new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-32 bg-gray-200 rounded-2xl" />
              </div>
              <div className="h-80 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-secondary mb-2">{error || t("serviceDetail.notFound")}</h1>
          <a href="/" className="mt-4 inline-block h-12 px-8 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors">
            {t("serviceDetail.goHome")}
          </a>
        </div>
      </div>
    );
  }

  const price = service.discountPrice || service.price;
  const today = getTodayStr();

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* JSON-LD Structured Data */}
      <ServiceJsonLd
        id={service.id}
        title={service.title}
        description={service.description}
        type={service.type}
        price={service.price}
        currency={service.currency}
        discountPrice={service.discountPrice}
        city={service.city}
        country={service.country}
        images={service.images}
        rating={service.rating}
        reviewCount={service._count.reviews}
        reviews={service.reviews}
        provider={service.provider}
      />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: getTypeLabel(service.type), href: `/${service.type.toLowerCase()}s` },
            { label: service.title },
          ]}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden mb-4">
            <img
              src={service.images?.[selectedImage] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"}
              alt={service.title}
              loading="eager"
              fetchPriority="high"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-white/90 backdrop-blur-sm text-secondary text-sm font-bold px-4 py-2 rounded-full">
                {typeIcons[service.type]} {getTypeLabel(service.type)}
              </span>
              {service.isHot && service.hotDiscount && (
                <span className="bg-danger text-white text-sm font-bold px-4 py-2 rounded-full badge-pulse">
                  -{service.hotDiscount}%
                </span>
              )}
              {service.isFeatured && (
                <span className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-full">
                  {t('serviceDetail.recommended')}
                </span>
              )}
            </div>

            {/* Favorite & Share */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={toggleFavorite}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-lg ${
                  isFavorite
                    ? "bg-danger text-white"
                    : "bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-danger hover:text-white"
                }`}                        aria-label={isFavorite ? t("serviceDetail.removeFavorite") : t("serviceDetail.addFavorite")}
              >
                {isFavorite ? "❤️" : "🤍"}
              </button>
              <button
                className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xl text-gray-600 hover:bg-primary hover:text-white transition-all shadow-lg"
                aria-label={t("serviceDetail.share")}
              >
                📤
              </button>
            </div>

            {/* Rating overlay */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <span className="font-bold text-secondary text-lg">{service.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({service._count.reviews} {t("serviceDetail.reviewsCount")})</span>
            </div>
          </div>

          {/* Thumbnail strip */}
          {service.images && service.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {service.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? "border-primary ring-2 ring-primary/30" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt={`${service.title} ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Provider */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-secondary mb-2">{service.title}</h1>
                  <div className="flex items-center gap-4 text-gray-500">
                    <span>📍 {service.city}, {service.country}</span>
                    {service.duration && <span>⏱ {service.duration}</span>}
                    {service.maxGuests && <span>👥 {t("serviceDetail.upTo")} {service.maxGuests} {t("serviceDetail.persons")}</span>}
                  </div>
                </div>
              </div>

              {/* Provider card */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary overflow-hidden">
                  {service.provider.avatar ? (
                    <img src={service.provider.avatar} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    service.provider.firstName[0]
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary">{service.provider.firstName} {service.provider.lastName}</h3>
                  <p className="text-sm text-gray-500">{service.provider.role}</p>
                </div>
                <a href={`/chat?user=${service.provider.id}`} className="h-10 px-5 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary hover:text-white transition-all">
                  💬 {t('serviceDetail.writeMessage')}
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(["description", "reviews", "similar"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-secondary"
                    }`}
                  >
                    {tab === "description" && t('serviceDetail.description')}
                    {tab === "reviews" && `${t('serviceDetail.reviews')} (${service._count.reviews})`}
                    {tab === "similar" && t('serviceDetail.similar')}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "description" && (
                  <div className="prose max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">{service.description}</div>

                    {/* === MULTI-DAY TOUR: Flight, Hotel, Transfer === */}
                    {service.tourCategory === "MULTI_DAY" && (
                      <div className="mt-8 space-y-6">
                        <h3 className="text-xl font-bold text-secondary">🗺 {t("serviceDetail.tourProgram")}</h3>

                        {/* Flights */}
                        {service.flightDetails && service.flightDetails.length > 0 && (
                          <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h4 className="font-bold text-secondary mb-3">✈️ {t("serviceDetail.flights")}</h4>
                            <div className="space-y-3">
                              {service.flightDetails.map((f) => (
                                <div key={f.id} className={`flex items-center gap-4 p-3 rounded-xl ${f.returnFlight ? 'bg-blue-50' : 'bg-gray-50'}`}>                                      <span className="text-sm font-bold text-primary">{f.returnFlight ? (t('serviceDetail.returnFlight') || '✈️ Обратный') : (t('serviceDetail.outboundFlight') || '✈️ Туда')}</span>
                                  <div className="flex-1 grid grid-cols-3 items-center gap-2 text-sm">
                                    <div className="text-right">
                                      <div className="font-bold text-secondary">{f.departureCity}</div>
                                      <div className="text-xs text-gray-400">{f.departureCode} • {f.departureTime}</div>
                                    </div>
                                    <div className="flex items-center justify-center">
                                      <div className="h-px flex-1 bg-gray-300" />
                                      <span className="mx-2 text-gray-400">→</span>
                                      <div className="h-px flex-1 bg-gray-300" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-secondary">{f.arrivalCity}</div>
                                      <div className="text-xs text-gray-400">{f.arrivalCode} • {f.arrivalTime}</div>
                                    </div>
                                  </div>
                                  {f.airline && <span className="text-xs text-gray-500">{f.airline} {f.flightNumber}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hotel */}
                        {service.tourHotels && service.tourHotels.length > 0 && (
                          <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h4 className="font-bold text-secondary mb-3">🏨 {t("serviceDetail.accommodation")}</h4>
                            {service.tourHotels.map((h) => (
                              <div key={h.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl">🏨</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-secondary">{h.hotelName}</span>
                                    {h.hotelClass && <span className="text-yellow-500">{'★'.repeat(h.hotelClass)}</span>}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">{h.roomType} • {t("serviceDetail.mealPlan")}: {h.mealPlan}</div>
                                  {h.description && <p className="text-sm text-gray-600 mt-1">{h.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Transfer */}
                        {service.transferDetails && service.transferDetails.length > 0 && (
                          <div className="bg-white rounded-2xl border border-gray-100 p-5">
                            <h4 className="font-bold text-secondary mb-3">🚐 {t("serviceDetail.transfer")}</h4>
                            {service.transferDetails.map((tr) => (
                              <div key={tr.id} className={`flex items-center gap-3 p-3 rounded-xl ${tr.included ? 'bg-green-50' : 'bg-red-50'}`}>
                                <span className="text-xl">{tr.included ? '✅' : '❌'}</span>
                                <div>
                                  <span className="font-medium text-secondary">{tr.included ? t("serviceDetail.transferIncluded") : t("serviceDetail.transferNotIncluded")}</span>
                                  <span className="text-sm text-gray-500 ml-2">({tr.type}{tr.fromPlace ? ': ' + tr.fromPlace + ' → ' + tr.toPlace : ''})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amenities */}
                    {service.amenities.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold text-secondary mb-4">{t('serviceDetail.whatsIncluded')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {service.amenities.map((amenity) => (
                            <div key={amenity.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-accent">✓</span>
                              {amenity.icon && <span>{amenity.icon}</span>}
                              {amenity.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {service.languages.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold text-secondary mb-4">{t('serviceDetail.languages')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {service.languages.map((lang) => (
                            <span key={lang} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-secondary">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {service.latitude && service.longitude && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold text-secondary mb-4">{t('serviceDetail.location')}</h3>
                        <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                          <span>🗺 {t("serviceDetail.mapPlaceholder")} ({service.city}, {service.country})</span>
                        </div>
                      </div>
                    )}

                    {/* Availability Calendar */}
                    <div className="mt-8">
                      <AvailabilityCalendar
                        unavailableDates={unavailableDates}
                        minDate={new Date().toISOString().split("T")[0]}
                        onSelectDates={(start, end) => {
                          setCheckIn(start);
                          setCheckOut(end);
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-secondary">{t("serviceDetail.reviewsTab")} ({service._count.reviews})</h3>
                      {isAuthenticated && (
                        <button
                          onClick={() => setShowReviewForm(!showReviewForm)}
                          className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-all"
                        >
                          {t('serviceDetail.writeReview')}
                        </button>
                      )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-2xl">
                        <h4 className="font-semibold text-secondary mb-4">{t('serviceDetail.yourReview')}</h4>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">{t('serviceDetail.rating')}</label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className={`text-2xl transition-transform hover:scale-125 ${star <= reviewRating ? "text-star" : "text-gray-300"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">{t('serviceDetail.reviewTitle')}</label>
                          <input
                            type="text"
                            value={reviewTitle}
                            onChange={(e) => setReviewTitle(e.target.value)}
                            placeholder={t('serviceDetail.reviewTitlePlaceholder')}
                            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-white"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">{t('serviceDetail.reviewText')}</label>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder={t('serviceDetail.reviewTextPlaceholder')}
                            className="w-full h-32 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-white resize-none"
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" disabled={reviewLoading || !reviewText.trim()} className="h-11 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-50">
                            {reviewLoading ? t('serviceDetail.sending') : t('serviceDetail.send')}
                          </button>
                          <button type="button" onClick={() => setShowReviewForm(false)} className="h-11 px-6 bg-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-300 transition-all">
                            {t('serviceDetail.cancel')}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Reviews List */}
                    {service.reviews.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-3">💬</p>
                        <p>{t('serviceDetail.noReviews')}</p>
                        <p className="text-sm">{t('serviceDetail.beFirst')}</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {service.reviews.map((review) => (
                          <div key={review.id} className="p-5 bg-gray-50 rounded-2xl">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary shrink-0">
                                {review.user.firstName[0]}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-secondary">{review.user.firstName} {review.user.lastName}</h4>
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <span key={s} className={`text-sm ${s <= review.rating ? "text-star" : "text-gray-300"}`}>★</span>
                                        ))}
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {review.title && <h5 className="font-medium text-secondary mb-1">{review.title}</h5>}
                                <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

                                {/* Review Reply */}
                                {review.reply && (
                                  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-400 mb-1">{t('serviceDetail.sellerReply')}</p>
                                    <p className="text-sm text-gray-700">{review.reply.text}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "similar" && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-3">🔍</p>
                    <p>{t('serviceDetail.similarLoading')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
                {/* Price */}
                <div className="mb-6">
                  {service.discountPrice && (
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-400 line-through text-lg">{service.price} {service.currency}</span>
                      <span className="bg-danger/10 text-danger text-sm font-bold px-3 py-1 rounded-full">
                        -{Math.round((1 - service.discountPrice / service.price) * 100)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-secondary">{price}</span>
                    <span className="text-lg text-gray-500">{service.currency}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{t('serviceDetail.perPerson')}</p>
                </div>

                {/* Booking Form */}
                <div className="space-y-4 mb-6">
                  {/* Check-in */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.checkInDate')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                      <input
                        type="date"
                        value={checkIn}
                        min={today}
                        onChange={(e) => {
                          setCheckIn(e.target.value);
                          if (checkOut && e.target.value >= checkOut) setCheckOut("");
                        }}
                        className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Check-out */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.checkOutDate')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || today}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.guests')}</label>
                    <div className="flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                      <button
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-secondary">
                        {guests} {guests === 1 ? t('serviceDetail.guest') : t('serviceDetail.guestsPlural')}
                      </span>
                      <button
                        onClick={() => setGuests(Math.min(service.maxGuests || 20, guests + 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total */}
                {checkIn && checkOut && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">{price} × {guests} {t("serviceDetail.persons")}</span>
                      <span className="font-medium text-secondary">{(price * guests).toLocaleString()} {service.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">{t('serviceDetail.subtotal')}</span>
                      <span className="font-medium text-secondary">{Math.round(price * guests * 0.05).toLocaleString()} {service.currency}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-bold text-secondary">{t('serviceDetail.total')}</span>
                      <span className="font-bold text-primary text-lg">
                        {Math.round(price * guests * 1.05).toLocaleString()} {service.currency}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBookNow}
                    disabled={bookingLoading}
                    className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    {bookingLoading ? t('serviceDetail.bookingInProgress') : t('serviceDetail.bookNow')}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-12 bg-secondary/10 text-secondary rounded-2xl font-bold text-sm transition-all hover:bg-secondary/20"
                  >
                    {t('serviceDetail.addToCart')}
                  </button>
                </div>

                {/* Quick Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  {service.duration && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400">⏱</span>
                      <span className="text-gray-600">{t('serviceDetail.duration')}: {service.duration}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">🔒</span>
                    <span className="text-gray-600">{t('serviceDetail.freeCancel24')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">⚡</span>
                    <span className="text-gray-600">{t('serviceDetail.instantConfirm')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">💳</span>
                    <span className="text-gray-600">{t('serviceDetail.securePayment')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
