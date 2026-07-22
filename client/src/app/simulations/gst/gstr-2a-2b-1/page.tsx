"use client";

import React from "react";
import GSTR2A2B1Simulation from "@/app/components/GSTR2A2B1Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR2A2B1Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR2A2B1Simulation onComplete={notifyGroupComplete} />;
}
