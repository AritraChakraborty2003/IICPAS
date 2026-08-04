"use client";

import React from "react";
import ITRReg8Simulation from "@/app/components/ITRReg8Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg8Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg8Simulation onComplete={notifyGroupComplete} />;
}
