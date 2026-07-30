"use client";

import React from "react";
import GSTR1A15Simulation from "@/app/components/GSTR1A15Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A15Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A15Simulation onComplete={notifyGroupComplete} />;
}
