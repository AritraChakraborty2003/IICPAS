"use client";

import React from "react";
import GSTEWayBillReplica from "@/app/components/GSTEWayBillReplica";

export default function EWayBill6Page() {
  return (
    <GSTEWayBillReplica
      initialScreen="billDetails"
      baseRoute="/simulations/gst/e-way-bill-6"
      launchTitle="GST E-Way Bill Simulation 6"
      portalTitle="e-Way Bill Portal"
      companyName="Shivam Cements Private Limited"
      initialShowLaunchScreen={true}
    />
  );
}
