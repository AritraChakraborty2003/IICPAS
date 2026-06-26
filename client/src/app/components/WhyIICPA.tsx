"use client";

import Link from "next/link";
import { FaGraduationCap, FaUsers, FaPlay } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function WhyIICPA() {
  const normalizeCoursesLink = (link) => {
    if (link === "/courses") return "/course";
    return link || "/course";
  };

  const [whyIICPAData, setWhyIICPAData] = useState({
    title: "Empowering Your Future with Excellence",
    subtitle: "Why Choose IICPA",
    description:
      "IICPA Institute stands as a beacon of educational excellence, offering cutting-edge courses designed to transform your career aspirations into reality. Our comprehensive curriculum, expert instructors, and industry-aligned programs ensure you receive world-class education that prepares you for the dynamic professional landscape.",
    image: "/images/img1.jpg",
    statistics: {
      courses: {
        number: "50+",
        label: "Courses",
        description:
          "Comprehensive courses covering accounting, finance, and professional development",
      },
      students: {
        number: "10K+",
        label: "Students",
        description:
          "Successful graduates building successful careers across industries",
      },
      successRate: {
        number: "98%",
        label: "Success Rate",
      },
    },
    features: [
      "Industry-Expert Instructors",
      "Flexible Learning Schedule",
      "Practical Hands-on Training",
      "Career Placement Support",
    ],
    buttons: {
      exploreCourses: {
        text: "Explore Our Courses",
        link: "/course",
      },
      learnMore: {
        text: "Learn More About IICPA",
        link: "/about",
      },
    },
    colors: {
      title: "text-white",
      subtitle: "text-green-400",
      description: "text-white/70",
      background: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    },
  });

  useEffect(() => {
    const fetchWhyIICPAData = async () => {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
        const response = await fetch(`${API_BASE}/why-iicpa`);
        if (response.ok) {
          const data = await response.json();
          setWhyIICPAData(data);
        }
      } catch (error) {
        console.error("Error fetching WhyIICPA data:", error);
      }
    };

    fetchWhyIICPAData();
  }, []);

  return (
    <section
      className={`relative py-12 ${whyIICPAData.colors.background} overflow-hidden`}
    >
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 12,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - 3D Image */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.02 }}
          >
            <motion.div
              className="relative perspective-1000"
              animate={{
                rotateY: [0, 2, -2, 0],
                rotateX: [0, 1, -1, 0],
                scale: [1, 1.01, 1],
                x: [0, 15, -15, 0],
              }}
              transition={{
                duration: 8,
                ease: "easeInOut",
              }}
              whileHover={{
                rotateY: 5,
                rotateX: 5,
                scale: 1.02,
              }}
            >
              <div className="relative overflow-hidden rounded-3xl shadow-2xl transform-gpu border border-white/20">
                <motion.img
                  src={whyIICPAData.image}
                  alt="IICPA Students Learning"
                  className="w-full h-[400px] object-cover"
                  style={{
                    transform: "translateZ(20px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    filter: [
                      "brightness(1)",
                      "brightness(1.1)",
                      "brightness(1)",
                    ],
                  }}
                  transition={{
                    duration: 8,
                    ease: "easeInOut",
                  }}
                />

                {/* 3D Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                {/* 3D Floating stats card */}
                <motion.div
                  className="absolute bottom-6 left-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20"
                  animate={{
                    y: [0, -5, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    scale: 1.05,
                    rotateY: 10,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-3"
                      animate={{
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        ease: "easeInOut",
                      }}
                      whileHover={{ rotate: 360 }}
                    >
                      <FaGraduationCap className="text-white text-lg" />
                    </motion.div>
                    <div>
                      <p className="text-sm text-white/70">
                        {whyIICPAData.statistics.successRate.label}
                      </p>
                      <p className="text-xl font-bold text-white">
                        {whyIICPAData.statistics.successRate.number}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* 3D Courses Button */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              <Link
                href={normalizeCoursesLink(
                  whyIICPAData.buttons.exploreCourses.link
                )}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-2xl transition-all duration-300 transform-gpu hover:scale-105 hover:shadow-green-500/25 border border-white/20"
              >
                <FaGraduationCap className="text-xl" />
                {whyIICPAData.buttons.exploreCourses.text}
                <FaPlay className="text-sm" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side - 3D Content */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.02 }}
          >
            {/* Section Title */}
            <div className="space-y-4">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.02 }}
              >
                <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                <span
                  className={`${whyIICPAData.colors.subtitle} font-semibold text-sm uppercase tracking-wider`}
                >
                  {whyIICPAData.subtitle}
                </span>
              </motion.div>

              <motion.h2
                className={`text-3xl lg:text-4xl font-bold ${whyIICPAData.colors.title} leading-tight`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.02, delay: 0.01 }}
              >
                {whyIICPAData.title}
              </motion.h2>
            </div>

            {/* Description */}
            <motion.p
              className={`text-base ${whyIICPAData.colors.description} leading-relaxed`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              {whyIICPAData.description}
            </motion.p>

            {/* 3D Statistics Boxes */}
            <div className="grid grid-cols-2 gap-6">
              {/* Courses Box */}
              <motion.div
                className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl transform-gpu hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.02, delay: 0.01 }}
                whileHover={{
                  rotateY: 5,
                  rotateX: 5,
                }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <FaGraduationCap className="text-white text-2xl" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {whyIICPAData.statistics.courses.number}
                      </h3>
                      <p className="text-blue-400 font-semibold">
                        {whyIICPAData.statistics.courses.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    {whyIICPAData.statistics.courses.description}
                  </p>
                </div>
              </motion.div>

              {/* Students Box */}
              <motion.div
                className="group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl transform-gpu hover:scale-105 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.02, delay: 0.01 }}
                whileHover={{
                  rotateY: 5,
                  rotateX: 5,
                }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <FaUsers className="text-white text-2xl" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {whyIICPAData.statistics.students.number}
                      </h3>
                      <p className="text-green-400 font-semibold">
                        {whyIICPAData.statistics.students.label}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    {whyIICPAData.statistics.students.description}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* 3D Features List */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              {whyIICPAData.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-3 group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.02, delay: 0.01 + index * 0.005 }}
                >
                  <motion.div
                    className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full group-hover:scale-150 transition-transform duration-300"
                    whileHover={{ scale: 1.5 }}
                  />
                  <span className="text-white/80 group-hover:text-white transition-colors duration-300">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </motion.div>

            {/* 3D CTA Button */}
            <motion.div
              className="pt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.02, delay: 0.01 }}
            >
              <Link
                href={whyIICPAData.buttons.learnMore.link}
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold group transition-colors duration-300"
              >
                {whyIICPAData.buttons.learnMore.text}
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaPlay className="text-sm" />
                </motion.div>
              </Link>
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
