import type { Metadata } from "next";
import { Suspense } from "react";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import DeferredGlobalWidgets from "@/components/DeferredGlobalWidgets";
import ScrollToTopOnNavigation from "@/components/ScrollToTopOnNavigation";
import AuthRouteMarker from "@/components/AuthRouteMarker";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "IICPA Institute - Best Accounting Institute in India",
  description: "Professional Accounting Institute",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <AuthRouteMarker />
          <Suspense fallback={null}>
            <ScrollToTopOnNavigation />
          </Suspense>
          {children}
          <DeferredGlobalWidgets />
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
