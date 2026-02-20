"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HeroData = {
  smallText: string;
  mainHeading: {
    part1: string;
    part2: string;
    part3: string;
    part4: string;
    part5: string;
  };
  description: string;
  buttonText: string;
  videoUrl: string;
  videoFile: string | null;
  poster?: string;
  colors: {
    smallText: string;
    part1: string;
    part2: string;
    part3: string;
    part4: string;
    part5: string;
    description: string;
    button: string;
  };
};

const defaultHeroData: HeroData = {
  smallText: "# Best Online Platform",
  mainHeading: {
    part1: "Start Learning",
    part2: "Today",
    part3: "Discover",
    part4: "Your Next",
    part5: "Great Skill",
  },
  description:
    "Enhance your educational journey with our cutting-edge course platform.",
  buttonText: "Get Started »",
  videoUrl: "/videos/homehero.mp4",
  videoFile: null,
  poster: "/images/video-poster.jpg",
  colors: {
    smallText: "text-green-400",
    part1: "text-white",
    part2: "text-green-400",
    part3: "text-green-400",
    part4: "text-white",
    part5: "text-blue-300",
    description: "text-white/90",
    button: "bg-green-500 hover:bg-green-600",
  },
};

export default function HeroSection() {
  const router = useRouter();
  const [heroData, setHeroData] = useState<HeroData>(defaultHeroData);
  const [enableVideo, setEnableVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
        const response = await fetch(`${API_BASE}/hero`, {
          next: { revalidate: 300 },
        });

        if (!response.ok) return;

        const data = await response.json();
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE?.replace("/api", "") ||
          "http://localhost:8080";

        if (data.videoFile && data.videoFile.startsWith("/uploads/")) {
          data.videoFile = `${baseUrl}${data.videoFile}`;
        }

        if (data.videoUrl && data.videoUrl.startsWith("/uploads/")) {
          data.videoUrl = `${baseUrl}${data.videoUrl}`;
        }

        setHeroData((prev) => ({ ...prev, ...data }));
      } catch {
        // Keep local fallback data.
      }
    };

    fetchHeroData();
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const activateVideo = () => setEnableVideo(true);
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "touchstart",
      "keydown",
      "scroll",
    ];

    for (const eventName of events) {
      window.addEventListener(eventName, activateVideo, {
        once: true,
        passive: true,
      });
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => setEnableVideo(true), {
        timeout: 2500,
      });
    } else {
      timeoutId = setTimeout(() => setEnableVideo(true), 2500);
    }

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, activateVideo);
      }
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const videoSrc = useMemo(
    () => heroData.videoFile || heroData.videoUrl,
    [heroData.videoFile, heroData.videoUrl]
  );

  const posterSrc = "/images/bg-imag.webp";

  return (
    <section className="relative overflow-hidden h-screen mt-18 bg-gray-900">
      <div className="absolute inset-0 w-full h-full">
        <img
          src={posterSrc}
          alt="IICPA learning platform"
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            videoReady && !videoFailed ? "opacity-0" : "opacity-100"
          }`}
          loading="eager"
          fetchPriority="high"
        />

        {enableVideo && !videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            onError={() => {
              setVideoFailed(true);
              setVideoReady(false);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : null}

        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10 h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <h3
            className={`${heroData.colors.smallText} font-bold text-lg mb-6 drop-shadow-lg animate-fade-in-up`}
          >
            {heroData.smallText}
          </h3>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 drop-shadow-2xl">
            <span
              className={`${heroData.colors.part1} animate-fade-in-up animation-delay-100`}
            >
              {heroData.mainHeading.part1}{" "}
            </span>
            <span
              className={`${heroData.colors.part2} animate-fade-in-up animation-delay-200`}
            >
              {heroData.mainHeading.part2}
            </span>
            <br />
            <span
              className={`${heroData.colors.part3} animate-fade-in-up animation-delay-300`}
            >
              {heroData.mainHeading.part3}
            </span>{" "}
            <span
              className={`${heroData.colors.part4} animate-fade-in-up animation-delay-400`}
            >
              {heroData.mainHeading.part4}
            </span>
            <br />
            <span
              className={`${heroData.colors.part5} animate-fade-in-up animation-delay-500`}
            >
              {heroData.mainHeading.part5}
            </span>
          </h1>

          <p
            className={`${heroData.colors.description} text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-lg animate-fade-in-up animation-delay-600`}
          >
            {heroData.description}
          </p>

          <button
            onClick={() => router.push("/about")}
            className={`${heroData.colors.button} text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up animation-delay-700 hover:shadow-xl`}
          >
            {heroData.buttonText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </section>
  );
}
