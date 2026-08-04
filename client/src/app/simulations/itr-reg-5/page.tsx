"use client";

import React from "react";
import ITRReg5Simulation from "@/app/components/ITRReg5Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg5Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg5Simulation onComplete={notifyGroupComplete} />;
}
