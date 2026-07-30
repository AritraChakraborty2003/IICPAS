"use client";

import React from "react";
import GSTR1A9Simulation from "@/app/components/GSTR1A9Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A9Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A9Simulation onComplete={notifyGroupComplete} />;
}
