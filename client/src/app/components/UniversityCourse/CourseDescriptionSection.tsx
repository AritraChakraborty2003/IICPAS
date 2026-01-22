"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  Star,
} from "lucide-react";

interface CourseDescriptionSectionProps {
  description?: string;
  careerProspects?: string[];
  highlights?: string[];
}

export default function CourseDescriptionSection({
  description,
  careerProspects,
  highlights,
}: CourseDescriptionSectionProps) {
  const careerIcons = [Briefcase, TrendingUp, Users, Target, Lightbulb, Star];
  const safeDescription = description || "";
  const safeCareerProspects = Array.isArray(careerProspects)
    ? careerProspects
    : [];
  const safeHighlights = Array.isArray(highlights) ? highlights : [];

  return (
    <section className="relative bg-white py-16 px-4 md:px-8 lg:px-12 xl:px-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-green-100/20 to-blue-100/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-green-100/20 rounded-full blur-3xl animate-float-reverse"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
            <span className="text-green-600 font-bold text-sm uppercase tracking-wider">
              Program Overview
            </span>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Course Description & Career Prospects
          </h2>
        </motion.div>

        {/* Description */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: safeDescription
                  ? safeDescription.replace(
                      /<p>/g,
                      `<p class="mb-4 text-gray-700 leading-relaxed">`
                    )
                  : "",
              }}
            />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Career Prospects */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Career Prospects
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {safeCareerProspects.map((career, index) => {
                const IconComponent = careerIcons[index % careerIcons.length];
                return (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{career}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Key Features */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Key Features</h3>
            </div>

            <ul className="space-y-4">
              {safeHighlights.map((highlight, index) => {
                const IconComponent = careerIcons[index % careerIcons.length];
                return (
                  <motion.li
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">
                      {highlight}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
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

        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
