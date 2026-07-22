"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function EWayBill4Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return (
    <GSTEWayBillReplica
      initialScreen="experiment4"
      baseRoute="/simulations/gst/e-way-bill-4"
      launchTitle="GST E-Way Bill Simulation 4"
      portalTitle="e-Way Bill Portal"
      companyName="ABC XYZ Private Limited"
      initialShowLaunchScreen={true}
      onComplete={notifyGroupComplete}
    />
  );
}
