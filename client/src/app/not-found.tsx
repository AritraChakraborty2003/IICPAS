import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#f8fbff_0%,#eef6ff_45%,#f7fff7_100%)] px-6 py-16">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />

      <section className="relative mx-auto flex min-h-[80vh] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/80 bg-white/85 p-8 text-center shadow-[0_24px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur md:p-12">
          <p className="mb-3 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold tracking-[0.12em] text-blue-700">
            PAGE NOT FOUND
          </p>

          <h1 className="text-7xl font-black leading-none text-slate-900 md:text-8xl">
            404
          </h1>

          <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
            This page took a wrong turn
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            The URL may be outdated, moved, or typed incorrectly. Use one of the
            links below to get back on track.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-w-44 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Go To Home
            </Link>
            <Link
              href="/course"
              className="inline-flex min-w-44 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
