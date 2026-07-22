"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function EWayBill5Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return (
    <GSTEWayBillReplica
      initialScreen="generate"
      generateLayout="content"
      baseRoute="/simulations/gst/e-way-bill-5"
      launchTitle="GST E-Way Bill Simulation 5"
      portalTitle="e-Way Bill Portal"
      companyName="ABC XYZ Private Limited"
      initialShowLaunchScreen={true}
      onComplete={notifyGroupComplete}
    />
  );
}
