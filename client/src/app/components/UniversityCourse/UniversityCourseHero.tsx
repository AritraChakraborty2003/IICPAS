"use client";

import ThinHeroSection from "../../components/ThinHeroSection";

interface UniversityCourseHeroProps {
  courseName?: string;
  category?: string;
}

export default function UniversityCourseHero({
  courseName = "University Course",
  category = "Program",
}: UniversityCourseHeroProps) {
  const breadcrumb = `Home / ${courseName}`;

  return <ThinHeroSection title={courseName} breadcrumb={breadcrumb} />;
}
