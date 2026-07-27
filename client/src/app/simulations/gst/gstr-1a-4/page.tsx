"use client";

import React from "react";
import GSTR1A4Simulation from "@/app/components/GSTR1A4Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A4Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A4Simulation onComplete={notifyGroupComplete} />;
}
