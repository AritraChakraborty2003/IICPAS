"use client";

import React from "react";
import ITRReg18Simulation from "@/app/components/ITRReg18Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg18Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg18Simulation onComplete={notifyGroupComplete} />;
}
