"use client";

import React from "react";
import GSTR1A2Simulation from "@/app/components/GSTR1A2Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A2Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A2Simulation onComplete={notifyGroupComplete} />;
}
