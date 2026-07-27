"use client";

import React from "react";
import GSTR1A3Simulation from "@/app/components/GSTR1A3Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A3Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A3Simulation onComplete={notifyGroupComplete} />;
}
