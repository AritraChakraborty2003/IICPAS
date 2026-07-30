"use client";

import React from "react";
import GSTR1A7Simulation from "@/app/components/GSTR1A7Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A7Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A7Simulation onComplete={notifyGroupComplete} />;
}
