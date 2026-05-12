"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

const SpecialOfferFlashCard = ({
  location = "admin_dashboard",
  maxCards = 3,
  onClose,
}) => {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [hasFetchedOffers, setHasFetchedOffers] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchActiveOffers();
  }, [location]);

  useEffect(() => {
    if (offers.length > 0) {
      setIsVisible(true);
    }
  }, [offers]);

  const fetchActiveOffers = async () => {
    setHasFetchedOffers(false);
    setIsVisible(false);
    try {
      console.log("Fetching offers for location:", location);
      console.log("API_BASE:", API_BASE);
      const response = await axios.get(
        `${API_BASE}/special-offers/active?location=${location}`
      );
      console.log("API Response:", response.data);
      setOffers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching active special offers:", error);
    } finally {
      setHasFetchedOffers(true);
    }
  };

  const handleCloseCard = (offerId) => {
    setIsVisible(false);
    setTimeout(() => {
      setOffers((prev) => prev.filter((offer) => offer._id !== offerId));
      if (onClose) {
        onClose(offerId);
      }
    }, 300);
  };

  const handleGetNowClick = (offerId) => {
    handleCloseCard(offerId);
    setTimeout(() => {
      router.push("/course");
    }, 300);
  };

  const handleWhatsAppShare = (offer) => {
    const shareText = `🎉 ${offer.title} - ${offer.description}\n\nGet up to 60% discount on courses at IICPA Institute!\n\nVisit: ${window.location.origin}/course\n\n#IICPAInstitute #CourseOffer #Education`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  if (!hasFetchedOffers || offers.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-orange-900/20 backdrop-blur-[1px]"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-md w-full">
        {offers.slice(0, maxCards).map((offer, index) => (
          <div
            key={offer._id}
            className={`relative transform transition-all duration-500 ease-out ${
              isVisible
                ? "scale-100 opacity-100 translate-y-0"
                : "scale-95 opacity-0 translate-y-8"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
              {/* 3D Card Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-orange-500/10 rounded-3xl"></div>

              {/* Close Button */}
              <button
                onClick={() => handleCloseCard(offer._id)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm"
              >
                <svg
                  className="w-4 h-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Celebration Icon with 3D Effect */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto relative">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg opacity-30 animate-pulse"></div>

                    {/* Icon Container */}
                    <div className="relative w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                      <div className="text-3xl animate-bounce">🎉</div>
                    </div>

                    {/* Floating Sparkles */}
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-sparkle"
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${20 + Math.random() * 60}%`,
                          animationDelay: `${Math.random() * 2}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Title with Gradient Text */}
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-pink-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
                  {offer.title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {offer.description}
                </p>

                {/* Time Remaining */}
                <div className="mb-6">
                  <div className="inline-block">
                    <div className="bg-gradient-to-r from-green-500 via-blue-500 to-green-600 text-white px-6 py-3 rounded-full font-bold text-sm transform hover:scale-105 transition-transform duration-200">
                      ⏰ {formatTimeRemaining(offer.expiryDate)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {/* Get Now Button with 3D Effect */}
                  <button
                    onClick={() => handleGetNowClick(offer._id)}
                    className="group relative w-full bg-gradient-to-r from-green-500 via-blue-500 to-green-600 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transform hover:scale-105 hover:shadow-3xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Button Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-green-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>

                    {/* Button Content */}
                    <div className="relative flex items-center justify-center space-x-2">
                      <span>GET NOW</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </button>

                  {/* WhatsApp Share Button */}
                  <button
                    onClick={() => handleWhatsAppShare(offer)}
                    className="group w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 mx-auto"
                    title="Share on WhatsApp"
                  >
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <svg
                      className="relative w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes sparkle {
          0%,
          100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default SpecialOfferFlashCard;
