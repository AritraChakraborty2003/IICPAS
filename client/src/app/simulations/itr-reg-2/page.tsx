"use client";

import React from "react";
import ITRReg2Simulation from "@/app/components/ITRReg2Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg2Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg2Simulation onComplete={notifyGroupComplete} />;
}
