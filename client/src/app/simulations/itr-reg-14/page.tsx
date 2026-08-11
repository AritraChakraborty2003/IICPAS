"use client";

import React from "react";
import ITRReg14Simulation from "@/app/components/ITRReg14Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg14Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg14Simulation onComplete={notifyGroupComplete} />;
}
