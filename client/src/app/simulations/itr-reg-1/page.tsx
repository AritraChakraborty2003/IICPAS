"use client";

import React from "react";
import ITRReg1Simulation from "@/app/components/ITRReg1Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg1Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg1Simulation onComplete={notifyGroupComplete} />;
}
