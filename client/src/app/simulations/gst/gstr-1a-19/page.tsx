"use client";

import React from "react";
import GSTR1A19Simulation from "@/app/components/GSTR1A19Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A19Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A19Simulation onComplete={notifyGroupComplete} />;
}
