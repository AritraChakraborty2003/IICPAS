"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill5Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="generate"
      generateLayout="content"
      baseRoute="/simulations/gst/e-way-bill-5"
      launchTitle="GST E-Way Bill Simulation 5"
      portalTitle="e-Way Bill Portal"
      companyName="ABC XYZ Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
