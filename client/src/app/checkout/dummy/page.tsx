"use client";

import { useMemo, useState } from "react";

type CartItem = {
  id: string;
  title: string;
  type: "course" | "bundle" | "workshop";
  price: number;
  badge?: string;
};

const demoCart: CartItem[] = [
  {
    id: "tax-masterclass",
    title: "GST Masterclass 2025",
    type: "course",
    price: 3499,
    badge: "Best value",
  },
  {
    id: "audit-sprint",
    title: "Internal Audit Sprint",
    type: "workshop",
    price: 1499,
  },
  {
    id: "finance-bundle",
    title: "Finance Pro Bundle",
    type: "bundle",
    price: 4999,
  },
];

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function DummyCheckoutPage() {
  const [billing, setBilling] = useState({
    name: "Aarav Sen",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("Send me the session recordings and invoice.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo(() => {
    const subtotal = demoCart.reduce((sum, item) => sum + item.price, 0);
    const tax = Math.round(subtotal * 0.18);
    const discount = 800;
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  }, []);

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert("This is a dummy checkout. No payment was processed.");
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 lg:flex-row lg:px-6">
        <div className="flex-1 space-y-6">
          <header className="rounded-2xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Preview</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Dummy Checkout</h1>
            <p className="mt-2 text-sm text-slate-200">
              Use this page to demo the flow without touching real payments. Values are pre-filled for speed.
            </p>
          </header>

          <section className="rounded-2xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-teal-200">Billing</p>
                <h2 className="text-xl font-semibold text-white">Contact details</h2>
              </div>
              <span className="rounded-full bg-teal-400/20 px-4 py-1 text-xs font-semibold text-teal-200 ring-1 ring-teal-300/30">
                No login required
              </span>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-200">
                <span>Name</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                  value={billing.name}
                  onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span>Email</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                  value={billing.email}
                  onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span>Phone</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                  value={billing.phone}
                  onChange={(e) => setBilling({ ...billing, phone: e.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm text-slate-200">
                <span>Notes</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.16em] text-sky-200">Payment</p>
            <h2 className="text-xl font-semibold text-white">Choose a method</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { id: "card", label: "Card", detail: "Visa / Mastercard" },
                { id: "upi", label: "UPI", detail: "GPay / PhonePe" },
                { id: "netbanking", label: "Netbanking", detail: "All major banks" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 ${
                    paymentMethod === method.id
                      ? "border-amber-300 bg-amber-300/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-100"
                  }`}
                >
                  <p className="font-semibold">{method.label}</p>
                  <p className="text-sm text-slate-200">{method.detail}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              This is a sandbox experience. Selecting a method does not trigger any external gateway.
            </div>
          </section>
        </div>

        <aside className="w-full max-w-xl space-y-4 rounded-2xl bg-white text-slate-900 shadow-2xl ring-4 ring-amber-200/60 lg:sticky lg:top-10">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">Your cart</p>
            <h2 className="text-2xl font-semibold text-slate-900">Review items</h2>
          </div>

          <div className="divide-y divide-slate-200/80">
            {demoCart.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-6 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-inner">
                  {item.type === "course" ? "📘" : item.type === "bundle" ? "🎁" : "🧑‍💼"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    {item.badge && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">{item.type}</p>
                </div>
                <p className="font-semibold text-slate-900">{formatINR(item.price)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 px-6 py-4 text-sm text-slate-700">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(totals.tax)}</span></div>
            <div className="flex justify-between text-emerald-700">
              <span>Promo: SUMMER24</span>
              <span>-{formatINR(totals.discount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Payable today</span>
              <span>{formatINR(totals.total)}</span>
            </div>
            <p className="text-xs text-slate-500">
              You will receive confirmation on {billing.email}. This is a demonstration; nothing is billed.
            </p>
          </div>

          <div className="border-t border-slate-200 px-6 py-4">
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-500 px-4 py-3 text-center text-base font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Placing order..." : "Place dummy order"}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              No payment gateway is contacted. Perfect for demos and QA.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
