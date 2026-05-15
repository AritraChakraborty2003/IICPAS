"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatTextAsParagraphs } from "@/lib/blogUtils";

const normalizeImageSrc = (rawImage, apiUrl) => {
  if (!rawImage || typeof rawImage !== "string") return null;

  const safeApiOrigin = (() => {
    const fallback = "https://api.iicpa.in";
    if (!apiUrl || typeof apiUrl !== "string") return fallback;
    const trimmed = apiUrl.trim();
    if (!trimmed) return fallback;
    if (
      trimmed.includes("localhost") ||
      trimmed.includes("127.0.0.1") ||
      trimmed.includes("0.0.0.0")
    ) {
      return fallback;
    }
    return trimmed.replace(/^http:\/\//i, "https://").replace(/\/+$/, "");
  })();

  const value = rawImage.trim();

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:\/\//i, "https://");
  }

  if (value.startsWith("/uploads/")) {
    return `${safeApiOrigin}${value}`;
  }

  if (value.startsWith("/")) return value;

  return `${safeApiOrigin}/${value.replace(/^\/+/, "")}`;
};

export default function GroupCourseCard({
  groupPricing,
  index,
  onPrimaryAction = null,
  ctaLabel = "Enroll →",
  isLoading = false,
  hidePrice = false,
}) {
  const router = useRouter();
  const imageSrc = normalizeImageSrc(
    groupPricing.image,
    process.env.NEXT_PUBLIC_API_URL
  );

  const handleClick = () => {
    // Use slug if available, otherwise fall back to ID
    const identifier = groupPricing.slug || groupPricing._id;
    router.push(`/group-package/${identifier}`);
  };

  return (
    <motion.div
      key={groupPricing._id || index}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 ease-in-out group cursor-pointer relative"
      onClick={handleClick}
    >
      {/* Banner Image Section */}
      <div className="relative h-48 w-full rounded-t-xl overflow-hidden bg-white">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`${
              groupPricing.groupName || groupPricing.level
            } Group Package`}
            fill
            unoptimized
            className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={index < 2}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const placeholder = e.currentTarget.nextElementSibling;
              if (placeholder) {
                placeholder.style.display = "flex";
              }
            }}
          />
        ) : null}

        {/* Fallback placeholder */}
        <div
          className={`w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-green-100 to-blue-100 ${
            imageSrc ? "hidden" : ""
          }`}
          style={{ display: imageSrc ? "none" : "flex" }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm font-medium">Group Package</div>
          </div>
        </div>

        {/* Group Badge */}
        <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {groupPricing.groupName || groupPricing.level}
        </div>

        {/* Course Count Badge */}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <span>📚</span>
          <span>{groupPricing.courseIds?.length || 0}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3">
        {/* Level */}
        <p className="text-sm text-gray-500 font-medium">Group Package</p>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2">
          {groupPricing.groupName || groupPricing.level}
        </h3>

        {/* Description */}
        {groupPricing.description && (
          <div
            className="text-sm text-gray-600 line-clamp-2"
            dangerouslySetInnerHTML={{
              __html: formatTextAsParagraphs(groupPricing.description),
            }}
          />
        )}

        {/* Course Count Display */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span>📚</span>
              <span className="font-medium">
                {groupPricing.courseIds?.length || 0} courses
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span className="font-medium">3 weeks</span>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* Calculate smallest price from all pricing options */}
            {(() => {
              const prices = [
                groupPricing.pricing?.recordedSession?.finalPrice,
                groupPricing.pricing?.liveSession?.finalPrice,
                groupPricing.pricing?.recordedSessionCenter?.finalPrice,
                groupPricing.pricing?.liveSessionCenter?.finalPrice,
              ].filter((price) => price && typeof price === "number");

              const smallestPrice =
                prices.length > 0
                  ? Math.min(...prices)
                  : groupPricing.groupPrice;
              const originalPrice = groupPricing.groupPrice;
              const hasDiscount = smallestPrice < originalPrice;

              return (
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-green-600 font-semibold text-sm">
                      {hidePrice
                        ? "₹ (login to view)"
                        : `₹${smallestPrice?.toLocaleString() || "0"}`}
                    </p>
                    {!hidePrice && hasDiscount && (
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                        SAVE ₹{(originalPrice - smallestPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {!hidePrice && hasDiscount && (
                    <p className="text-gray-400 text-xs line-through">
                      ₹{originalPrice?.toLocaleString() || "0"}
                    </p>
                  )}
                  <p className="text-gray-400 text-[11px] leading-tight">
                    {hidePrice
                      ? "Login to view package pricing."
                      : hasDiscount
                      ? "Limited time offer!"
                      : "Complete package price"}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Enroll Button */}
          <button
            className="bg-gray-900 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex-shrink-0"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              if (onPrimaryAction) {
                onPrimaryAction(groupPricing);
                return;
              }
              const identifier = groupPricing.slug || groupPricing._id;
              router.push(`/group-package/${identifier}`);
            }}
          >
            {isLoading ? "Processing..." : ctaLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
