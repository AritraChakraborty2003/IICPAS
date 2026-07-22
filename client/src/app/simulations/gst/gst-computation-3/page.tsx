"use client";

import React from "react";
import GSTComputation3Simulation from "@/app/components/GSTComputation3Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTComputation3Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTComputation3Simulation onComplete={notifyGroupComplete} />;
}
