"use client";

import React from "react";
import ITRReg6Simulation from "@/app/components/ITRReg6Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg6Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg6Simulation onComplete={notifyGroupComplete} />;
}
