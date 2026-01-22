"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  Award,
} from "lucide-react";

interface CourseEligibilitySectionProps {
  eligibility?: string[];
  duration?: string;
  highlights?: string[];
}

export default function CourseEligibilitySection({
  eligibility,
  duration,
  highlights,
}: CourseEligibilitySectionProps) {
  const eligibilityIcons = [
    GraduationCap,
    BookOpen,
    Users,
    Clock,
    Award,
    CheckCircle,
  ];

  const safeEligibility = Array.isArray(eligibility) ? eligibility : [];
  const safeHighlights = Array.isArray(highlights) ? highlights : [];

  return (
    <section className="relative bg-gray-50 py-16 px-4 md:px-8 lg:px-12 xl:px-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-24 h-24 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-100/30 to-green-100/30 rounded-full blur-2xl"></div>
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
              Course Details
            </span>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Eligibility & Program Highlights
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Eligibility Section */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Eligibility Criteria
              </h3>
            </div>

            <ul className="space-y-4">
              {safeEligibility.map((item, index) => {
                const IconComponent =
                  eligibilityIcons[index % eligibilityIcons.length];
                return (
                  <motion.li
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 leading-relaxed">
                      {item}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            {duration && (
              <motion.div
                className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">
                    Program Duration:
                  </span>
                  <span className="text-green-600 font-bold">{duration}</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Highlights Section */}
          <motion.div
            className="bg-white rounded-2xl shadow-lg p-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Program Highlights
              </h3>
            </div>

            <ul className="space-y-4">
              {safeHighlights.map((item, index) => {
                const IconComponent =
                  eligibilityIcons[index % eligibilityIcons.length];
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
                      {item}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
