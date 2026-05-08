import React from "react";
import GSTAuthGate from "./GSTAuthGate";

export default function GSTSimulationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GSTAuthGate>{children}</GSTAuthGate>;
}
