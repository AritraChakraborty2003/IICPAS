"use client";

import React from "react";
import GSTR110Simulation from "@/app/components/GSTR110Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR110Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR110Simulation onComplete={notifyGroupComplete} />;
}
