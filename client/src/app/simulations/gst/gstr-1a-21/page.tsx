"use client";

import React from "react";
import GSTR1A21Simulation from "@/app/components/GSTR1A21Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A21Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A21Simulation onComplete={notifyGroupComplete} />;
}
