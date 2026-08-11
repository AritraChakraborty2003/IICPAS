"use client";

import React from "react";
import ITRReg21Simulation from "@/app/components/ITRReg21Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg21Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg21Simulation onComplete={notifyGroupComplete} />;
}
