"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Link from 'next/link';

type CarouselItem = {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: string;
  image: string;
  petType: string;
  badge?: string;
  href: string;
};

const fallbackCarouselItems: CarouselItem[] = [
  // Add your fallback items here if not already defined elsewhere
  // For now, using placeholder — replace with your real fallback if needed
];

export default function CaregiverCarousel({ items }: { items: CarouselItem[] }) {
  const displayItems = items.length > 0 ? items : fallbackCarouselItems;

  return (
    <section className="section-space bg-white">
      <div className="page-container">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="section-kicker">Trusted local pet care</div>
            <h2 className="mt-4">Meet local gurus pet owners can feel good about</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse real pet care gurus from SitGuru in a warm, modern, easy-to-scan layout.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Swiper
            modules={[Autoplay]}
            loop={true}
            autoplay={{
              delay: 5000,                    // Slow 5-second rotation (React.dev style)
              disableOnInteraction: false,
              pauseOnMouseEnter: true,        // Pause when hovering
            }}
            speed={900}
            spaceBetween={24}
            slidesPerView={1}
            centeredSlides={true}
            breakpoints={{
              640: { slidesPerView: 1.2 },
              1024: { slidesPerView: 2.2 },
              1280: { slidesPerView: 3.2 },
            }}
            className="mySwiper"
          >
            {displayItems.map((item) => (
              <SwiperSlide key={item.id}>
                <Link href={item.href} className="block group">
                  <article className="panel overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                    <div className="relative h-72 overflow-hidden rounded-t-3xl">
                      <img
                        src={item.image}
                        alt={`${item.name} with pets`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute left-4 top-4 flex gap-2">
                        {item.badge && <span className="chip">{item.badge}</span>}
                        <span className="badge">⭐ {item.rating}</span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-emerald-700">{item.role}</p>
                        </div>
                        <span className="badge">{item.petType}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{item.location}</p>

                      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <span className="btn-primary w-full sm:w-auto text-center">View profile & book</span>
                        <span className="btn-secondary w-full sm:w-auto text-center">Browse all</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}