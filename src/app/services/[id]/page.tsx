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
import SimilarServicesInline from "@/components/SimilarServicesInline";

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

interface RoomTypeDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  maxAdults: number;
  maxChildren: number;
  basePrice: number;
  childPrice: number | null;
  currency: string;
  images: string;
  amenities: string;
  sortOrder: number;
  bedType: string | null;
  view: string | null;
  smoking: string | null;
  balcony: string | null;
  bathroom: string | null;
  area: string | null;
  occupancy: string | null;
  roomCount: number | null;
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

const VIEW_LABEL_MAP: Record<string, string> = {
  city: 'filter.hotel.viewCity',
  sea: 'filter.hotel.viewSea',
  sea_direct: 'filter.hotel.viewSeaDirect',
  sea_partial: 'filter.hotel.viewSeaPartial',
  pool: 'filter.hotel.viewPool',
  garden: 'filter.hotel.viewGarden',
  mountain: 'filter.hotel.viewMountain',
  lake: 'filter.hotel.viewLake',
  park: 'filter.hotel.viewPark',
  river: 'filter.hotel.viewRiver',
  no_view: 'filter.hotel.viewNoView',
  panoramic: 'filter.hotel.viewPanoramic',
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
  const [activeTab, setActiveTab] = useState<"description" | "rooms" | "reviews" | "similar">("description");
  const [isFavorite, setIsFavorite] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
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

  // Room types
  const [roomTypes, setRoomTypes] = useState<RoomTypeDetail[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [roomSort, setRoomSort] = useState<string>("");
  const sortedRoomTypes = [...roomTypes].sort((a, b) => {
    switch (roomSort) {
      case 'price_asc': return Number(a.basePrice) - Number(b.basePrice);
      case 'price_desc': return Number(b.basePrice) - Number(a.basePrice);
      case 'capacity_asc': return (a.maxAdults + a.maxChildren) - (b.maxAdults + b.maxChildren);
      case 'capacity_desc': return (b.maxAdults + b.maxChildren) - (a.maxAdults + a.maxChildren);
      case 'capacity_asc': return (a.maxAdults + a.maxChildren) - (b.maxAdults + b.maxChildren);
      case 'rooms_desc': return (b.roomCount || 0) - (a.roomCount || 0);
      default: return a.sortOrder - b.sortOrder;
    }
  });
  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };
  const comparedRooms = roomTypes.filter(rt => compareIds.includes(rt.id));

  const selectedRoom = roomTypes.find(r => r.id === selectedRoomId);
  const effectivePrice = selectedRoom ? Number(selectedRoom.basePrice) : (service?.discountPrice || service?.price || 0);
  const childNightlyPrice = selectedRoom?.childPrice != null ? Number(selectedRoom.childPrice) : 0;
  const adultsExceeded = selectedRoom ? adults > selectedRoom.maxAdults : false;
  const childrenExceeded = selectedRoom ? children > selectedRoom.maxChildren : false;
  const capacityExceeded = adultsExceeded || childrenExceeded;

  // Auto-clamp adults/children when room type changes
  useEffect(() => {
    if (selectedRoom) {
      setAdults(a => Math.min(a, selectedRoom.maxAdults));
      setChildren(c => Math.min(c, selectedRoom.maxChildren));
    }
  }, [selectedRoomId, selectedRoom]);

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
        // Fetch room types for HOTEL/SANATORIUM
        if (data.service.type === "HOTEL" || data.service.type === "SANATORIUM") {
          try {
            const rtRes = await fetch(`/api/services/${id}/room-types`);
            if (rtRes.ok) {
              const rtData = await rtRes.json();
              setRoomTypes(rtData.roomTypes || []);
            }
          } catch { /* ignore */ }
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
    if (!service) return;      addItem({
      serviceId: service.id,
      name: selectedRoom ? `${service.title} — ${selectedRoom.name}` : service.title,
      image: service.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
      city: service.city,
      country: service.country,
      date: checkIn || new Date().toISOString().split("T")[0],
      guests: adults + children,
      pricePerPerson: effectivePrice,
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
    if (!checkIn || (service?.tourCategory !== "ONE_DAY" && !checkOut)) {
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
          guests: adults + children,
          adults,
          children,
          roomTypeId: selectedRoomId || undefined,
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

  const today = getTodayStr();
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;

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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">              <div className="flex border-b border-gray-100">
                {(["description", ...(service.type === "HOTEL" || service.type === "SANATORIUM" ? ["rooms"] : []), "reviews", "similar"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-secondary"
                    }`}>
                    {tab === "description" && t('serviceDetail.description')}
                    {tab === "rooms" && `${t('serviceDetail.roomTypes')} (${roomTypes.length})`}
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

                {activeTab === "rooms" && (
                  <div>
                    {roomTypes.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-4xl mb-3">🛏</p>
                        <p>{t('serviceDetail.noRoomTypes')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">{t('serviceDetail.roomTypesDesc')}</p>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">↕</span>
                            <select
                              value={roomSort}
                              onChange={(e) => setRoomSort(e.target.value)}
                              className="h-9 pl-8 pr-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white appearance-none cursor-pointer focus:border-primary focus:ring-0 outline-none"
                            >
                              <option value="">{t('serviceDetail.sortDefault')}</option>
                              <option value="price_asc">{t('serviceDetail.priceLowHigh')}</option>
                              <option value="price_desc">{t('serviceDetail.priceHighLow')}</option>
                              <option value="capacity_asc">{t('serviceDetail.capacityLowHigh')}</option>
                              <option value="capacity_desc">{t('serviceDetail.capacityHighLow')}</option>
                              <option value="rooms_desc">{t('serviceDetail.mostAvailable')}</option>
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[10px]">▼</span>
                          </div>
                        </div>
                        {sortedRoomTypes.map((rt) => {
                          const rtImages = rt.images ? rt.images.split(',').filter(Boolean) : [];
                          const rtAmenities = rt.amenities ? rt.amenities.split(',').filter(Boolean) : [];
                          return (
                            <div key={rt.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                              <div className="flex flex-col md:flex-row">
                                {/* Room Image */}
                                <div className="md:w-64 h-48 md:h-auto shrink-0 relative">
                                  <img
                                    src={rtImages[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80'}
                                    alt={rt.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                  {rtImages.length > 1 && (
                                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                      📷 {rtImages.length}
                                    </span>
                                  )}
                                </div>

                                {/* Room Info */}
                                <div className="flex-1 p-5">
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                      <h4 className="text-lg font-bold text-secondary">{rt.name}</h4>
                                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                                          👥 {rt.maxAdults} {rt.maxAdults === 1 ? t('serviceDetail.person') : t('serviceDetail.persons')}{rt.maxChildren > 0 ? ` + ${rt.maxChildren} ${rt.maxChildren === 1 ? t('serviceDetail.child') : t('serviceDetail.children')}` : ''}
                                        </span>
                                        {rt.roomCount && rt.roomCount > 0 && (
                                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${rt.roomCount <= 3 ? 'bg-red-50 text-red-700 border-red-200' : rt.roomCount <= 7 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            🏠 {rt.roomCount} {t('serviceDetail.roomsLeft')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-2xl font-bold text-primary">{Number(rt.basePrice)}</div>
                                      <div className="text-sm text-gray-400">{rt.currency} / {t('common.perNight')}</div>
                                      <button
                                        onClick={() => toggleCompare(rt.id)}
                                        disabled={!compareIds.includes(rt.id) && compareIds.length >= 3}
                                        className={`mt-2 text-xs font-medium px-3 py-1 rounded-full border transition-all ${
                                          compareIds.includes(rt.id)
                                            ? 'bg-primary text-white border-primary'
                                            : compareIds.length >= 3
                                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                        }`}
                                      >
                                        {compareIds.includes(rt.id) ? '✓ ' : '⚖ '}{t('serviceDetail.compare')}
                                      </button>
                                    </div>
                                  </div>

                                  {rt.description && (
                                    <p className="text-sm text-gray-600 mb-3">{rt.description}</p>
                                  )}

                                  {/* Room Attributes */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {rt.bedType && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                        🛏 {t(`filter.hotel.${rt.bedType}`)}
                                      </span>
                                    )}
                                    {rt.view && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                        🌅 {t(VIEW_LABEL_MAP[rt.view] || `filter.hotel.view${rt.view}`)}
                                      </span>
                                    )}
                                    {rt.balcony && rt.balcony !== 'no_balcony' && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                                        🏠 {t(`filter.hotel.${rt.balcony === 'balcony' ? 'balconyOption' : rt.balcony}`)}
                                      </span>
                                    )}
                                    {rt.bathroom && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-medium">
                                        🚿 {t(`filter.hotel.${rt.bathroom}`)}
                                      </span>
                                    )}
                                    {rt.area && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                        📐 {t(`filter.hotel.${rt.area}`)}
                                      </span>
                                    )}
                                    {rt.smoking && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                        {rt.smoking === 'non_smoking' ? '🚭' : '🚬'} {t(rt.smoking === 'non_smoking' ? 'filter.hotel.nonSmoking' : 'filter.hotel.smokingOption')}
                                      </span>
                                    )}
                                    {rt.occupancy && (
                                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-200">
                                        🛌 {t(`filter.hotel.${rt.occupancy}`)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Room Amenities */}
                                  {rtAmenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {rtAmenities.map((amenity) => (
                                        <span key={amenity} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">
                                          {amenity}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

                {activeTab === "similar" && service && (
                  <SimilarServicesInline
                    serviceId={service.id}
                    serviceType={service.type}
                    city={service.city}
                    country={service.country}
                  />
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
                  {!selectedRoom && service.discountPrice && (
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-400 line-through text-lg">{service.price} {service.currency}</span>
                      <span className="bg-danger/10 text-danger text-sm font-bold px-3 py-1 rounded-full">
                        -{Math.round((1 - service.discountPrice / service.price) * 100)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-secondary">{effectivePrice}</span>
                    <span className="text-lg text-gray-500">{service.currency}</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedRoom
                      ? `${t('common.perNight')} · ${selectedRoom.name}`
                      : t('serviceDetail.perPerson')}
                  </p>
                </div>

                {/* Booking Form */}
                <div className="space-y-4 mb-6">
                  {/* Room Type (only for HOTEL/SANATORIUM) */}
                  {(service.type === "HOTEL" || service.type === "SANATORIUM") && roomTypes.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.selectRoomType')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🛏</span>
                        <select
                          value={selectedRoomId}
                          onChange={(e) => setSelectedRoomId(e.target.value)}
                          className="w-full h-12 pl-10 pr-8 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-gray-50 appearance-none cursor-pointer"
                        >
                          <option value="">{t('serviceDetail.defaultRoom')}</option>
                          {roomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name} — {Number(rt.basePrice)} {rt.currency}/{t('common.perNight')}{rt.maxAdults > 0 ? ` (max ${rt.maxAdults}${rt.maxChildren > 0 ? ` + ${rt.maxChildren}` : ''})` : ''}{rt.childPrice != null ? rt.childPrice > 0 ? ` + ${Number(rt.childPrice)} ${rt.currency}/${t('serviceDetail.perChildPerNight')}` : ` · ${t('serviceDetail.freeForChildren')}` : ''}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
                      </div>
                    </div>
                  )}
                  {/* Date picker: single for one-day tours, check-in/check-out for multi-day/hotels */}
                  {service.type === "TOUR" && service.tourCategory === "ONE_DAY" ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.tourDate')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                        <input
                          type="date"
                          value={checkIn}
                          min={today}
                          onChange={(e) => {
                            setCheckIn(e.target.value);
                            setCheckOut(e.target.value);
                          }}
                          className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{t('serviceDetail.tourDateHint')}</p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}

                  {/* Adults */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.adults')}</label>
                    <div className={`flex items-center gap-3 h-12 px-4 rounded-xl border-2 bg-gray-50 ${adultsExceeded ? 'border-danger' : 'border-gray-200'}`}>
                      <button
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-secondary">
                        {adults} {adults === 1 ? t('serviceDetail.adult') : t('serviceDetail.adultsPlural')}
                      </span>
                      <button
                        onClick={() => setAdults(Math.min(
                          selectedRoom ? selectedRoom.maxAdults : (service.maxGuests || 20),
                          adults + 1
                        ))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('serviceDetail.children')}</label>
                    <div className={`flex items-center gap-3 h-12 px-4 rounded-xl border-2 bg-gray-50 ${childrenExceeded ? 'border-danger' : 'border-gray-200'}`}>
                      <button
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-secondary">
                        {children} {children === 1 ? t('serviceDetail.child') : t('serviceDetail.childrenPlural')}
                      </span>
                      <button
                        onClick={() => setChildren(Math.min(
                          selectedRoom ? selectedRoom.maxChildren : 10,
                          children + 1
                        ))}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                    {/* Capacity warning */}
                    {selectedRoom && capacityExceeded && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-danger/10 rounded-lg">
                        <span className="text-danger text-sm">⚠️</span>
                        <span className="text-xs text-danger font-medium">
                          {t('serviceDetail.capacityExceeded').replace('{maxAdults}', String(selectedRoom.maxAdults)).replace('{maxChildren}', String(selectedRoom.maxChildren))}
                        </span>
                      </div>
                    )}
                    {/* Capacity hint when room selected */}
                    {selectedRoom && !capacityExceeded && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                        <span className="text-green-600 text-sm">✓</span>
                        <span className="text-xs text-green-600">
                          {t('serviceDetail.capacityHint').replace('{maxAdults}', String(selectedRoom.maxAdults)).replace('{maxChildren}', String(selectedRoom.maxChildren))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                {checkIn && (service.tourCategory === "ONE_DAY" || checkOut) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    {selectedRoom ? (
                      <>
                        {adults > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {adults} × {effectivePrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(adults * effectivePrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                        {children > 0 && childNightlyPrice > 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} × {childNightlyPrice} {service.currency} × {nights} {nights === 1 ? t('serviceDetail.night') : t('serviceDetail.nights')}
                            </span>
                            <span className="font-medium text-secondary">{(children * childNightlyPrice * nights).toLocaleString()} {service.currency}</span>
                          </div>
                        )}
                        {children > 0 && childNightlyPrice === 0 && (
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">
                              {children} {children === 1 ? t('serviceDetail.child') : t('serviceDetail.childrenPlural')}
                            </span>
                            <span className="text-green-600 font-medium">✓ {t('serviceDetail.freeForChildren')}</span>
                          </div>
                        )}
                      </>
                    ) : (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">{effectivePrice} × {adults + children} {t("serviceDetail.persons")}</span>
                      <span className="font-medium text-secondary">{(effectivePrice * (adults + children)).toLocaleString()} {service.currency}</span>
                    </div>
                    )}
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">{t('serviceDetail.subtotal')}</span>
                      <span className="font-medium text-secondary">{Math.round(selectedRoom ? ((adults * effectivePrice) + (children * childNightlyPrice)) * nights * 0.05 : effectivePrice * (adults + children) * 0.05).toLocaleString()} {service.currency}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between">
                      <span className="font-bold text-secondary">{t('serviceDetail.total')}</span>
                      <span className="font-bold text-primary text-lg">
                        {Math.round(selectedRoom ? ((adults * effectivePrice) + (children * childNightlyPrice)) * nights * 1.05 : effectivePrice * (adults + children) * 1.05).toLocaleString()} {service.currency}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBookNow}
                    disabled={bookingLoading || capacityExceeded}
                    className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    {bookingLoading ? t('serviceDetail.bookingInProgress') : t('serviceDetail.bookNow')}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={capacityExceeded}
                    className="w-full h-12 bg-secondary/10 text-secondary rounded-2xl font-bold text-sm transition-all hover:bg-secondary/20 disabled:opacity-50"
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

      {/* Floating Comparison Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-secondary">⚖ {compareIds.length}/3</span>
              <div className="flex gap-2">
                {comparedRooms.map(rt => (
                  <span key={rt.id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {rt.name}
                    <button onClick={() => toggleCompare(rt.id)} className="ml-1 text-primary/60 hover:text-primary">✕</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="h-10 px-4 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {t('serviceDetail.clear')}
              </button>
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={compareIds.length < 2}
                className="h-10 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('serviceDetail.compareNow')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCompareModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-secondary">⚖ {t('serviceDetail.roomComparison')}</h2>
              <button onClick={() => setShowCompareModal(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-semibold text-gray-500 pb-4 pr-4 min-w-[140px]">{t('serviceDetail.feature')}</th>
                    {comparedRooms.map(rt => (
                      <th key={rt.id} className="text-center pb-4 px-4 min-w-[180px]">
                        <div className="font-bold text-secondary text-base mb-1">{rt.name}</div>
                        <div className="text-2xl font-bold text-primary">{Number(rt.basePrice)} {rt.currency}</div>
                        <div className="text-xs text-gray-400">/{t('common.perNight')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {/* Price */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">💰 {t('serviceDetail.basePrice')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center font-bold text-primary">{Number(rt.basePrice)} {rt.currency}</td>
                    ))}
                  </tr>
                  {/* Child Price */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">👶 {t('serviceDetail.childPrice')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">
                        {rt.childPrice != null ? (rt.childPrice > 0 ? <span className="font-semibold text-secondary">{Number(rt.childPrice)} {rt.currency}</span> : <span className="text-green-600 font-medium">✓ {t('serviceDetail.freeForChildren')}</span>) : '—'}
                      </td>
                    ))}
                  </tr>
                  {/* Capacity */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">👥 {t('serviceDetail.capacity')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.maxAdults} {rt.maxAdults === 1 ? t('serviceDetail.person') : t('serviceDetail.persons')}{rt.maxChildren > 0 ? ` + ${rt.maxChildren} ${rt.maxChildren === 1 ? t('serviceDetail.child') : t('serviceDetail.children')}` : ''}</td>
                    ))}
                  </tr>
                  {/* Bed Type */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🛏 {t('filter.hotel.bedType')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.bedType ? t(`filter.hotel.${rt.bedType}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* View */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🌅 {t('filter.hotel.view')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.view ? t(VIEW_LABEL_MAP[rt.view] || `filter.hotel.view${rt.view}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* Balcony */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🏠 {t('filter.hotel.balcony')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.balcony && rt.balcony !== 'no_balcony' ? t(`filter.hotel.${rt.balcony === 'balcony' ? 'balconyOption' : rt.balcony}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* Bathroom */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🚿 {t('filter.hotel.bathroom')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.bathroom ? t(`filter.hotel.${rt.bathroom}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* Area */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">📐 {t('filter.hotel.area')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.area ? t(`filter.hotel.${rt.area}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* Occupancy */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🛌 {t('filter.hotel.occupancy')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.occupancy ? t(`filter.hotel.${rt.occupancy}`) : '—'}</td>
                    ))}
                  </tr>
                  {/* Smoking */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🚭 {t('filter.hotel.smoking')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center">{rt.smoking ? t(rt.smoking === 'non_smoking' ? 'filter.hotel.nonSmoking' : 'filter.hotel.smokingOption') : '—'}</td>
                    ))}
                  </tr>
                  {/* Room Count */}
                  <tr className="border-t border-gray-100">
                    <td className="py-3 pr-4 text-gray-500 font-medium">🏠 {t('serviceDetail.roomsLeft')}</td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-3 px-4 text-center font-semibold">{rt.roomCount || '—'}</td>
                    ))}
                  </tr>
                  {/* Amenities */}
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="py-3 pr-4 text-gray-500 font-medium">✨ {t('filter.hotel.amenities')}</td>
                    {comparedRooms.map(rt => {
                      const amenities = rt.amenities ? rt.amenities.split(',').filter(Boolean) : [];
                      return (
                        <td key={rt.id} className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {amenities.length > 0 ? amenities.map(a => (
                              <span key={a} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{a}</span>
                            )) : <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Select Button */}
                  <tr className="border-t border-gray-200">
                    <td className="py-4"></td>
                    {comparedRooms.map(rt => (
                      <td key={rt.id} className="py-4 px-4 text-center">
                        <button
                          onClick={() => { setSelectedRoomId(rt.id); setShowCompareModal(false); }}
                          className="h-10 px-6 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all"
                        >
                          {t('serviceDetail.selectRoom')}
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
