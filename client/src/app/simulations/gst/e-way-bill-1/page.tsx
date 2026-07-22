"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function EWayBill1Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return (
    <GSTEWayBillReplica
      initialScreen="home"
      baseRoute="/simulations/gst/e-way-bill-1"
      launchTitle="GST E-Way Bill Simulation 1"
      portalTitle="e-Way Bill Portal"
      companyName="ABC XYZ Private Limited"
      initialShowLaunchScreen={true}
      onComplete={notifyGroupComplete}
    />
  );
}
