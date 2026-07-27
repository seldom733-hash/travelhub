# TravelHub — Project Schema

## Overview
TravelHub is a **tourist marketplace platform** built with **Next.js 16 + Prisma 7 + PostgreSQL + Tailwind CSS 4**.
It aggregates tours, hotels, sanatoriums, excursions, guides, photographers, transfers, flights, and trains into one platform.

## Tech Stack
- **Framework:** Next.js 16.2.11 (App Router)
- **Database:** PostgreSQL via Prisma ORM 7.9 (with `@prisma/adapter-pg` driver adapter)
- **Auth:** JWT (jose) + bcryptjs, httpOnly cookies
- **Styling:** Tailwind CSS 4, custom CSS variables
- **Language:** TypeScript 5
- **State:** React Context (auth, cart)
- **Fonts:** Geist Sans + Geist Mono

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (Header + Footer + AuthProvider + CartProvider)
│   ├── page.tsx            # Homepage (12 sections)
│   ├── globals.css         # Tailwind config + custom animations
│   ├── auth/               # Login, Register, Forgot password
│   ├── api/                # API routes
│   │   ├── auth/           # login, register, me, logout
│   │   ├── services/       # CRUD + featured + locations
│   │   ├── bookings/       # CRUD
│   │   ├── favorites/      # CRUD + check
│   │   ├── reviews/        # CRUD + reply
│   │   ├── notifications/  # CRUD + read-all
│   │   ├── blog/           # CRUD
│   │   ├── admin/          # Admin stats + service moderation
│   │   ├── user/           # Profile + password
│   │   ├── guides/         # Guide detail
│   │   └── photographers/  # Photographer detail
│   ├── tours/              # Catalog page (FilterSidebar + ServiceCard + pagination)
│   ├── hotels/             # Catalog page (same pattern as tours)
│   ├── services/[id]/      # Service detail (gallery, booking, reviews, favorites)
│   ├── dashboard/          # User dashboard (bookings, stats)
│   ├── settings/           # Profile, password, notifications, language
│   ├── favorites/          # Saved services
│   ├── bookings/           # Booking list
│   ├── notifications/      # Notification center
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Payment flow
│   ├── chat/               # Messenger (demo)
│   ├── builder/            # Trip constructor
│   ├── map/                # Interactive map (placeholder)
│   ├── blog/               # Blog listing
│   ├── admin/              # Admin panel
│   ├── partner/            # Partner dashboard
│   ├── excursions/         # Placeholder
│   ├── sanatoriums/        # Placeholder
│   ├── flights/            # Placeholder
│   ├── trains/             # Placeholder
│   ├── transfers/          # Placeholder
│   ├── guides/             # Placeholder + [id] detail
│   ├── photographers/      # Placeholder + [id] detail
│   ├── reviews/            # Placeholder
│   ├── loyalty/            # Placeholder
│   ├── business/           # Placeholder
│   ├── faq/                # Placeholder
│   ├── privacy/            # Placeholder
│   ├── terms/              # Placeholder
│   └── returns/            # Placeholder
├── components/             # Reusable UI components
│   ├── Header.tsx          # Sticky header + mega menu + mobile menu
│   ├── Footer.tsx          # 5-column footer
│   ├── Hero.tsx            # Hero banner
│   ├── Search.tsx          # Universal search
│   ├── Categories.tsx      # Category cards with live stats
│   ├── PopularDestinations.tsx
│   ├── HotTours.tsx        # Countdown timer + discount cards
│   ├── Excursions.tsx      # Excursion cards
│   ├── Hotels.tsx          # Hotels + Sanatoriums sections
│   ├── Flights.tsx         # Flight cards with route visualization
│   ├── Guides.tsx          # Guide cards
│   ├── Photographers.tsx   # Photographer cards
│   ├── WhyTravelHub.tsx    # Stats + trust badges
│   ├── ForPartners.tsx     # CTA for partners
│   ├── FilterSidebar.tsx   # Reusable filter panel
│   └── ServiceCard.tsx     # Reusable service card
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # JWT + password helpers
│   ├── auth-context.tsx    # Auth React Context
│   ├── cart-context.tsx    # Cart React Context (localStorage)
│   └── rate-limit.ts       # In-memory rate limiter
└── middleware.ts           # Route protection (JWT verification)
```

## Database Schema (Prisma)
**Key models:** User, Service, Booking, Payment, Cancellation, Review, ReviewReply, Conversation, Message, Collection, Favorite, Notification, Achievement, UserAchievement, PromoCode, LoyaltyTransaction, BlogPost, ServiceAmenity, ServiceSchedule

**Enums:** UserRole (BUYER/PARTNER/MODERATOR/ADMIN), PartnerType, UserLevel, ServiceType, BookingStatus, PaymentMethod, PaymentStatus, MessageType, NotificationType, LoyaltyType, PromoType

## Design System
- **Colors:** primary=#ff6b35 (orange), secondary=#1a1a2e (dark), accent=#00c9a7 (teal), star=#ffc107, danger=#ff4757, success=#2ed573
- **Border radius:** rounded-xl (12px), rounded-2xl (16px), rounded-3xl (24px)
- **Animations:** fadeInUp, fadeIn, slideInLeft, pulse-gentle, card-hover (translateY + shadow)
- **Glass effect:** backdrop-blur + semi-transparent bg

## Authentication Flow
1. Register → bcrypt hash → create user → JWT token → httpOnly cookie
2. Login → verify password → JWT token → httpOnly cookie
3. Middleware checks JWT on protected routes (/dashboard, /partner, /admin, /chat, /favorites, /notifications, /loyalty, /bookings)
4. AuthContext polls `/api/auth/me` on mount to restore session

## Seed Data
- Admin: admin@travelhub.az / password123
- Partner: hilton@partner.az / password123
- Buyer: ahmed@example.com / password123
- 9 services (3 hotels, 2 tours, 1 guide, 2 photographers, 1 transfer)
- 3 bookings, 3 reviews, 3 blog posts, favorites, notifications, achievements

## What's Implemented vs Remaining

### ✅ Implemented
- Homepage (all 12 sections fully built)
- Auth (login, register, JWT, middleware, context)
- Cart (localStorage-based, add/remove/quantity/clear)
- Service catalogs: tours, hotels, excursions, sanatoriums, flights, trains, transfers (all with FilterSidebar + pagination)
- Detail pages: services/[id], guides/[id], photographers/[id]
- Bookings list page (status tabs, booking cards)
- Reviews page (user's review list)
- Loyalty page (real API data: points, levels, achievements, transactions)
- Business page (corporate travel features)
- Dashboard (user stats, recent bookings)
- Settings (profile edit, password change)
- Favorites page (with remove)
- Notifications page (with channel settings)
- Chat page (real API: conversations, messages, send)
- Cart page + Checkout flow (demo)
- Blog (listing + detail with API)
- Trip Builder (3-step wizard)
- Map page (real Leaflet interactive map with markers)
- Admin panel (stats, moderation, users)
- Partner dashboard (stats, orders, analytics placeholder)
- Search with debounced autocomplete (/api/search)
- All API routes (auth, services, bookings, favorites, reviews, notifications, blog, admin, user, chat/conversations, chat/messages, search, loyalty, services/locations, user/level)
- InteractiveMap component (Leaflet, dynamic import, custom markers)
- FilterSidebar + ServiceCard reusable components
- PROJECT_SCHEMA.md

### 🔲 Remaining (Next Steps)
1. **i18n:** multi-language (RU/AZ/EN)
2. **Payment integration:** Stripe/similar
3. **Social features:** user profiles, collections, follows
4. **Admin features:** banners, promos, analytics
5. **Partner features:** service creation wizard, calendar, analytics
6. **Real-time chat:** WebSocket upgrade from polling
7. **Flight search component** (from/to/date with airline results)
