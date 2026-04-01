"use client";

import Image from "next/image";
import { BookingCourse } from "./types";

type BookingCourseCardProps = {
  course: BookingCourse;
  onBookNow: (course: BookingCourse) => void;
  isBooking: boolean;
};

export default function BookingCourseCard({
  course,
  onBookNow,
  isBooking,
}: BookingCourseCardProps) {
  const originalPrice = course.recordedOriginalPrice ?? course.liveOriginalPrice;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <Image
          src={course.image}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-5">
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {course.category}
        </span>

        <h2 className="mt-3 min-h-[56px] text-lg leading-7 font-bold text-slate-900 line-clamp-2">
          {course.title}
        </h2>

        <div className="mt-3 flex items-end gap-2">
          <p className="text-xl font-extrabold text-emerald-700">
            Rs {course.effectivePrice.toLocaleString()}
          </p>
          {originalPrice && originalPrice > course.effectivePrice && (
            <p className="text-sm text-slate-400 line-through">
              Rs {originalPrice.toLocaleString()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onBookNow(course)}
          disabled={isBooking}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isBooking ? "Processing..." : "Register Now"}
        </button>
      </div>
    </article>
  );
}
