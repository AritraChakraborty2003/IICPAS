import { Suspense } from "react";
import PreviewLandingPageClient from "./PreviewLandingPageClient";

export default function LiveSessionLandingPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100">
          <div className="flex min-h-screen items-center justify-center text-slate-500">
            Loading preview...
          </div>
        </div>
      }
    >
      <PreviewLandingPageClient />
    </Suspense>
  );
}
