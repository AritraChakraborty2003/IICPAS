"use client";

import React from "react";
import ITRReg12Simulation from "@/app/components/ITRReg12Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg12Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg12Simulation onComplete={notifyGroupComplete} />;
}
