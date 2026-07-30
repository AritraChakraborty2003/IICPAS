"use client";

import React from "react";
import GSTR1A11Simulation from "@/app/components/GSTR1A11Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A11Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A11Simulation onComplete={notifyGroupComplete} />;
}
