import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-48 pb-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 mr-0 lg:mr-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-pulse">
                <div className="h-6 w-28 rounded-full bg-gray-200 mb-5" />
                <div className="h-10 w-4/5 rounded bg-gray-200 mb-5" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-5 w-36 rounded bg-gray-200" />
                  <div className="h-5 w-20 rounded bg-gray-200" />
                </div>
                <div className="space-y-3 mb-8">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
                </div>
                <div className="flex gap-3 border-b border-gray-200 pb-4 mb-6">
                  <div className="h-8 w-24 rounded bg-gray-200" />
                  <div className="h-8 w-28 rounded bg-gray-200" />
                  <div className="h-8 w-36 rounded bg-gray-200" />
                  <div className="h-8 w-28 rounded bg-gray-200" />
                </div>
                <div className="space-y-3">
                  <div className="h-12 w-full rounded bg-gray-200" />
                  <div className="h-12 w-full rounded bg-gray-200" />
                  <div className="h-12 w-full rounded bg-gray-200" />
                  <div className="h-12 w-full rounded bg-gray-200" />
                  <div className="h-12 w-full rounded bg-gray-200" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                <div className="h-56 w-full bg-gray-200" />
                <div className="p-5 space-y-4">
                  <div className="h-6 w-2/3 mx-auto rounded bg-gray-200" />
                  <div className="h-24 w-full rounded bg-gray-200" />
                </div>
                <div className="border-t border-gray-200 p-5 space-y-3">
                  <div className="h-5 w-1/2 rounded bg-gray-200" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-12 rounded bg-gray-200" />
                    <div className="h-12 rounded bg-gray-200" />
                    <div className="h-12 rounded bg-gray-200" />
                    <div className="h-12 rounded bg-gray-200" />
                    <div className="h-12 rounded bg-gray-200" />
                    <div className="h-12 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
