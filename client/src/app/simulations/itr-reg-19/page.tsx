"use client";

import React from "react";
import ITRReg19Simulation from "@/app/components/ITRReg19Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg19Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg19Simulation onComplete={notifyGroupComplete} />;
}
