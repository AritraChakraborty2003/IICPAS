"use client";

import React from "react";
import ITRReg3Simulation from "@/app/components/ITRReg3Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg3Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg3Simulation onComplete={notifyGroupComplete} />;
}
