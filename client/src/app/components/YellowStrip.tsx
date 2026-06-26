"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGraduationCap, FaClipboardCheck, FaBookOpen, FaTrophy, FaRocket, FaChartLine } from "react-icons/fa";

export default function YellowStatsStrip() {
  const [yellowStatsStripData, setYellowStatsStripData] = useState({
    title: "Our Achievements",
    statistics: [
      {
        icon: "FaGraduationCap",
        number: "120K+",
        label: "Successfully Student",
        color: "from-blue-500 to-cyan-500",
        bgColor: "from-blue-600/20 to-cyan-600/20",
      },
      {
        icon: "FaClipboardCheck",
        number: "560K+",
        label: "Courses Completed",
        color: "from-green-500 to-emerald-500",
        bgColor: "from-green-600/20 to-emerald-600/20",
      },
      {
        icon: "FaBookOpen",
        number: "3M+",
        label: "Satisfied Review",
        color: "from-purple-500 to-pink-500",
        bgColor: "from-purple-600/20 to-pink-600/20",
      },
      {
        icon: "FaTrophy",
        number: "120K+",
        label: "Successfully Student",
        color: "from-orange-500 to-red-500",
        bgColor: "from-orange-600/20 to-red-600/20",
      }
    ],
    colors: {
      title: "text-white",
      accent: "text-[#3cd664]",
      background: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    }
  });
  useEffect(() => {
    const fetchYellowStatsStripData = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
        const response = await fetch(`${API_BASE}/yellow-stats-strip`);
        if (response.ok) {
          const data = await response.json();
          setYellowStatsStripData(data);
        }
      } catch (error) {
        console.error("Error fetching Yellow Stats Strip data:", error);
      }
    };

    fetchYellowStatsStripData();
  }, []);

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      FaGraduationCap: FaGraduationCap,
      FaClipboardCheck: FaClipboardCheck,
      FaBookOpen: FaBookOpen,
      FaTrophy: FaTrophy,
      FaRocket: FaRocket,
      FaChartLine: FaChartLine
    };
    return iconMap[iconName] || FaGraduationCap;
  };

  return (
    <section className={`relative ${yellowStatsStripData.colors.background} py-16 px-6 overflow-hidden`}>
      {/* Lightweight Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-xl animate-float-slow"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-float-reverse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-full blur-lg animate-float-gentle"></div>
      </div>

      {/* Optimized Section Title */}
      <div className="text-center mb-12 animate-fade-in-up">
        <h2 className={`text-4xl md:text-5xl font-bold ${yellowStatsStripData.colors.title} mb-4`}>
          {yellowStatsStripData.title.split(' ').map((word, index) => 
            index === 1 ? (
              <span key={index} className={yellowStatsStripData.colors.accent}> {word}</span>
            ) : (
              <span key={index}>{index === 0 ? '' : ' '}{word}</span>
            )
          )}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-[#3cd664] to-green-500 mx-auto rounded-full"></div>
      </div>

      {/* Optimized Stats Grid */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className={`grid gap-6 md:gap-8 ${
          yellowStatsStripData.statistics.length === 1 ? 'grid-cols-1' :
          yellowStatsStripData.statistics.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
          yellowStatsStripData.statistics.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {yellowStatsStripData.statistics.map((item, index) => {
            const IconComponent = getIconComponent(item.icon);
            return (
              <div
                key={index}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Optimized Card Container */}
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
                  {/* Optimized Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgColor} opacity-30`} />

                  {/* Optimized Icon Container */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    {/* Optimized Icon */}
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="text-3xl text-white drop-shadow-lg" />
                    </div>

                    {/* Optimized Number */}
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2 hover:scale-110 transition-transform duration-300">
                      {item.number}
                    </div>

                    {/* Optimized Label */}
                    <div className="text-sm md:text-base text-gray-300 font-medium">
                      {item.label}
                    </div>
                  </div>

                  {/* Optimized Floating Particles */}
                  <div className="absolute inset-0 overflow-hidden rounded-3xl">
                    {[...Array(Math.min(3, yellowStatsStripData.statistics.length))].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                        style={{
                          left: `${20 + i * 30}%`,
                          top: `${30 + i * 20}%`,
                          animationDelay: `${i * 0.5}s`,
                          animationDuration: `${2 + i * 0.5}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Optimized Connection Line */}
                {index !== yellowStatsStripData.statistics.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-yellow-400 to-transparent" />
                )}
              </div>
            );
          })}
          </div>

        {/* Optimized Bottom Decorative Elements */}
        <div className="flex justify-center mt-12 gap-4 animate-fade-in-up animation-delay-500">
          {[...Array(Math.min(4, yellowStatsStripData.statistics.length))].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
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
        
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(8px); }
        }
        
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(15px) translateX(-8px); }
        }
        
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-10px) translateX(5px); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        
        .animate-float-reverse {
          animation: floatReverse 8s ease-in-out infinite;
        }
        
        .animate-float-gentle {
          animation: floatGentle 4s ease-in-out infinite;
        }
        
        .animation-delay-500 { animation-delay: 0.5s; }
      `}</style>
    </section>
  );
}
