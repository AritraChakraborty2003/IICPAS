"use client";

import React from "react";
import GSTR1A6Simulation from "@/app/components/GSTR1A6Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A6Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A6Simulation onComplete={notifyGroupComplete} />;
}
