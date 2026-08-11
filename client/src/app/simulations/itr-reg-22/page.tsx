"use client";

import React from "react";
import ITRReg22Simulation from "@/app/components/ITRReg22Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function ITRReg22Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <ITRReg22Simulation onComplete={notifyGroupComplete} />;
}
