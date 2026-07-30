"use client";

import React from "react";
import GSTR1A13Simulation from "@/app/components/GSTR1A13Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A13Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A13Simulation onComplete={notifyGroupComplete} />;
}
