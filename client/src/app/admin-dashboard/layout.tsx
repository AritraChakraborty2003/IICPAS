"use client";

import { installAdminAuthInterceptor } from "@/utils/adminAuthInterceptor";

// Install once at module load (client only) so the admin JWT is attached to
// every axios request made from within the admin dashboard.
installAdminAuthInterceptor();

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
