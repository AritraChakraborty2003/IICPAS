"use client";

import React from "react";
import GSTR1A20Simulation from "@/app/components/GSTR1A20Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A20Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A20Simulation onComplete={notifyGroupComplete} />;
}
