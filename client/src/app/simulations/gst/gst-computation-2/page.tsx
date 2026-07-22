"use client";

import React from "react";
import GSTComputation2Simulation from "@/app/components/GSTComputation2Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTComputation2Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTComputation2Simulation onComplete={notifyGroupComplete} />;
}
