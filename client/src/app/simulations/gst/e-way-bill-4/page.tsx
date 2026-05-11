"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill4Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="experiment4"
      baseRoute="/simulations/gst/e-way-bill-4"
      launchTitle="GST E-Way Bill Simulation 4"
      portalTitle="e-Way Bill Portal"
      companyName="ABC XYZ Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
