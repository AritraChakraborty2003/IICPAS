"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill1Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="home"
      baseRoute="/simulations/gst/e-way-bill-1"
      launchTitle="GST E-Way Bill Simulation 1"
      portalTitle="e-Way Bill Portal"
      companyName="IICPA Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
