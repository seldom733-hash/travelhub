"use client";

import { memo } from "react";
import { useI18n } from "@/lib/i18n-context";

export interface Service {
  id: string | number;
  name: string;
  image: string;
  city: string;
  country: string;
  flag: string;
  price: number;
  priceUnit: string;
  rating: number;
  reviews: number;
  tags?: string[];
  amenities?: string[];
  type?: string;
  providerName?: string;
}

const typeToRoute: Record<string, string> = {
  TOUR: "tours",
  HOTEL: "hotels",
  SANATORIUM: "sanatoriums",
  EXCURSION: "excursions",
  GUIDE: "guides",
  PHOTOGRAPHER: "photographers",
  TRANSFER: "transfers",
  FLIGHT: "flights",
  TRAIN: "trains",
};

function ServiceCardInner({ service }: { service: Service }) {
  const { t } = useI18n();
  const route = service.type ? typeToRoute[service.type] || "services" : "services";

  return (
    <a
      href={`/${route}/${service.id}`}
      className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1">
            {service.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-white/90 backdrop-blur-sm text-secondary text-xs font-medium px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Country Flag */}
        <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-sm text-white">
          {service.flag} {service.country}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {service.name}
        </h3>
        <p className="text-sm text-gray-500 mb-1">📍 {service.city}</p>
        {service.providerName && (
          <p className="text-xs text-gray-400 mb-2">🏢 {service.providerName}</p>
        )}

        {/* Amenities */}
        {service.amenities && service.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {service.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-xs ${i < Math.floor(service.rating) ? "text-star" : "text-gray-300"}`}>
              ★
            </span>
          ))}
          <span className="text-xs font-semibold text-secondary">{service.rating}</span>
          <span className="text-xs text-gray-400">({service.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <span className="text-xl font-bold text-primary">{service.price} AZN</span>
            <span className="text-xs text-gray-400 ml-1">{service.priceUnit}</span>
          </div>
          <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">
            {t("serviceCard.moreDetails")}
          </span>
        </div>
      </div>
    </a>
  );
}

const ServiceCard = memo(ServiceCardInner);
export default ServiceCard;
