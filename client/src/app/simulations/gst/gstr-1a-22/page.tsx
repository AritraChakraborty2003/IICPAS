"use client";

import React from "react";
import GSTR1A22Simulation from "@/app/components/GSTR1A22Simulation";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";

export default function GSTR1A22Page() {
  const notifyGroupComplete = useSimGroupComplete();
  return <GSTR1A22Simulation onComplete={notifyGroupComplete} />;
}
