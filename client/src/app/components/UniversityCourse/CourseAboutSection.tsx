"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface CourseAboutSectionProps {
  title: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export default function CourseAboutSection({
  title,
  content,
  imageUrl = "/images/course-about.jpg",
  videoUrl,
}: CourseAboutSectionProps) {
  const safeContent = content || "";
  return (
    <section className="relative bg-white py-16 px-4 md:px-8 lg:px-12 xl:px-16 text-gray-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-green-100/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-green-100/20 to-blue-100/20 rounded-full blur-3xl animate-float-reverse"></div>
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Side - Media Section */}
          <div className="relative w-full lg:w-[45%] animate-fade-in-left">
            <div className="relative">
              {videoUrl ? (
                <video
                  className="rounded-3xl shadow-2xl w-full h-auto border border-gray-200/50 hover:shadow-3xl transition-shadow duration-500"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  controls={false}
                  poster={imageUrl}
                >
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Image
                  src={imageUrl}
                  alt={title}
                  width={600}
                  height={400}
                  className="rounded-3xl shadow-2xl w-full h-auto border border-gray-200/50 hover:shadow-3xl transition-shadow duration-500"
                  onError={(e) => {
                    e.currentTarget.src = "/images/course-about.jpg";
                  }}
                />
              )}
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="w-full lg:w-[50%] mt-20 lg:mt-0 animate-fade-in-right">
            {/* Section Header */}
            <div className="flex items-center gap-4 mb-8 animate-fade-in-up animation-delay-100">
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
              <p className="text-green-600 font-bold text-2xl uppercase tracking-wider">
                About {title}
              </p>
            </div>

            {/* Content */}
            <div className="animate-fade-in-up animation-delay-200">
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: safeContent
                    ? safeContent.replace(
                        /<p>/g,
                        `<p class="mb-4 text-gray-700 leading-relaxed">`
                      )
                    : "",
                }}
              />
            </div>

            {/* CTA Button */}
            <div className="mt-8 animate-fade-in-up animation-delay-300">
              <button
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white rounded-full font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onClick={() => {
                  // Scroll to contact section or trigger modal
                  const contactSection =
                    document.getElementById("course-contact");
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Apply Now
              </button>
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
