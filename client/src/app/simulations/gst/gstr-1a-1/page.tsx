"use client";

import React from "react";
import GSTR1A1Simulation from "@/app/components/GSTR1A1Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A1Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A1Simulation onComplete={notifyGroupComplete} />;
}
