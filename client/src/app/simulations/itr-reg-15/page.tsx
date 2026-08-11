"use client";

import React from "react";
import ITRReg15Simulation from "@/app/components/ITRReg15Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg15Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg15Simulation onComplete={notifyGroupComplete} />;
}
