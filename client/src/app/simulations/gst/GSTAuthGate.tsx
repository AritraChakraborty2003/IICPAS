"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBase } from "@/lib/apiBase";

type GSTAuthGateProps = {
  children: React.ReactNode;
};

const ADMIN_STORAGE_KEYS = ["adminToken", "adminUser"];

export default function GSTAuthGate({ children }: GSTAuthGateProps) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let aborted = false;

    const clearAdminAuth = () => {
      if (typeof window === "undefined") {
        return;
      }

      ADMIN_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
    };

    const redirectToLogin = () => {
      clearAdminAuth();
      router.replace("/student-login");
    };

    const checkAccess = async () => {
      try {
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;

        if (adminToken) {
          const adminResponse = await fetch(`${getApiBase()}/employees/profile`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          if (adminResponse.ok) {
            if (isMounted) {
              setCheckingAuth(false);
            }
            return;
          }

          clearAdminAuth();
        }

        const studentResponse = await fetch(
          `${getApiBase()}/v1/students/isstudent`,
          {
            credentials: "include",
          }
        );

        if (studentResponse.ok) {
          if (isMounted) {
            setCheckingAuth(false);
          }
          return;
        }

        if (!aborted) {
          redirectToLogin();
        }
      } catch {
        if (!aborted) {
          redirectToLogin();
        }
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
      aborted = true;
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e7f4ff,_#f7fbff_40%,_#eef4fa_100%)] text-slate-700">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}
