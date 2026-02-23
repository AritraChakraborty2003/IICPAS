"use client";

type BookingSkeletonGridProps = {
  count?: number;
  showFilterSkeleton?: boolean;
};

export default function BookingSkeletonGrid({
  count = 9,
  showFilterSkeleton = false,
}: BookingSkeletonGridProps) {
  return (
    <div aria-busy="true" aria-live="polite">
      {showFilterSkeleton && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 mb-5 animate-pulse">
          <div className="h-10 w-full md:w-80 bg-slate-200 rounded-lg mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
            <div className="h-10 bg-slate-200 rounded-lg" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`booking-skeleton-${index}`}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden animate-pulse"
          >
            <div className="h-44 bg-slate-200" />
            <div className="p-5">
              <div className="h-5 w-24 rounded bg-slate-200 mb-3" />
              <div className="h-5 w-11/12 rounded bg-slate-200 mb-2" />
              <div className="h-5 w-2/3 rounded bg-slate-200 mb-4" />
              <div className="h-7 w-28 rounded bg-slate-200 mb-4" />
              <div className="h-10 w-full rounded-lg bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

