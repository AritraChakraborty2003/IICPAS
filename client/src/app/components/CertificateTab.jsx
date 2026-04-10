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

  const handleDownload = (courseTitle) => {
    // In a real application, this would trigger a download of a generated PDF
    // For now, we use the fallback image or a placeholder behavior
    const link = document.createElement("a");
    link.href = "/certificate.jpeg";
    link.download = `Certificate_${courseTitle.replace(/\s+/g, "_")}.jpeg`;
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
                  Exlpore Courses
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header for the list */}
                <div className="hidden md:grid grid-cols-[1fr_140px_220px] gap-6 px-8 py-4 bg-white/5 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-gray-500">
                  <div>Course Title</div>
                  <div className="text-center">Completion Status</div>
                  <div className="text-right">Action</div>
                </div>

                {courses.map((cur) => {
                  const course = extractCourseRecord(cur);
                  const progress = progressMap[course._id] || 0;
                  const isCompleted = progress >= 100;

                  return (
                    <div
                      key={course._id}
                      className="group bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-blue-500/20 hover:bg-[#1e293b] transition-all duration-300"
                    >
                      <div className="flex flex-col md:grid md:grid-cols-[1fr_140px_220px] items-center gap-4 px-6 py-5 md:px-8">
                        {/* Course Title */}
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                            <FaCertificate />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                        </div>

                        {/* Progress Badge */}
                        <div className="flex flex-col items-center gap-1.5 w-full md:w-auto">
                          <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                          }`}>
                            {isCompleted ? "Fully Completed" : `${progress}% Progress`}
                          </div>
                          {!isCompleted && (
                            <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                          <button
                            onClick={() => setSelectedCertificate({ course, isCompleted, progress })}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg font-bold text-xs hover:bg-blue-600 hover:text-white transition-all active:scale-95 border border-white/10"
                          >
                            <FaEye className="text-[10px]" />
                            View
                          </button>
                          
                          <button
                            onClick={() => isCompleted && handleDownload(course.title)}
                            disabled={!isCompleted}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all active:scale-95 border ${
                              isCompleted 
                                ? "bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600 hover:text-white" 
                                : "bg-gray-800/30 text-gray-600 border-white/5 cursor-not-allowed opacity-50"
                            }`}
                          >
                            <FaDownload className="text-[10px]" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
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
                  onClick={() => selectedCertificate.isCompleted && handleDownload(selectedCertificate.course.title)}
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
                    src="/certificate.jpeg"
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
