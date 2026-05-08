"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BannerSlide = {
  src: string;
  alt: string;
};

type GSTBannerCarouselProps = {
  slides: BannerSlide[];
  className?: string;
  heightClassName?: string;
};

export default function GSTBannerCarousel({
  slides,
  className = "",
  heightClassName = "h-[360px] lg:h-[420px]",
}: GSTBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goPrevious = () => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  return (
    <div className={`relative overflow-hidden bg-[#eef6fb] ${heightClassName} ${className}`}>
      <div
        className="flex h-full w-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.src} className="flex h-full w-full shrink-0 items-center justify-center px-4 py-2">
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-full w-full object-contain object-left"
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/65 p-1.5 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/65 p-1.5 text-slate-700 shadow-sm backdrop-blur hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/45 px-3 py-1.5 backdrop-blur-sm">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === activeIndex ? "w-6 bg-blue-600" : "w-2.5 bg-slate-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
