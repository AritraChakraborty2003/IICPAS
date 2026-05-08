"use client";

import React from "react";
import GSTEInvoiceReplica from "@/app/components/GSTEInvoiceReplica";

export default function EInvoicing4Page() {
  return (
    <GSTEInvoiceReplica
      initialScreen="dashboard"
      baseRoute="/simulations/gst/e-invoicing-4"
      launchTitle="GST E-Invoice Simulation 4"
      portalTitle="e-Invoice 1 Portal"
      workflow="cancel"
    />
  );
}
