"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type AboutData = {
  title: string;
  content: string;
  mainImage: string;
  video: {
    type: string;
    url: string;
    poster: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
  };
  button: {
    text: string;
    link: string;
  };
  colors: {
    title: string;
    content: string;
    background: string;
  };
};

const defaultAboutData: AboutData = {
  title: "About Us",
  content:
    "Welcome to IICPA Institute, where excellence in education meets innovation in learning. We are committed to providing world-class education that transforms careers and empowers individuals to achieve their professional goals. Our comprehensive curriculum, expert instructors, and industry-aligned programs ensure you receive the best learning experience.",
  mainImage: "/images/about.jpeg",
  video: {
    type: "file",
    url: "/videos/aboutus.mp4",
    poster: "/images/video-poster.jpg",
    autoplay: false,
    loop: false,
    muted: true,
  },
  button: {
    text: "Learn More About Us",
    link: "/about",
  },
  colors: {
    title: "text-green-600",
    content: "text-gray-700",
    background: "bg-white",
  },
};

export default function AboutUsSection() {
  const [aboutData, setAboutData] = useState<AboutData>(defaultAboutData);
  const [loadVideo, setLoadVideo] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
        const response = await fetch(`${API_BASE}/about`, {
          next: { revalidate: 600 },
        });

        if (!response.ok) return;

        const data = await response.json();
        setAboutData((prev) => ({ ...prev, ...data }));
      } catch {
        // Keep fallback content.
      }
    };

    fetchAboutData();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`relative ${aboutData.colors.background} py-16 px-4 md:px-8 lg:px-12 xl:px-16 text-gray-800 overflow-hidden`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-green-100/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-green-100/20 to-blue-100/20 rounded-full blur-3xl animate-float-reverse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="relative w-full lg:w-[45%] animate-fade-in-left">
            <div className="relative rounded-3xl overflow-hidden border border-gray-200/50 shadow-2xl">
              {loadVideo ? (
                <video
                  className="w-full h-auto"
                  controls
                  playsInline
                  preload="none"
                  muted={aboutData.video?.muted !== false}
                  poster={aboutData.video?.poster || "/images/video-poster.jpg"}
                >
                  <source
                    src={aboutData.video?.url || "/videos/aboutus.mp4"}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="relative">
                  <img
                    src={aboutData.video?.poster || "/images/video-poster.jpg"}
                    alt="About IICPA"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <button
                      type="button"
                      className="px-5 py-3 rounded-full bg-white/90 text-gray-900 font-semibold"
                      onClick={() => setLoadVideo(true)}
                    >
                      Load Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[50%] mt-20 lg:mt-0 animate-fade-in-right">
            <div className="flex items-center gap-4 mb-8 animate-fade-in-up animation-delay-100">
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
              <p
                className={`${aboutData.colors.title} font-bold text-2xl uppercase tracking-wider`}
              >
                {aboutData.title}
              </p>
            </div>

            <div className="animate-fade-in-up animation-delay-200">
              <div
                className={`prose prose-lg max-w-none ${aboutData.colors.content} leading-relaxed`}
                dangerouslySetInnerHTML={{
                  __html: (aboutData.content || "").replace(
                    /<p>/g,
                    `<p class=\"mb-4 ${aboutData.colors.content} leading-relaxed\">`
                  ),
                }}
              />
            </div>

            <div className="mt-8 animate-fade-in-up animation-delay-300">
              <Link
                href={aboutData.button.link}
                className="inline-flex px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {aboutData.button.text}
              </Link>
            </div>
          </div>
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

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes floatSlow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-15px) translateX(8px);
          }
        }

        @keyframes floatReverse {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(15px) translateX(-8px);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 8s ease-in-out infinite;
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
      `}</style>
    </section>
  );
}
