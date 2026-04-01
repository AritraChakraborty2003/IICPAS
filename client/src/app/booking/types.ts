export type RawCourse = {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  image?: string;
  category?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  price?: number;
  discount?: number;
  pricing?: {
    recordedSession?: {
      price?: number;
      finalPrice?: number;
      discount?: number;
    };
    liveSession?: {
      price?: number;
      finalPrice?: number;
      discount?: number;
    };
  };
};

export type BookingCourse = {
  id: string;
  slug: string;
  title: string;
  image: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  recordedPrice: number | null;
  recordedOriginalPrice: number | null;
  livePrice: number | null;
  liveOriginalPrice: number | null;
  effectivePrice: number;
};

export type BookingSortOption =
  | "relevance"
  | "price-low-high"
  | "price-high-low"
  | "newest";

export type BookingFilterState = {
  search: string;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: BookingSortOption;
};

