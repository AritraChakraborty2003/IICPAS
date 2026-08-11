"use client";

import React from "react";
import ITRReg17Simulation from "@/app/components/ITRReg17Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg17Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg17Simulation onComplete={notifyGroupComplete} />;
}
