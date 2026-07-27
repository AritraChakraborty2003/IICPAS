"use client";

import React from "react";
import GSTR1A5Simulation from "@/app/components/GSTR1A5Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A5Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A5Simulation onComplete={notifyGroupComplete} />;
}
