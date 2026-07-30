"use client";

import React from "react";
import GSTR1A14Simulation from "@/app/components/GSTR1A14Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A14Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A14Simulation onComplete={notifyGroupComplete} />;
}
