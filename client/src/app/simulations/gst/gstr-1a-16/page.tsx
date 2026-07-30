"use client";

import React from "react";
import GSTR1A16Simulation from "@/app/components/GSTR1A16Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A16Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A16Simulation onComplete={notifyGroupComplete} />;
}
