"use client";

import React from "react";
import ITRReg16Simulation from "@/app/components/ITRReg16Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg16Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg16Simulation onComplete={notifyGroupComplete} />;
}
