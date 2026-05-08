"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill2Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="generate"
      baseRoute="/simulations/gst/e-way-bill-2"
      launchTitle="GST E-Way Bill Simulation 2"
      portalTitle="e-Way Bill Portal"
      companyName="IICPA Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
