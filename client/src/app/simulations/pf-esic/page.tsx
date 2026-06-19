"use client";

import React from "react";
import Link from "next/link";
import { FaArrowRight, FaDesktop, FaShieldAlt, FaSitemap } from "react-icons/fa";

const experiments = [
  {
    title: "Shram Suvidha 1 — Sign Up & Login",
    description:
      "Exact UI replica of the Shram Suvidha 2.0 Portal Sign-Up and Login flow. Register with dummy credentials and login to see the employer dashboard.",
    route: "/simulations/pf-esic/shram-suvidha-1",
    badge: "PF & ESIC",
    icon: FaDesktop,
  },
];

export default function PFESICSimulationsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e7f4ff,_#f7fbff_40%,_#eef4fa_100%)] text-slate-900">
      <div className="border-b border-sky-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                <FaSitemap />
                PF &amp; ESIC Simulations
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Shram Suvidha 2.0 Simulation Family
              </h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600">
                Interactive replicas of the Shram Suvidha Portal for PF and ESIC
                registration training.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
              <div className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-700">
                Active Experiment
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                Shram Suvidha 1
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Sign Up + Login portal replica
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {experiments.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.route} href={item.route}>
                <div className="group h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-sky-50 p-4 text-sky-600">
                      <Icon className="text-3xl" />
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      {item.badge}
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-bold text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-slate-600">{item.description}</p>
                  <div className="mt-6 inline-flex items-center gap-2 font-semibold text-sky-700">
                    Open experiment
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
              <FaShieldAlt className="text-2xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Educational Simulation
              </h3>
              <p className="mt-2 max-w-3xl text-slate-600">
                These simulations are exact UI replicas of the Shram Suvidha 2.0
                portal for training purposes only. No real data is submitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
