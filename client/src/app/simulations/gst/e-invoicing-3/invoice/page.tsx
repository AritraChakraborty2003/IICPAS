"use client";

import React from "react";
import GSTEInvoiceReplica from "../../../../components/GSTEInvoiceReplica";

export default function GSTEInvoicing3InvoicePage() {
  return (
    <GSTEInvoiceReplica
      initialScreen="invoice"
      baseRoute="/simulations/gst/e-invoicing-3"
      launchTitle="GST E-Invoice Simulation 3"
      portalTitle="e-Invoice 3 Portal"
    />
  );
}
