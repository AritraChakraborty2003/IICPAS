"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill3Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="search"
      baseRoute="/simulations/gst/e-way-bill-3"
      launchTitle="GST E-Way Bill Simulation 3"
      portalTitle="e-Way Bill Portal"
      companyName="IICPA Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
