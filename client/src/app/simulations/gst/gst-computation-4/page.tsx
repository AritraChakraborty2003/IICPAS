"use client";

import React from "react";
import GSTChallanHistorySimulation from "@/app/components/GSTChallanHistorySimulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTComputation4Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTChallanHistorySimulation onComplete={notifyGroupComplete} />;
}
