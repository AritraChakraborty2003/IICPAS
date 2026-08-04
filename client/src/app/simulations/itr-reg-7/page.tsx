"use client";

import React from "react";
import ITRReg7Simulation from "@/app/components/ITRReg7Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg7Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg7Simulation onComplete={notifyGroupComplete} />;
}
