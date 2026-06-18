"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  VideoIcon,
  PhoneIcon,
  VideoOffIcon,
  MicOffIcon,
  MoreHorizontal,
} from "lucide-react";

interface LiveSession {
  _id: string;
  title: string;
  time: string;
  date: string;
  link: string;
  price: number;
  status: string;
  instructor?: string;
  category?: string;
  description?: string;
  maxParticipants?: number;
  thumbnail?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LiveClassSection() {
  const router = useRouter();
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback static data for instant loading
  const fallbackSessions: LiveSession[] = [
    {
      _id: "1",
      title: "Master Python Programming for Beginners and Beyond",
      time: "10:00 - 12:00",
      date: new Date().toISOString(),
      link: "https://example.com/live-session-1",
      price: 0,
      status: "active",
    },
    {
      _id: "2",
      title: "Meet the Team: Passionate People, Exceptional Talent",
      time: "14:00 - 16:00",
      date: new Date().toISOString(),
      link: "https://example.com/live-session-2",
      price: 0,
      status: "active",
    },
    {
      _id: "3",
      title: "The Faces Behind the Brand, Dedicated, Driven",
      time: "18:00 - 20:00",
      date: new Date().toISOString(),
      link: "https://example.com/live-session-3",
      price: 0,
      status: "active",
    },
  ];

  useEffect(() => {
    fetchLiveSessions();
  }, []);

  const fetchLiveSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live-sessions`);
      if (response.ok) {
        const data = await response.json();
        // Filter only active sessions and limit to 3 for homepage display
        const activeSessions = data
          .filter((session: LiveSession) => session.status === "active")
          .slice(0, 3);
        setLiveSessions(activeSessions);
      } else {
        // Use fallback data if API fails
        setLiveSessions(fallbackSessions);
      }
    } catch (error) {
      console.error("Error fetching live sessions:", error);
      // Use fallback data if API fails
      setLiveSessions(fallbackSessions);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (session: LiveSession) => {
    if (session.link) {
      // If it's a valid URL, open in new tab
      if (session.link.startsWith("http")) {
        window.open(session.link, "_blank");
      } else {
        // If it's a relative path, navigate within the app
        router.push(session.link);
      }
    } else {
      // Navigate to live session page as fallback
      router.push("/live");
    }
  };

  const handleJoinLiveClick = () => {
    const activeSession = liveSessions.find(
      (session) => session.status === "active"
    );
    if (activeSession && activeSession.link) {
      handleSessionClick(activeSession);
    } else {
      router.push("/live-session");
    }
  };
  return (
    <section className="relative py-12 bg-white overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-green-100/30 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Modern Left Side */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.02 }}
          >
            {/* Modern Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                <span className="text-green-600 font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                  🎓 Join Live
                </span>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
              </div>
            </motion.div>

            <motion.h2
              className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              Join Our Live Class, <br /> Start Your Online{" "}
              <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                Journey
              </span>
            </motion.h2>

            <motion.p
              className="text-base text-gray-600 mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              Experience interactive learning with our expert instructors in
              real-time sessions
            </motion.p>

            {/* Modern Course Cards */}
            <div className="space-y-4">
              {liveSessions.map((session, idx) => (
                <motion.div
                  key={session._id}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 shadow-xl transform-gpu hover:shadow-2xl transition-all duration-500 cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.02, delay: 0.01 + idx * 0.005 }}
                  whileHover={{
                    scale: 1.02,
                    rotateY: 2,
                  }}
                  onClick={() => handleSessionClick(session)}
                  style={{
                    transform: "translateZ(20px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* 3D Icon Container */}
                    <motion.div
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white shadow-lg transform-gpu"
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                      }}
                      animate={{
                        y: [0, -3, 0],
                        rotate: [0, 1, -1, 0],
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      style={{
                        transform: "translateZ(20px)",
                        boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.4)",
                      }}
                    >
                      <VideoIcon size={16} />
                    </motion.div>

                    <div className="flex-1">
                      {/* Course Info Badge */}
                      <motion.div
                        className="mb-2"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.02,
                          delay: 0.01 + idx * 0.005,
                        }}
                      >
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 text-green-600 text-sm font-semibold px-3 py-1 rounded-full border border-green-200/50">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {new Date(session.date).toLocaleDateString()} ·{" "}
                          {session.time}
                        </div>
                      </motion.div>

                      {/* Title */}
                      <motion.h3
                        className="font-bold text-base text-gray-900 group-hover:text-green-600 transition-colors duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.02,
                          delay: 0.01 + idx * 0.005,
                        }}
                      >
                        {session.title}
                      </motion.h3>
                    </div>
                  </div>

                  {/* Hover Overlay Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Modern Right Side - Live Class UI */}
          <motion.div
            className="relative w-full lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.02, delay: 0.01 }}
          >
            <motion.div
              className="relative bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-gray-200/50 transform-gpu"
              initial={{ scale: 0.95, rotateY: -15, opacity: 0 }}
              whileInView={{
                scale: 1,
                rotateY: 0,
                opacity: 1,
              }}
              whileHover={{
                scale: 1.02,
                rotateY: 2,
              }}
              transition={{
                duration: 0.02,
                ease: "easeOut",
              }}
              style={{
                transformStyle: "preserve-3d",
                transform: "translateZ(30px)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div className="relative w-full h-96 bg-gradient-to-br from-green-50/50 to-blue-50/50">
                {/* Modern Live Tag */}
                <motion.div
                  className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg z-10 flex items-center gap-2"
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                      "0 0 0 10px rgba(239, 68, 68, 0)",
                      "0 0 0 0 rgba(239, 68, 68, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  LIVE · 01:30:56
                </motion.div>

                {/* Modern Image with 3D Effects */}
                <motion.div
                  className="relative w-full h-full"
                  initial={{ x: -50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{
                    duration: 0.02,
                    ease: "easeOut",
                    delay: 0.01,
                  }}
                >
                  <Image
                    src="/images/live-class.jpg"
                    alt="Live Class Student"
                    fill
                    className="object-cover object-center"
                    style={{
                      transform:
                        "perspective(1000px) rotateX(2deg) rotateY(-2deg)",
                      transformStyle: "preserve-3d",
                    }}
                  />

                  {/* Modern Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10" />

                  {/* Floating Elements */}
                  <motion.div
                    className="absolute top-1/2 right-4 w-3 h-3 bg-green-400 rounded-full"
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute bottom-1/3 right-8 w-2 h-2 bg-blue-400 rounded-full"
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 4,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  />
                </motion.div>

                {/* Modern Call Control Footer */}
                <motion.div
                  className="absolute bottom-0 w-full bg-gradient-to-r from-green-500 to-blue-600 py-3 px-4 flex items-center justify-center gap-4 rounded-b-2xl z-10"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.02, delay: 0.01 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MoreHorizontal
                      className="text-white cursor-pointer"
                      size={18}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <PhoneIcon
                      className="text-white cursor-pointer"
                      size={18}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <VideoOffIcon
                      className="text-white cursor-pointer"
                      size={18}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <MicOffIcon
                      className="text-white cursor-pointer"
                      size={18}
                    />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Join Now Button */}
            <motion.div
              className="text-center mt-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              <motion.button
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-xl transition-all duration-300 hover:shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinLiveClick}
              >
                Join Live Class Now
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5 }}
                >
                  →
                </motion.div>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
        }
      `}</style>
    </section>
  );
}
