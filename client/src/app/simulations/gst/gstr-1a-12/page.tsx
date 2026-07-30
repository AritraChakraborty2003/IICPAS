"use client";

import React from "react";
import GSTR1A12Simulation from "@/app/components/GSTR1A12Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A12Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A12Simulation onComplete={notifyGroupComplete} />;
}
