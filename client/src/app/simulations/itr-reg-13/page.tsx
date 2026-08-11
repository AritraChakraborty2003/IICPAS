"use client";

import React from "react";
import ITRReg13Simulation from "@/app/components/ITRReg13Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg13Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg13Simulation onComplete={notifyGroupComplete} />;
}
