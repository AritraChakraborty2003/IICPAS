"use client";

import React from "react";
import GSTEInvoiceReplica from "@/app/components/GSTEInvoiceReplica";

export default function EInvoicing2Page() {
  return (
    <GSTEInvoiceReplica
      initialScreen="dashboard"
      baseRoute="/simulations/gst/e-invoicing-2"
      launchTitle="GST E-Invoice Simulation 2"
      portalTitle="e-Invoice 2 Portal"
      companyName="ABC XYZ Private Limited"
      workflow="cancel"
      initialInvoiceMenuOpen={true}
      initialShowLaunchScreen={false}
      startOnDashboard={true}
      highlightBulkUpload={true}
      bulkUploadRoute="/simulations/gst/e-invoicing-2/bulk-upload"
    />
  );
}
