import ThinHeroSection from "../components/ThinHeroSection";

export default function CourseHero() {
  return (
    <ThinHeroSection title="Our Courses" breadcrumb="Home // Our Courses">
      <a
        href="/images/IICPA BROCHURE COURSE  24.pdf"
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:bg-emerald-50 hover:-translate-y-0.5 transition-all duration-300 text-sm md:text-base mt-4 md:mt-0"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Get Brochure
      </a>
    </ThinHeroSection>
  );
}
