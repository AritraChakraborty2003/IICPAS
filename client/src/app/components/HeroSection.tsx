"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();
  
  const [heroData, setHeroData] = useState({
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
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
        const response = await fetch(`${API_BASE}/hero`);

        if (response.ok) {
          const data = await response.json();

          // Fix video path handling
          if (data.videoFile && data.videoFile.startsWith("/uploads/")) {
            // If videoFile is a relative path, make it absolute
            const baseUrl =
              process.env.NEXT_PUBLIC_API_BASE?.replace("/api", "") ||
              "http://localhost:8080";
            data.videoFile = `${baseUrl}${data.videoFile}`;
          }

          if (data.videoUrl && data.videoUrl.startsWith("/uploads/")) {
            // If videoUrl is a relative path, make it absolute
            const baseUrl =
              process.env.NEXT_PUBLIC_API_BASE?.replace("/api", "") ||
              "http://localhost:8080";
            data.videoUrl = `${baseUrl}${data.videoUrl}`;
          }

          console.log("Hero data loaded:", data);
          setHeroData(data);
        } else {
          console.error("Failed to fetch hero data");
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  if (loading) {
    return (
      <section className="relative overflow-hidden h-screen bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden h-screen">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error("Video error:", e);
            console.error("Video src:", (e.target as HTMLVideoElement).src);
          }}
          onLoadStart={() => console.log("Video loading started")}
          onCanPlay={() => console.log("Video can play")}
          onLoadedData={() => console.log("Video data loaded")}
        >
          <source
            src={heroData.videoFile || heroData.videoUrl}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Text Content Overlay */}
      <div className="relative z-10 h-screen flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          {/* Small green text */}
          <h3
            className={`${heroData.colors.smallText} font-bold text-lg mb-6 drop-shadow-lg animate-fade-in-up`}
          >
            {heroData.smallText}
          </h3>

          {/* Main heading */}
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

          {/* Description */}
          <p
            className={`${heroData.colors.description} text-lg sm:text-xl mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-lg animate-fade-in-up animation-delay-600`}
          >
            {heroData.description}
          </p>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/about')}
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
