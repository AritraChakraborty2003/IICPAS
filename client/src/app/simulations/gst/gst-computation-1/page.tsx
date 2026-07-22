"use client";

import React from "react";
import GSTComputationSimulation from "@/app/components/GSTComputationSimulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTComputationPage() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTComputationSimulation onComplete={notifyGroupComplete} />;
}
