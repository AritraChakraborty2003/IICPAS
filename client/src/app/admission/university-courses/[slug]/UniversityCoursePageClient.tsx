"use client";

import { useEffect, useState } from "react";
import UniversityCourseHero from "../../../components/UniversityCourse/UniversityCourseHero";
import CourseAboutSection from "../../../components/UniversityCourse/CourseAboutSection";
import CourseEligibilitySection from "../../../components/UniversityCourse/CourseEligibilitySection";
import CourseDescriptionSection from "../../../components/UniversityCourse/CourseDescriptionSection";
import CourseContactSection from "../../../components/UniversityCourse/CourseContactSection";
import InlineAdmissionForm from "../../../components/InlineAdmissionForm";
import AdmissionModal from "../../../components/AdmissionModal";
import { UniversityCourse } from "../../../../data/universityCourses";

interface UniversityCoursePageClientProps {
  course: UniversityCourse;
}

export default function UniversityCoursePageClient({
  course,
}: UniversityCoursePageClientProps) {
  const safeCourse: UniversityCourse = {
    ...course,
    name: course?.name || "University Course",
    category: course?.category || "UG Programs",
    about:
      course?.about ||
      "Learn more about this program, its structure, and the opportunities it offers.",
    description:
      course?.description ||
      "Detailed curriculum and career prospects will be published soon.",
    eligibility: Array.isArray(course?.eligibility) ? course.eligibility : [],
    highlights: Array.isArray(course?.highlights) ? course.highlights : [],
    careerProspects: Array.isArray(course?.careerProspects)
      ? course.careerProspects
      : [],
    duration: course?.duration || "Varies",
  };

  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  // Modal disabled - using inline form instead
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowAdmissionModal(true);
  //   }, 1000); // Small delay to ensure page is loaded

  //   return () => clearTimeout(timer);
  // }, []);

  const handleCloseModal = () => {
    setShowAdmissionModal(false);
  };

  return (
    <>
      {/* Hero Section */}
      <UniversityCourseHero
        courseName={safeCourse.name}
        category={safeCourse.category}
      />

      {/* About Section */}
      <CourseAboutSection
        title={safeCourse.name}
        content={safeCourse.about}
        imageUrl="/images/about.jpeg"
      />

      {/* Eligibility & Highlights Section */}
      <CourseEligibilitySection
        eligibility={safeCourse.eligibility}
        duration={safeCourse.duration}
        highlights={safeCourse.highlights}
      />

      {/* Description & Career Prospects Section */}
      <CourseDescriptionSection
        description={safeCourse.description}
        careerProspects={safeCourse.careerProspects}
        highlights={safeCourse.highlights}
      />

      {/* Inline Admission Form */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <InlineAdmissionForm selectedCourse={safeCourse.name} />
        </div>
      </div>

      {/* Contact Section */}
      <CourseContactSection courseName={safeCourse.name} />

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={showAdmissionModal}
        onClose={handleCloseModal}
        selectedCourse={safeCourse.name}
      />
    </>
  );
}
