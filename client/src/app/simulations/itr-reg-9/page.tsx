"use client";

import React from "react";
import ITRReg9Simulation from "@/app/components/ITRReg9Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg9Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg9Simulation onComplete={notifyGroupComplete} />;
}
