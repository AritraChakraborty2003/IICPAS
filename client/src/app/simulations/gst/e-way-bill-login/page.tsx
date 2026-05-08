"use client";

import React from "react";
import GSTEWayBillLoginPage from "@/app/components/GSTEWayBillLoginPage";

type EWayBillLoginPageProps = {
  searchParams?: {
    returnTo?: string;
  };
};

export default function EWayBillLoginPage({ searchParams }: EWayBillLoginPageProps) {
  const returnTo =
    typeof searchParams?.returnTo === "string" && searchParams.returnTo.length > 0
      ? searchParams.returnTo
      : "/simulations/gst/e-way-bill-1";

  return <GSTEWayBillLoginPage returnTo={returnTo} />;
}
