import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface CourseNotFoundProps {
  courseId: string;
  title?: string;
  description?: string;
}

export default function CourseNotFound({
  courseId,
  title = "Course Not Found",
  description = "The course you're looking for doesn't exist or is not available right now.",
}: CourseNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-48 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 sm:p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 mx-auto mb-5 flex items-center justify-center text-2xl">
              !
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {title}
            </h1>
            <p className="text-gray-600 mb-2">{description}</p>
            <p className="text-sm text-gray-500 mb-8">Course ID: {courseId}</p>
            <Link
              href="/course"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#3cd664] text-white font-semibold hover:bg-[#34be59] transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
