"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  FaDownload, 
  FaEye, 
  FaLock, 
  FaCertificate,
  FaCheckCircle,
  FaExternalLinkAlt
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

const extractCourseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.data?.courses)) return payload.data.courses;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractCourseRecord = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (payload.course && typeof payload.course === "object") return payload.course;
  if (payload.data?.course && typeof payload.data.course === "object") {
    return payload.data.course;
  }
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  return payload;
};

const getCertificateImage = () => "/single-certificate.jpg";

export default function CertificateTab() {
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({});
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const fetchStudentAndCourses = useCallback(async () => {
    try {
      setLoading(true);
      const studentRes = await axios.get(`${API}/api/v1/students/isstudent`, {
        withCredentials: true,
      });

      if (studentRes.data && studentRes.data.student) {
        const studentInfo = studentRes.data.student;
        setStudent(studentInfo);

        const coursesRes = await axios.get(
          `${API}/api/courses/student-courses/${studentInfo._id}`,
          { withCredentials: true }
        );

        const enrolledCourses = extractCourseList(coursesRes.data);
        setCourses(enrolledCourses);

        // Fetch group packages to know which course IDs belong to group packages
        try {
          const groupRes = await axios.get(`${API}/api/group-pricing`);
          const groups = Array.isArray(groupRes.data)
            ? groupRes.data
            : groupRes.data?.data || [];
          const ids = new Set();
          groups.forEach((g) =>
            (g.courseIds || []).forEach((c) =>
              ids.add(String(typeof c === "object" ? c._id : c))
            )
          );
          setGroupCourseIds(ids);
        } catch {
          // non-fatal — falls back to single certificate image
        }

        // Fetch progress for each course
        const progressPromises = enrolledCourses.map(async (course) => {
          const courseDetail = extractCourseRecord(course);
          const courseId = courseDetail?._id;
          if (!courseId) return null;

          try {
            const progressRes = await axios.get(
              `${API}/api/v1/students/${studentInfo._id}/digital-hub-progress/${courseId}`,
              { withCredentials: true }
            );
            return {
              courseId,
              progress: progressRes.data?.overallProgress || 0
            };
          } catch (err) {
            console.error(`Error fetching progress for course ${courseId}:`, err);
            return { courseId, progress: 0 };
          }
        });

        const results = await Promise.all(progressPromises);
        const newProgressMap = {};
        results.forEach((res) => {
          if (res) newProgressMap[res.courseId] = res.progress;
        });
        setProgressMap(newProgressMap);
      }
    } catch (error) {
      console.error("Error fetching certificates data:", error);
      toast.error("Failed to load course information");
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchStudentAndCourses();
  }, [fetchStudentAndCourses]);

  const handleDownload = (courseId, courseTitle) => {
    const link = document.createElement("a");
    link.href = getCertificateImage(courseId, groupCourseIds);
    link.download = `Certificate_${courseTitle.replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Certificate download started!");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Loading your achievements...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8 bg-[#0f172a] text-white">
      <div className="max-w-7xl mx-auto">
        {!selectedCertificate ? (
          <>
            <header className="mb-10">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Your Certificates
              </h1>
              <p className="text-gray-400 mt-2">
                View and download certificates for your completed courses.
              </p>
            </header>

            {courses.length === 0 ? (
              <div className="text-center py-20 bg-[#1e293b] rounded-2xl border border-gray-800 shadow-xl">
                <FaCertificate className="text-6xl text-gray-700 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Courses Enrolled</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Enroll in professional courses to start earning certificates and boosting your career.
                </p>
                <button
                  onClick={() => (window.location.href = "/student-dashboard")}
                  className="px-8 py-3 bg-blue-600 rounded-full font-semibold hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20"
                >
                  Explore Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {courses.map((cur) => {
                  const course = extractCourseRecord(cur);
                  const progress = progressMap[course._id] || 0;
                  const isCompleted = progress >= 100;

                  return (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      className="group relative flex flex-col bg-[#1e293b]/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.2)] transition-all duration-500"
                    >
                      {/* Card Header Preview */}
                      <div 
                        className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                        onClick={() => setSelectedCertificate({ course, isCompleted, progress })}
                      >
                        <img
                          src={getCertificateImage(course._id, groupCourseIds)}
                          alt={course.title}
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                            !isCompleted ? "blur-[2px] grayscale opacity-40 shrink-0" : "shrink-0"
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent opacity-80" />
                        
                        {!isCompleted && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <div className="w-12 h-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl mb-3">
                              <FaLock className="text-amber-500 text-xl" />
                            </div>
                            <div className="bg-amber-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/20">
                              <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">Locked Preview</span>
                            </div>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-md p-2 rounded-xl border border-emerald-500/20 shadow-xl">
                            <FaCheckCircle className="text-emerald-400 text-lg" />
                          </div>
                        )}
                        
                        {/* Progress Bar overlay at the bottom of the image area for incomplete */}
                        {!isCompleted && (
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="flex justify-between items-end mb-1.5 px-1">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Progress</span>
                              <span className="text-[10px] font-black text-amber-500">{progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000" 
                                style={{ width: `${progress}%` }} 
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div className="mb-4">
                          <h3 className="text-base font-bold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">
                            {course.title}
                          </h3>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <button
                            onClick={() => setSelectedCertificate({ course, isCompleted, progress })}
                            className="flex items-center gap-2 group/btn"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all shadow-lg shadow-blue-900/10">
                              <FaEye className="text-sm" />
                            </div>
                            <span className="text-xs font-bold text-gray-400 group-hover/btn:text-white transition-colors">View Certificate</span>
                          </button>

                          <button
                             onClick={(e) => {
                               e.stopPropagation();
                               if (isCompleted) handleDownload(course._id, course.title);
                             }}
                             disabled={!isCompleted}
                             className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                               isCompleted 
                               ? "bg-white/5 text-gray-400 hover:bg-emerald-600 hover:text-white border border-white/10 hover:border-transparent" 
                               : "bg-gray-800/30 text-gray-600 cursor-not-allowed opacity-30"
                             }`}
                             title={isCompleted ? "Download Certificate" : "Complete course to download"}
                          >
                            <FaDownload className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="relative w-full bg-[#1e293b] rounded-[2rem] border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden scale-in-95 group/modal animate-in fade-in zoom-in duration-300">
            {/* Action Bar */}
            <div className="flex items-center justify-between p-6 sm:px-10 border-b border-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedCertificate(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <FaCertificate className="text-blue-400" />
                    {selectedCertificate.course.title}
                  </h2>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => selectedCertificate.isCompleted && handleDownload(selectedCertificate.course._id, selectedCertificate.course.title)}
                  disabled={!selectedCertificate.isCompleted}
                  className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 border ${
                    selectedCertificate.isCompleted 
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40" 
                      : "bg-gray-800/50 text-gray-500 border-white/5 cursor-not-allowed opacity-50"
                  }`}
                >
                  <FaDownload />
                  Download
                </button>

                <button 
                  onClick={() => setSelectedCertificate(null)}
                  className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all active:scale-95 border border-white/10"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="relative min-h-[500px] flex items-center justify-center bg-black/20 p-6 sm:p-10">
              <div className="max-w-4xl w-full">
                <div className="relative aspect-[1.414/1] rounded-2xl overflow-hidden bg-[#1e293b] shadow-2xl border border-white/5 transition-all duration-500">
                  <img
                    src={getCertificateImage(selectedCertificate.course._id, groupCourseIds)}
                    alt="Full Certificate"
                    className={`w-full h-full object-contain transition-all duration-1000 ${
                      !selectedCertificate.isCompleted ? "blur-[3px] grayscale opacity-60 scale-105" : ""
                    }`}
                  />
                  
                  {!selectedCertificate.isCompleted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
                      <div className="bg-[#1e293b]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-3xl max-w-sm">
                        <FaLock className="text-4xl text-amber-500 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-3">Locked Preview</h3>
                        <p className="text-gray-400 mb-6 leading-relaxed text-sm">
                          Please complete full course to unlock the verified certificate for <span className="text-blue-400 block mt-1 font-semibold">{selectedCertificate.course.title}</span>.
                        </p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                            <span>Progress</span>
                            <span className="text-amber-500">{selectedCertificate.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${selectedCertificate.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
