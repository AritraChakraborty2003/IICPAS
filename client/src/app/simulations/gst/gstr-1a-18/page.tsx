"use client";

import React from "react";
import GSTR1A18Simulation from "@/app/components/GSTR1A18Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A18Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A18Simulation onComplete={notifyGroupComplete} />;
}
