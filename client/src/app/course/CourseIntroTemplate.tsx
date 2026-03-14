import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CourseIntroContent } from "./courseIntroData";

interface CourseIntroTemplateProps {
  content: CourseIntroContent;
}

export default function CourseIntroTemplate({
  content,
}: CourseIntroTemplateProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 pb-20">
        <section className="relative overflow-hidden bg-gradient-to-r from-[#03203f] via-[#053a5f] to-[#017a4a] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,215,0,0.14),_transparent_28%)]" />
          <div className="relative mx-auto grid min-h-[640px] max-w-[1440px] items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-16">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
                {content.eyebrow}
              </span>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
                {content.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-white/85 sm:text-xl">
                {content.subtitle}
              </p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
                {content.intro}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#3cd664] px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-[#31bc56]"
                >
                  Apply For Admission
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Talk To Counsellor
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
                <div className="border-l-2 border-[#3cd664] pl-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                    Duration
                  </p>
                  <p className="mt-2 text-xl font-semibold">{content.duration}</p>
                </div>
                <div className="border-l-2 border-[#3cd664] pl-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                    Level
                  </p>
                  <p className="mt-2 text-xl font-semibold">{content.level}</p>
                </div>
                <div className="border-l-2 border-[#3cd664] pl-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                    Mode
                  </p>
                  <p className="mt-2 text-xl font-semibold">{content.mode}</p>
                </div>
              </div>
            </div>

            <aside className="bg-white/10 p-6 backdrop-blur-sm sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ef0a5]">
                Admission Overview
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight">
                Professional training with direct relevance to Indian jobs and practical office work
              </h2>
              <p className="mt-5 text-base leading-8 text-white/80">
                {content.description}
              </p>
              <div className="mt-8 border-t border-white/15 pt-6">
                <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                  Certification
                </p>
                <p className="mt-2 text-lg font-semibold">{content.certification}</p>
              </div>
              <div className="mt-6 border-t border-white/15 pt-6">
                <p className="text-sm uppercase tracking-[0.16em] text-white/60">
                  Admission Fit
                </p>
                <p className="mt-2 text-base leading-7 text-white/80">
                  {content.admissionsNote}
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[#f7faf8]">
          <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#067647]">
                  Admission Information
                </p>
                <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
                  Course admission with an employability-first approach
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  These pages are positioned as introductory admission pages for learners across India who want a short-term, skill-oriented course that can support career entry, role transition, or practical upskilling.
                </p>
              </div>
              <div className="grid gap-5">
                {content.admissionsPoints.map((item) => (
                  <div
                    key={item}
                    className="border-l-4 border-[#3cd664] bg-white px-6 py-5 shadow-sm"
                  >
                    <p className="text-base leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Key Highlights
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                {content.highlights.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-slate-200 pb-4">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#3cd664]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Learning Outcomes
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                {content.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-slate-200 pb-4">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-slate-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Who Should Join
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-7 text-slate-600">
                {content.audience.map((item) => (
                  <li key={item} className="flex gap-3 border-b border-slate-200 pb-4">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8ef0a5]">
                  Admission Support
                </p>
                <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                  Ready to move ahead with admission?
                </h2>
                <p className="mt-5 text-base leading-8 text-white/75 sm:text-lg">
                  Connect with the IICPA team for admission guidance, course details, and enrollment support. These pages are now structured as direct promotional entry points instead of placeholder course records.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#3cd664] px-7 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-[#31bc56]"
                >
                  Start Admission
                </Link>
                <Link
                  href="/course"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore More Courses
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
