"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, RotateCcw } from "lucide-react";
import { useSimulationConfig, findFieldValue } from "@/lib/useSimulationConfig";
import { useSimGroupComplete } from "@/lib/useSimGroupComplete";
import {
  DEFAULT_CODE,
  DEFAULT_ESTABLISHMENT,
  EMPLOYEES,
  SimBanner,
  TopStrip,
  Header,
  Footer,
  CounterfoilCard,
} from "../../_shared";

const SIMULATION_SLUG = "epf-reg-23";

function SuccessOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-[#07111f]/45 px-4 pt-24 backdrop-blur-[3px] sm:pt-32">
      <div className="flex flex-col items-center gap-4 rounded-[16px] bg-white/95 px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div
          className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-green-500 shadow-[0_0_0_10px_rgba(34,197,94,0.25),0_0_0_22px_rgba(34,197,94,0.12)]"
          style={{ animation: "epfReg23TickPop 0.15s ease-out" }}
        >
          <CheckCircle size={48} className="text-white" />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#0b2e57]">
          e-Pehchan Card Downloaded Successfully
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-[#e1141a] px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(225,20,26,0.28)] hover:bg-[#c90f15]"
        >
          <RotateCcw size={15} /> Close
        </button>
      </div>
      <style jsx>{`
        @keyframes epfReg23TickPop {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default function CounterfoilPage() {
  const params = useParams<{ insuranceNo: string }>();
  const router = useRouter();
  const [downloaded, setDownloaded] = useState(false);

  const simConfig = useSimulationConfig(SIMULATION_SLUG);
  const code = findFieldValue(simConfig, /code|lin|user/i) || DEFAULT_CODE;
  const notifyGroupComplete = useSimGroupComplete();

  const employee = EMPLOYEES.find((e) => e.insuranceNo === params.insuranceNo);

  const handleDownload = () => {
    if (!employee) return;
    const blob = new Blob(
      [
        `EMPLOYEES' STATE INSURANCE CORPORATION\ne-Pehchan Card\n\nInsured Person: ${employee.name}\nInsurance No.: ${employee.insuranceNo}\nDate of Registration: ${employee.dateOfRegistration}\nEmployer's Code No.: ${code}\nEmployer: ${DEFAULT_ESTABLISHMENT}\n`,
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `e-Pehchan-Card_${employee.insuranceNo}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    notifyGroupComplete();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f6f8]">
      <SimBanner />
      {downloaded && <SuccessOverlay onRetry={() => setDownloaded(false)} />}

      <TopStrip />
      <Header />

      <main className="mx-auto w-full max-w-[1300px] flex-1 px-6 py-8">
        {employee ? (
          <CounterfoilCard
            employee={employee}
            code={code}
            onDownload={handleDownload}
            onClose={() => window.close()}
          />
        ) : (
          <div className="mt-5 rounded-[6px] border border-[#e0ddc8] bg-white px-6 py-10 text-center text-[14px] text-[#7a1f1a]">
            No counterfoil found for insurance number {params.insuranceNo}.
            <div className="mt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded border border-[#c0c0c0] bg-[#efe9d5] px-5 py-1.5 text-[13px] font-bold text-[#555] hover:bg-[#e5dfc8]"
              >
                Go Back
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
