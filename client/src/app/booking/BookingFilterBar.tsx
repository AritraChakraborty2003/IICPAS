"use client";

import { SlidersHorizontal, Search } from "lucide-react";
import { BookingFilterState, BookingSortOption } from "./types";

type BookingFilterBarProps = {
  filters: BookingFilterState;
  categories: string[];
  minBound: number;
  maxBound: number;
  activeFilterCount: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: BookingSortOption) => void;
  onToggleCategory: (value: string) => void;
  onPriceChange: (minPrice: number, maxPrice: number) => void;
  onOpenMobileFilters: () => void;
  onClearAll: () => void;
  onRemoveSearch: () => void;
  onRemoveCategory: (value: string) => void;
  onRemovePrice: () => void;
};

const sortOptions: { label: string; value: BookingSortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Price low-high", value: "price-low-high" },
  { label: "Price high-low", value: "price-high-low" },
  { label: "Newest", value: "newest" },
];

export default function BookingFilterBar({
  filters,
  categories,
  minBound,
  maxBound,
  activeFilterCount,
  onSearchChange,
  onSortChange,
  onToggleCategory,
  onPriceChange,
  onOpenMobileFilters,
  onClearAll,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePrice,
}: BookingFilterBarProps) {
  const isPriceFiltered = filters.minPrice > minBound || filters.maxPrice < maxBound;

  return (
    <div className="sticky top-20 z-20 rounded-2xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur px-4 py-4 md:px-5 md:py-5">
      <div className="md:hidden flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search courses"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="relative inline-flex items-center justify-center rounded-lg border border-slate-300 p-2.5 text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="hidden md:grid md:grid-cols-12 md:gap-3">
        <div className="col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by course name"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="col-span-3">
          <details className="relative group">
            <summary className="list-none cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 flex items-center justify-between">
              <span>
                Categories
                {filters.categories.length > 0 && (
                  <span className="ml-1 font-semibold text-emerald-700">
                    ({filters.categories.length})
                  </span>
                )}
              </span>
              <span className="text-slate-400">+</span>
            </summary>
            <div className="absolute left-0 right-0 mt-2 rounded-lg border border-slate-200 bg-white shadow-lg p-3 max-h-64 overflow-auto z-30">
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500">No categories</p>
              ) : (
                categories.map((category) => (
                  <label key={category} className="flex items-center gap-2 py-1 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category)}
                      onChange={() => onToggleCategory(category)}
                      className="accent-emerald-600"
                    />
                    <span>{category}</span>
                  </label>
                ))
              )}
            </div>
          </details>
        </div>

        <div className="col-span-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            min={minBound}
            max={maxBound}
            value={filters.minPrice}
            onChange={(event) => onPriceChange(Number(event.target.value), filters.maxPrice)}
            placeholder="Min"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <input
            type="number"
            min={minBound}
            max={maxBound}
            value={filters.maxPrice}
            onChange={(event) => onPriceChange(filters.minPrice, Number(event.target.value))}
            placeholder="Max"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="col-span-2 flex gap-2">
          <select
            value={filters.sortBy}
            onChange={(event) => onSortChange(event.target.value as BookingSortOption)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filters.search.trim() && (
            <button
              type="button"
              onClick={onRemoveSearch}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Search: {filters.search} x
            </button>
          )}
          {filters.categories.map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => onRemoveCategory(category)}
              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
            >
              {category} x
            </button>
          ))}
          {isPriceFiltered && (
            <button
              type="button"
              onClick={onRemovePrice}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              Price: Rs {filters.minPrice.toLocaleString()} - Rs{" "}
              {filters.maxPrice.toLocaleString()} x
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

