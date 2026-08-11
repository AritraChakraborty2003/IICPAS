"use client";

import React from "react";
import ITRReg20Simulation from "@/app/components/ITRReg20Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg20Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg20Simulation onComplete={notifyGroupComplete} />;
}
