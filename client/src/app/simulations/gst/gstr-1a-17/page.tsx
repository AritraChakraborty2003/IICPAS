"use client";

import React from "react";
import GSTR1A17Simulation from "@/app/components/GSTR1A17Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A17Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A17Simulation onComplete={notifyGroupComplete} />;
}
