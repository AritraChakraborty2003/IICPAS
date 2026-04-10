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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((cur) => {
              const course = extractCourseRecord(cur);
              const progress = progressMap[course._id] || 0;
              const isCompleted = progress >= 100;

              return (
                <div
                  key={course._id}
                  className="group bg-[#1e293b] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl transition-all duration-300 hover:border-blue-500/30 hover:shadow-blue-900/10"
                >
                  {/* Certificate Preview Container */}
                  <div className="relative aspect-[1.414/1] bg-gray-900 overflow-hidden">
                    <img
                      src="/certificate.jpeg"
                      alt="Certificate Preview"
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        !isCompleted ? "blur-sm grayscale opacity-40 scale-105" : "group-hover:scale-110"
                      }`}
                    />
                    
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />

                    {!isCompleted && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="bg-gray-900/80 backdrop-blur-md p-4 rounded-full mb-3 shadow-2xl border border-white/10">
                          <FaLock className="text-2xl text-amber-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1 shadow-black drop-shadow-lg">
                          Locked
                        </h4>
                        <p className="text-sm text-gray-300 font-medium drop-shadow-md">
                          Please complete full course
                        </p>
                        
                        {/* Progress Indicator */}
                        <div className="mt-4 w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-2 font-bold">
                          Current Progress: {progress}%
                        </span>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="absolute inset-x-0 bottom-0 p-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <div className="bg-emerald-500/10 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                           <FaCheckCircle className="text-emerald-400 text-xs" />
                           <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Completed</span>
                         </div>
                      </div>
                    )}
                  </div>

                  {/* Course Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-100 mb-4 line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h3>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedCertificate({ course, isCompleted, progress })}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          isCompleted 
                            ? "bg-gray-800 text-white hover:bg-gray-700" 
                            : "bg-gray-800/50 text-gray-500 border border-white/5 cursor-not-allowed"
                        }`}
                      >
                        <FaEye />
                        View
                      </button>
                      
                      <button
                        onClick={() => isCompleted && handleDownload(course.title)}
                        disabled={!isCompleted}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                          isCompleted 
                            ? "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-900/40" 
                            : "bg-gray-800/30 text-gray-600 border border-white/5 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <FaDownload />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Certificate Viewer Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-gray-950/40 transition-all">
          <div 
            className="absolute inset-0" 
            onClick={() => setSelectedCertificate(null)}
          />
          
          <div className="relative w-full max-w-5xl bg-[#1e293b] rounded-[2rem] border border-white/10 shadow-[0_0_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden scale-in-95 group/modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:px-10 border-b border-white/5">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FaCertificate className="text-blue-400" />
                  {selectedCertificate.course.title}
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-400">Course Completion ID: cert_{selectedCertificate.course._id.slice(-6)}</span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${
                    selectedCertificate.isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {selectedCertificate.isCompleted ? "Verified" : "Pending"}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCertificate(null)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all transform hover:rotate-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-10 flex flex-col lg:flex-row gap-10">
              {/* Content Area */}
              <div className="lg:w-2/3 relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 group-hover/modal:shadow-blue-900/20 transition-all duration-500">
                <img
                  src="/certificate.jpeg"
                  alt="Full Certificate"
                  className={`w-full h-auto transition-all duration-1000 ${
                    !selectedCertificate.isCompleted ? "blur-xl grayscale opacity-30 scale-110" : "group-hover/modal:scale-[1.02]"
                  }`}
                />
                
                {!selectedCertificate.isCompleted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
                    <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-3xl max-w-sm">
                      <FaLock className="text-5xl text-amber-400 mx-auto mb-6" />
                      <h3 className="text-2xl font-bold mb-3">Preview Restricted</h3>
                      <p className="text-gray-400 mb-6 leading-relaxed">
                        Complete your course to unlock the officially verified certificate for <span className="text-blue-400">{selectedCertificate.course.title}</span>.
                      </p>
                      <div className="bg-white/5 p-4 rounded-xl">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                          <span>Current Progress</span>
                          <span className="text-amber-400">{selectedCertificate.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400" style={{ width: `${selectedCertificate.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Sidebar */}
              <div className="lg:w-1/3 flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                    <h4 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                       <FaExternalLinkAlt className="text-xs" />
                       Verification Details
                    </h4>
                    <div className="space-y-3">
                       <div className="flex justify-between text-sm py-2 border-b border-white/5">
                         <span className="text-gray-500">Status</span>
                         <span className={selectedCertificate.isCompleted ? "text-emerald-400" : "text-amber-400"}>
                           {selectedCertificate.isCompleted ? "Completed" : "In Progress"}
                         </span>
                       </div>
                       <div className="flex justify-between text-sm py-2 border-b border-white/5">
                         <span className="text-gray-500">Issued On</span>
                         <span className="text-gray-300">{selectedCertificate.isCompleted ? new Date().toLocaleDateString() : "-- -- --"}</span>
                       </div>
                       <div className="flex justify-between text-sm py-2 border-b border-white/5">
                         <span className="text-gray-500">Provider</span>
                         <span className="text-gray-300">IICPA Institute</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {selectedCertificate.isCompleted ? (
                      <>
                        <button
                          onClick={() => handleDownload(selectedCertificate.course.title)}
                          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1"
                        >
                          <FaDownload />
                          Download Certificate
                        </button>
                        <p className="text-center text-xs text-gray-500 px-6 leading-relaxed">
                          By downloading this certificate, you agree to our terms of academic integrity.
                        </p>
                      </>
                    ) : (
                      <button
                        onClick={() => (window.location.href = `/digital-hub/${selectedCertificate.course.slug || selectedCertificate.course._id}`)}
                        className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-[1.5rem] font-bold text-lg hover:from-amber-400 hover:to-orange-500 transition-all shadow-xl shadow-orange-900/40 hover:-translate-y-1"
                      >
                        <FaExternalLinkAlt />
                        Continue Learning
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
