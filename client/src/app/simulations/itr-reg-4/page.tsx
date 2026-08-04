"use client";

import React from "react";
import ITRReg4Simulation from "@/app/components/ITRReg4Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg4Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg4Simulation onComplete={notifyGroupComplete} />;
}
