"use client";

import React from "react";
import GSTEWayBillDashboard from "@/app/components/GSTEWayBillDashboard";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function EWayBill2Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTEWayBillDashboard onComplete={notifyGroupComplete} />;
}
