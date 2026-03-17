"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import Marquee from "react-fast-marquee";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaUsers,
  FaStar,
  FaBookOpen,
} from "react-icons/fa";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

interface Center {
  id: string;
  name: string;
  city: string;
  state: string;
  location: string;
  phone: string;
  email: string;
  rating: number;
  students: number;
  courses: number;
  image: string;
  availableCourses: string[];
  status: string;
  facilities: string[];
  description: string;
}

const PARTNER_ITEMS = [
  "Our Partners",
  "Triostack",
  "Industry Network",
  "Hiring Partners",
  "Placement Ecosystem",
  "Training Alliances",
  "Business Collaborators",
];

export default function SearchCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [centers, setCenters] = useState<Center[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch centers from API
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/v1/centers/public`);
        const centersData = response.data.data || [];

        // Transform API data to match component structure
        const transformedCenters = centersData.map(
          (center: any, index: number) => ({
            id: center._id,
            name: center.name,
            city: center.city,
            state: center.state,
            location: `${center.address}, ${center.city}, ${center.state} - ${center.pincode}`,
            phone: center.phone,
            email: center.email,
            rating: 4.5, // Default rating since API doesn't have ratings yet
            students: center.capacity || 50, // Use capacity as student count
            courses: center.courses?.length || 0,
            image: "/images/college.jpg", // Default image
            availableCourses:
              center.courses?.map((course: any) => course.title) || [],
            status: center.status,
            facilities: center.facilities || [],
            description: center.description || "",
          })
        );

        console.log("Transformed centers:", transformedCenters);
        console.log("Available cities:", [
          ...new Set(transformedCenters.map((center: Center) => center.city)),
        ]);
        console.log("Available states:", [
          ...new Set(transformedCenters.map((center: Center) => center.state)),
        ]);
        console.log("Sample center data:", transformedCenters[0]);

        setCenters(transformedCenters);
        setFilteredCenters([]); // Don't show any centers initially
        setHasSearched(false); // Don't show results until user searches
      } catch (error) {
        console.error("Error fetching centers:", error);
        // Fallback to empty array if API fails
        console.log("API failed, using fallback data for testing");

        // Add some test data for debugging
        const testCenters = [
          {
            id: "test1",
            name: "IICPA Delhi Center",
            city: "Delhi",
            state: "Delhi",
            location: "Connaught Place, Delhi - 110001",
            phone: "+91-11-12345678",
            email: "delhi@iicpa.com",
            rating: 4.5,
            students: 150,
            courses: 5,
            image: "/images/college.jpg",
            availableCourses: ["CA Foundation", "CA Intermediate", "CA Final"],
            status: "active",
            facilities: ["Library", "Computer Lab"],
            description: "Premier CA coaching center in Delhi",
          },
          {
            id: "test2",
            name: "IICPA Mumbai Center",
            city: "Mumbai",
            state: "Maharashtra",
            location: "Andheri West, Mumbai - 400058",
            phone: "+91-22-87654321",
            email: "mumbai@iicpa.com",
            rating: 4.8,
            students: 200,
            courses: 6,
            image: "/images/college.jpg",
            availableCourses: [
              "CA Foundation",
              "CA Intermediate",
              "CA Final",
              "CS Foundation",
            ],
            status: "active",
            facilities: ["Library", "Computer Lab", "Auditorium"],
            description: "Leading CA coaching center in Mumbai",
          },
        ];

        setCenters(testCenters);
        setFilteredCenters([]); // Don't show any centers initially
        setHasSearched(false); // Don't show results until user searches
      } finally {
        setLoading(false);
      }
    };

    fetchCenters();
  }, []);

  // Define handleSearch function before using it in useEffect
  const handleSearch = useCallback(() => {
    console.log("Search triggered!");
    console.log("Search term:", searchTerm);
    console.log("Selected location:", selectedLocation);
    console.log("Selected course:", selectedCourse);
    console.log("Available centers:", centers.length);

    setHasSearched(true);
    let filtered = centers;

    if (searchTerm) {
      filtered = filtered.filter(
        (center) =>
          center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          center.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          center.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          center.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLocation && selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (center) =>
          center.state === selectedLocation || center.city === selectedLocation
      );
    }

    if (selectedCourse && selectedCourse !== "All Courses") {
      filtered = filtered.filter((center) =>
        center.availableCourses.includes(selectedCourse)
      );
    }

    console.log("Filtered centers:", filtered.length);
    setFilteredCenters(filtered);
  }, [searchTerm, selectedLocation, selectedCourse, centers]);

  // Auto-search when search parameters change (only after user has searched at least once)
  useEffect(() => {
    if (centers.length > 0 && hasSearched) {
      console.log("Auto-search triggered due to parameter change");
      handleSearch();
    }
  }, [handleSearch, hasSearched]);

  // Dynamic locations from centers data
  const locations = [
    "All Locations",
    ...Array.from(
      new Set([
        ...centers.map((center: Center) => center.city).filter(Boolean),
        ...centers.map((center: Center) => center.state).filter(Boolean),
      ])
    ),
  ];

  // Add fallback locations if no centers are loaded
  const fallbackLocations = [
    "All Locations",
    "Delhi",
    "Mumbai",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ];

  const finalLocations = locations.length > 1 ? locations : fallbackLocations;

  // Dynamic courses from centers data
  const courses = [
    "All Courses",
    ...Array.from(
      new Set(
        centers
          .flatMap((center: Center) => center.availableCourses)
          .filter(Boolean)
      )
    ),
  ];

  const handleBookCourse = (centerId: string, courseName: string) => {
    // This would typically redirect to a booking page or open a modal
    console.log(`Booking ${courseName} at center ${centerId}`);
    // You can implement the booking logic here
  };

  if (loading) {
    return (
      <section className="relative py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading centers...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <style jsx>{`
        input,
        select,
        button {
          pointer-events: auto !important;
          cursor: pointer !important;
          position: relative;
          z-index: 10;
        }
        .search-container input,
        .search-container select,
        .search-container button {
          pointer-events: auto !important;
          position: relative;
          z-index: 10;
        }
        input[type="text"] {
          padding-left: 5rem !important;
        }
        select {
          padding-left: 3.5rem !important;
        }
        .absolute {
          position: absolute;
          z-index: 10 !important;
        }
        .search-container:hover .absolute {
          opacity: 1 !important;
          visibility: visible !important;
        }
        input,
        select {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .search-container:hover input,
        .search-container:hover select {
          filter: none !important;
          backdrop-filter: none !important;
        }
      `}</style>
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-green-100/30 to-blue-100/30 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-green-100/30 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            x: [0, -10, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
            <span className="text-green-600 font-bold text-sm uppercase tracking-wider">
              Find Your Nearest Center
            </span>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
          </motion.div>

          <motion.h2
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Search & Book
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              {" "}
              Courses
            </span>{" "}
            at
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {" "}
              IICPA Centers
            </span>
          </motion.h2>

          <motion.p
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Find the nearest IICPA center, explore available courses, and book
            your preferred training program with just a few clicks.
          </motion.p>
        </motion.div>

        {/* 3D Search Filters */}
        <motion.div
          className="search-container bg-white/95 rounded-3xl shadow-2xl p-8 mb-12 border border-gray-200/50 transform-gpu"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            transform: "translateZ(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="grid md:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white bg-green-500 p-2 rounded-lg shadow-lg z-10 pointer-events-none">
                <FaSearch
                  className="text-sm font-bold"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <input
                type="text"
                placeholder="Search centers..."
                value={searchTerm}
                onChange={(e) => {
                  console.log("Search term changed to:", e.target.value);
                  setSearchTerm(e.target.value);
                  console.log("Search term state updated");
                }}
                className="w-full pl-20 pr-4 py-4 border border-gray-300/50 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-all duration-300 hover:bg-white hover:border-green-400 hover:shadow-lg hover:shadow-green-100 hover:scale-[1.02]"
                style={{ pointerEvents: "auto", zIndex: 10 }}
              />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white bg-blue-500 p-2 rounded-lg shadow-lg z-10 pointer-events-none">
                <FaMapMarkerAlt
                  className="text-sm font-bold"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  console.log("Location changed to:", e.target.value);
                  setSelectedLocation(e.target.value);
                  console.log("Location state updated");
                }}
                className="w-full pl-14 pr-4 py-4 border border-gray-300/50 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-300 hover:bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 hover:scale-[1.02] cursor-pointer"
                aria-label="Select location"
                title="Select location"
                disabled={loading}
                style={{ pointerEvents: "auto", zIndex: 10 }}
              >
                {loading ? (
                  <option value="">Loading locations...</option>
                ) : (
                  finalLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Course Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white bg-purple-500 p-2 rounded-lg shadow-lg z-10 pointer-events-none">
                <FaBookOpen
                  className="text-sm font-bold"
                  style={{ fontSize: "14px" }}
                />
              </div>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  console.log("Course changed to:", e.target.value);
                  setSelectedCourse(e.target.value);
                }}
                className="w-full pl-14 pr-4 py-4 border border-gray-300/50 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-300 hover:bg-white hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100 hover:scale-[1.02] cursor-pointer"
                aria-label="Select course"
                title="Select course"
                style={{ pointerEvents: "auto", zIndex: 10 }}
              >
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Search button clicked!");
                console.log("Current search term:", searchTerm);
                console.log("Current selected location:", selectedLocation);
                console.log("Current selected course:", selectedCourse);
                handleSearch();
              }}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl cursor-pointer"
              style={{
                pointerEvents: "auto",
                zIndex: 1000,
                position: "relative",
              }}
            >
              Search Centers
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mb-16 overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#f8fbff_0%,#eef7ff_100%)] shadow-[0_18px_44px_rgba(15,23,42,0.08)]"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <div className="border-b border-slate-200/80 px-6 py-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-700">
              Our Partners
            </p>
          </div>

          <Marquee
            speed={55}
            gradient={false}
            pauseOnHover
            className="px-2 py-5"
          >
            {PARTNER_ITEMS.map((partner, index) => (
              <div
                key={`${partner}-${index}`}
                className="mx-3 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-green-500 to-blue-500" />
                <span className="text-sm font-semibold text-slate-700">
                  {partner}
                </span>
              </div>
            ))}
          </Marquee>
        </motion.div>

        {/* Results - Only show if search has been performed */}
        {hasSearched && (
          <div className="space-y-6">
            {filteredCenters.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  No Centers Found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or contact us for
                  assistance.
                </p>
              </div>
            ) : (
              filteredCenters.map((center) => (
                <div
                  key={center.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="grid lg:grid-cols-3 gap-6 p-8">
                    {/* Center Image */}
                    <div className="relative">
                      <img
                        src={center.image}
                        alt={center.name}
                        className="w-full h-48 object-cover rounded-xl"
                        onError={(e) => {
                          e.target.src = "/images/college.jpg";
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {center.rating} ⭐
                      </div>
                    </div>

                    {/* Center Info */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {center.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <FaMapMarkerAlt className="text-green-500" />
                          <span>{center.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <FaPhone className="text-green-500" />
                          <span>{center.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaEnvelope className="text-green-500" />
                          <span>{center.email}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {center.students}
                          </div>
                          <div className="text-sm text-gray-600">Students</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {center.courses}
                          </div>
                          <div className="text-sm text-gray-600">Courses</div>
                        </div>
                      </div>
                    </div>

                    {/* Available Courses & Booking */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Available Courses
                        </h4>
                        <div className="space-y-2">
                          {center.availableCourses.map(
                            (course: string, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                              >
                                <span className="text-gray-700 font-medium">
                                  {course}
                                </span>
                                <button
                                  onClick={() =>
                                    handleBookCourse(center.id, course)
                                  }
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300"
                                >
                                  Book Now
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Quick Contact */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          Need Help?
                        </h5>
                        <p className="text-sm text-gray-600 mb-3">
                          Contact this center directly for personalized
                          assistance.
                        </p>
                        <Link
                          href={`tel:${center.phone}`}
                          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300"
                        >
                          <FaPhone />
                          Call Center
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-gpu {
          transform-style: preserve-3d;
        }
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        .hover\\:scale-110:hover {
          transform: scale(1.1);
        }
        .hover\\:scale-\\[1\\.02\\]:hover {
          transform: scale(1.02);
        }

        /* Ensure text remains crisp */
        input,
        select {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Prevent blur on hover */
        .search-container:hover input,
        .search-container:hover select {
          filter: none !important;
          backdrop-filter: none !important;
        }

        /* Icon positioning fixes */
        .relative {
          position: relative;
        }

        /* Ensure icons stay visible and don't overlap */
        .absolute {
          position: absolute;
          z-index: 10 !important;
        }

        /* Prevent icon hiding on hover */
        .search-container:hover .absolute {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Ensure proper spacing for icons */
        input[type="text"] {
          padding-left: 5rem !important;
        }

        select {
          padding-left: 3.5rem !important;
        }

        /* Ensure all interactive elements are clickable */
        button,
        input,
        select {
          pointer-events: auto !important;
          cursor: pointer !important;
        }

        /* Override any motion component interference */
        .search-container button,
        .search-container input,
        .search-container select {
          pointer-events: auto !important;
          position: relative;
          z-index: 10;
        }

        /* Ensure motion components don't block clicks */
        [data-framer-motion] {
          pointer-events: auto !important;
        }
      `}</style>
    </section>
  );
}
