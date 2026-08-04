"use client";

import React from "react";
import ITRReg11Simulation from "@/app/components/ITRReg11Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg11Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg11Simulation onComplete={notifyGroupComplete} />;
}
