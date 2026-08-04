"use client";

import React from "react";
import ITRReg10Simulation from "@/app/components/ITRReg10Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg10Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg10Simulation onComplete={notifyGroupComplete} />;
}
