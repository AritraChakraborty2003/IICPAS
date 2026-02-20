"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FaPlayCircle, FaBookOpen, FaCalculator, FaChartBar, FaFileAlt, FaVideo, FaDownload, FaEye, FaTimes } from "react-icons/fa";

// Utility function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  return html ? html.replace(/<[^>]*>/g, '') : '';
};

interface DemoData {
  mainSection?: {
    title: string;
    subtitle: string;
    ctaTitle: string;
    ctaDescription: string;
    ctaButton1: { text: string; link: string };
    ctaButton2: { text: string; link: string };
  };
  materials?: Array<{
    icon: string;
    title: string;
    description: string;
    feature: string;
    link: string;
    contentType?: string;
    contentFile?: any;
    contentUrl?: string;
  }>;
  demos?: Array<any>;
}

interface SelectedDemo {
  title: string;
  description: string;
  duration: string;
  type: string;
  contentType?: string;
  contentFile?: any;
  contentUrl?: string;
}

interface Course {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  image?: string;
  level: string;
  category: string;
  price: number;
  status: string;
}

const DemoDigitalHubSection = () => {
  const router = useRouter();
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDemo, setSelectedDemo] = useState<SelectedDemo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const buildDemoHubPath = (course: Pick<Course, "_id" | "slug">) => {
    const identifier = course.slug || course._id;
    return `/digital-hub/demo/${encodeURIComponent(identifier)}`;
  };

  const iconMap = {
    FaPlayCircle: FaPlayCircle,
    FaBookOpen: FaBookOpen,
    FaCalculator: FaCalculator,
    FaChartBar: FaChartBar,
    FaFileAlt: FaFileAlt,
    FaVideo: FaVideo,
    FaDownload: FaDownload,
    FaEye: FaEye,
  };

  useEffect(() => {
    fetchData();
    fetchCourses();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/website/demo-digital-hub`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching demo digital hub data:", error);
      // Fallback to default data
      setData({
        mainSection: {
          title: "Interactive Course Demos",
          subtitle: "Experience our courses firsthand with interactive demos, sample lessons, and preview content designed to showcase our teaching methodology.",
          ctaTitle: "Ready to Experience Our Courses?",
          ctaDescription: "Join thousands of students who have discovered their potential through our comprehensive finance and accounting programs.",
          ctaButton1: { text: "Start Free Trial", link: "/student-login" },
          ctaButton2: { text: "View Course Catalog", link: "/course" }
        },
        materials: [
          {
            icon: "FaPlayCircle",
            title: "Video Demo Lessons",
            description: "Watch sample video lessons from our expert instructors covering key concepts in finance and accounting.",
            feature: "HD Quality Videos",
            link: "#video-demos"
          },
          {
            icon: "FaBookOpen",
            title: "Interactive Course Previews",
            description: "Explore interactive course modules and get a feel for our comprehensive curriculum structure.",
            feature: "Interactive Content",
            link: "#course-preview"
          },
          {
            icon: "FaCalculator",
            title: "Practice Problem Demos",
            description: "Try sample practice problems with step-by-step solutions to understand our teaching approach.",
            feature: "Step-by-Step Solutions",
            link: "#practice-demos"
          },
          {
            icon: "FaChartBar",
            title: "Case Study Samples",
            description: "Review real-world case studies and see how we apply theoretical knowledge to practical scenarios.",
            feature: "Real Industry Cases",
            link: "#case-studies"
          },
          {
            icon: "FaFileAlt",
            title: "Sample Study Materials",
            description: "Download sample notes, formula sheets, and reference materials to see the quality of our content.",
            feature: "High-Quality Materials",
            link: "#sample-materials"
          },
          {
            icon: "FaVideo",
            title: "Live Session Previews",
            description: "Experience snippets from our live interactive sessions and Q&A discussions.",
            feature: "Live Interaction",
            link: "#live-previews"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await axios.get(`${API}/api/courses/available`);
      
      if (response.data && response.data.length > 0) {
        setCourses(response.data);
      } else {
        // Fallback to sample courses if API fails
        setCourses([
          {
            _id: "1",
            title: "Basic Accounting & Tally Foundation",
            description: "Master the fundamentals of accounting with comprehensive training in modern accounting practices and Tally software. Learn double-entry bookkeeping, financial statement preparation, inventory management, and GST compliance. This course covers practical accounting scenarios, ledger maintenance, and automated accounting solutions. Gain expertise in taxation, banking procedures, and financial reporting standards. Prepare for real-world accounting challenges with hands-on practice and industry-relevant case studies.",
            level: "Foundation",
            category: "Accounting",
            price: 999,
            status: "Active"
          },
          {
            _id: "2",
            title: "HR Certification Course",
            description: "Comprehensive human resource management program covering recruitment, training, performance management, and employee relations. Learn modern HR practices, labor laws compliance, payroll management, and organizational development strategies. Master talent acquisition techniques, onboarding processes, and employee engagement methods. Understand compensation structures, benefits administration, and workplace diversity. Develop skills in conflict resolution, performance evaluation, and strategic HR planning for organizational success.",
            level: "Executive Level",
            category: "HR",
            price: 1200,
            status: "Active"
          },
          {
            _id: "3",
            title: "Excel Certification Course",
            description: "Complete Microsoft Excel mastery course covering basic functions to advanced data analysis and automation. Learn formulas, functions, pivot tables, data visualization, and VBA programming. Master advanced features like macros, conditional formatting, data validation, and complex analytical tools. Understand business intelligence concepts, dashboard creation, and automated reporting systems. Gain expertise in data modeling, statistical analysis, and professional spreadsheet design for business applications.",
            level: "Core",
            category: "Technology",
            price: 800,
            status: "Active"
          },
          {
            _id: "4",
            title: "Learn the Foundations of Visual Communication",
            description: "Master the principles of visual design and communication for modern marketing and media. Learn color theory, typography, layout design, and branding concepts. Understand design software tools, digital marketing graphics, and social media visual content creation. Develop skills in logo design, poster creation, and multimedia presentations. Explore user experience design, visual storytelling, and cross-platform design consistency. Build a professional portfolio showcasing your visual communication expertise.",
            level: "Foundation",
            category: "Design",
            price: 1500,
            status: "Active"
          },
          {
            _id: "5",
            title: "Cooking Made Easy: Essential Skills for Everyday Meals",
            description: "Learn essential culinary skills and techniques for preparing delicious, healthy meals at home. Master knife skills, cooking methods, meal planning, and kitchen organization. Understand ingredient selection, food safety practices, and nutritional meal preparation. Explore various cuisines, seasonal cooking, and dietary modifications. Develop confidence in creating balanced meals, managing cooking time, and reducing food waste. Transform your daily cooking experience with professional techniques and creative recipes.",
            level: "Foundation",
            category: "Lifestyle",
            price: 600,
            status: "Active"
          },
          {
            _id: "6",
            title: "How to Capture Stunning Photos with Ease",
            description: "Master photography fundamentals and advanced techniques for creating professional-quality images. Learn camera settings, composition rules, lighting techniques, and post-processing basics. Understand different photography genres including portraits, landscapes, events, and commercial photography. Develop skills in photo editing software, color correction, and digital workflow management. Explore creative photography concepts, storytelling through images, and building a photography portfolio. Transform your passion into professional photography skills with hands-on practice and expert guidance.",
            level: "Foundation",
            category: "Photography",
            price: 900,
            status: "Active"
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      // Keep fallback courses
    } finally {
      setCoursesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4 mx-auto max-w-md"></div>
            <div className="h-6 bg-gray-300 rounded mb-12 mx-auto max-w-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6">
                  <div className="h-12 bg-gray-300 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mainSection = data?.mainSection || {
    title: "Interactive Course Demos",
    subtitle: "Experience our courses firsthand with interactive demos, sample lessons, and preview content designed to showcase our teaching methodology.",
    ctaTitle: "Ready to Experience Our Courses?",
    ctaDescription: "Join thousands of students who have discovered their potential through our comprehensive finance and accounting programs.",
    ctaButton1: { text: "Start Free Trial", link: "/student-login" },
    ctaButton2: { text: "View Course Catalog", link: "/course" }
  };

  const handleDemoClick = (demo: SelectedDemo) => {
    setSelectedDemo(demo);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDemo(null);
  };

  const materials = data?.materials || data?.demos || [];

  return (
    <div className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Demo Courses Showcase Section */}
        <div className="mt-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Our{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Demo Courses
              </span>
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get a preview of our comprehensive course offerings with interactive demos and sample content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coursesLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-300 rounded-full w-24"></div>
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              ))
            ) : (
              courses.slice(0, 6).map((course: Course, index: number) => {
                const IconComponent = iconMap[materials[index]?.icon as keyof typeof iconMap] || FaPlayCircle;
                const colors = [
                  { bg: "from-blue-500 to-purple-600", text: "text-purple-600", button: "bg-purple-600 hover:bg-purple-700" },
                  { bg: "from-green-500 to-blue-600", text: "text-green-600", button: "bg-green-600 hover:bg-green-700" },
                  { bg: "from-red-500 to-orange-600", text: "text-red-600", button: "bg-red-600 hover:bg-red-700" },
                  { bg: "from-indigo-500 to-purple-600", text: "text-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700" },
                  { bg: "from-emerald-500 to-teal-600", text: "text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700" },
                  { bg: "from-amber-500 to-orange-600", text: "text-amber-600", button: "bg-amber-600 hover:bg-amber-700" }
                ];
                const colorScheme = colors[index % colors.length];
                
                return (
                  <div key={course._id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`bg-gradient-to-r ${colorScheme.bg} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                        {course.category}
                      </div>
                      <IconComponent className={`text-2xl ${colorScheme.text} group-hover:scale-110 transition-transform`} />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">{course.title}</h4>
                    <div className="text-gray-600 mb-4 text-sm leading-relaxed h-20 overflow-hidden">
                      <p>{stripHtmlTags(course.description)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Level:</span> {course.level}
                      </div>
                      <button 
                        className={`${colorScheme.button} text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium`}
                        onClick={() => {
                          // Navigate to digital hub with demo mode enabled using real course ID
                          router.push(buildDemoHubPath(course));
                        }}
                      >
                        Try Demo
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Demo Content Modal */}
      {showModal && selectedDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">{selectedDemo.title}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                title="Close modal"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {selectedDemo.type}
                  </span>
                  <span className="text-gray-600">
                    Duration: {selectedDemo.duration}
                  </span>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {selectedDemo.description}
                </p>
              </div>

              {/* Demo Content Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {selectedDemo.contentFile ? (
                  <div className="mb-4">
                    <FaFileAlt className="text-6xl text-green-500 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">
                      Demo Content Available
                    </h4>
                    <p className="text-gray-600 mb-6">
                      {selectedDemo.contentFile?.name} ({selectedDemo.contentType || 'PDF'})
                    </p>
                    <div className="bg-green-50 rounded-lg p-4 mb-6">
                      <p className="text-green-800 font-medium">
                        ✓ Content uploaded successfully
                      </p>
                      <p className="text-green-600 text-sm mt-1">
                        Click "View Content" to access the demo
                      </p>
                    </div>
                    <button 
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium mr-4"
                      onClick={() => {
                        closeModal();
                        // Use the first available course for demo
                        const demoCourse = courses.length > 0 ? courses[0] : null;
                        if (!demoCourse) return;
                        router.push(buildDemoHubPath(demoCourse));
                      }}
                    >
                      View Content
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 mb-2">
                      Demo Content Preview
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Upload demo content through the admin dashboard to view it here.
                    </p>
                  </div>
                )}
                
                {/* Sample content preview */}
                <div className="bg-gray-50 rounded-lg p-6 text-left">
                  <h5 className="font-semibold text-gray-800 mb-3">Sample Content Preview:</h5>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaPlayCircle className="text-blue-500" />
                      <span>Introduction to {selectedDemo.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBookOpen className="text-green-500" />
                      <span>Key Concepts and Principles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalculator className="text-purple-500" />
                      <span>Practical Examples and Exercises</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaChartBar className="text-orange-500" />
                      <span>Case Studies and Applications</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => {
                      closeModal();
                      // Use the first available course for demo
                      const demoCourse = courses.length > 0 ? courses[0] : null;
                      if (!demoCourse) return;
                      router.push(buildDemoHubPath(demoCourse));
                    }}
                  >
                    Start Demo Course
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoDigitalHubSection;
