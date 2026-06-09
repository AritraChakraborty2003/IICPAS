import ThinHeroSection from "../components/ThinHeroSection";
import { FaDownload } from "react-icons/fa";

export default function CourseHero() {
  return (
    <ThinHeroSection title="Our Courses" breadcrumb="Home // Our Courses">
      <a
        href="/brouchure-course.pdf"
        download
        className="inline-flex items-center gap-2 bg-white text-emerald-600 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors border border-emerald-100"
      >
        <FaDownload />
        Download Brochure
      </a>
    </ThinHeroSection>
  );
}
