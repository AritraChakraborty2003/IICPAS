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
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pt-36 pb-20">
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 px-8 py-10 text-white shadow-2xl sm:px-10">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-medium tracking-wide">
                  Introductory Course Page
                </span>
                <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                  {content.title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg text-slate-200">
                  {content.subtitle}
                </p>
                <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300">
                  {content.intro}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full bg-[#3cd664] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#31bc56]"
                  >
                    Enquire Now
                  </Link>
                  <Link
                    href="/course"
                    className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Browse Courses
                  </Link>
                </div>
              </div>

              <aside className="rounded-[28px] bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">
                  Course Snapshot
                </h2>
                <dl className="mt-6 space-y-5">
                  <div>
                    <dt className="text-sm font-medium text-slate-500">
                      Duration
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">
                      {content.duration}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">
                      Level
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">
                      {content.level}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-500">Mode</dt>
                    <dd className="mt-1 text-base font-semibold text-slate-900">
                      {content.mode}
                    </dd>
                  </div>
                </dl>
                <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-950">
                  {content.description}
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
            <div className="rounded-[24px] bg-white p-6 shadow-md ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Key Highlights
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {content.highlights.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#3cd664]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] bg-white p-6 shadow-md ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Learning Outcomes
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {content.outcomes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[24px] bg-white p-6 shadow-md ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Who Should Join
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {content.audience.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
