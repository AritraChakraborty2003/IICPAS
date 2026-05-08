"use client";

import React from "react";
import GSTEInvoiceReplica from "../../../../components/GSTEInvoiceReplica";
import GSTAuthGate from "../../GSTAuthGate";

export default function GSTEInvoicing1InvoicePage() {
  return (
    <GSTAuthGate>
      <GSTEInvoiceReplica initialScreen="invoice" />
    </GSTAuthGate>
  );
}
