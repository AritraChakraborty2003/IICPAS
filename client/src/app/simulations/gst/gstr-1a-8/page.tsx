"use client";

import React from "react";
import GSTR1A8Simulation from "@/app/components/GSTR1A8Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A8Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A8Simulation onComplete={notifyGroupComplete} />;
}
