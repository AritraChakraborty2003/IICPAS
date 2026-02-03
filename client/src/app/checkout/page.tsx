"use client";

import Image from "next/image";
import { useState } from "react";

type CartItem = {
  id: string;
  title: string;
  type: "course" | "bundle" | "workshop";
  price: number;
  badge?: string;
};

const demoCart: CartItem[] = [];

const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function CheckoutPage() {
  const [billing, setBilling] = useState({
    name: "Aarav Sen",
    email: "aarav@example.com",
    phone: "+91 98765 43210",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("Send me the session recordings and invoice.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("SUMMER24");
  const [discount, setDiscount] = useState(800);
  const [couponStatus, setCouponStatus] = useState<"applied" | "invalid" | null>("applied");

  // If NEXT_PUBLIC_API_URL is set, use it; otherwise default to same-origin to work with Next.js API proxy or backend running behind the same host.
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const fallbackAmount = 800; // minimum demo payable when cart is empty
  const hasItems = demoCart.length > 0;
  const subtotal = hasItems
    ? demoCart.reduce((sum, item) => sum + item.price, 0)
    : fallbackAmount;
  const tax = Math.round(subtotal * 0.18);
  const effectiveDiscount = hasItems ? discount : 0;
  const total = subtotal + tax - effectiveDiscount;

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert("This is a dummy checkout. No payment was processed.");
      setIsSubmitting(false);
    }, 900);
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (code === "SUMMER24") {
      setDiscount(800);
      setCouponStatus("applied");
    } else {
      setDiscount(0);
      setCouponStatus("invalid");
    }
  };

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const openRazorpay = async () => {
    const ok = await loadRazorpay();
    if (!ok) {
      alert("Failed to load Razorpay. Please check your connection.");
      return;
    }

    if (total <= 0) {
      alert("Cart total must be greater than zero before payment.");
      return;
    }

    const payable = Math.max(total, 100); // Razorpay min amount > 0

    // Create order on backend for proper signature flow
    let orderId: string | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/test-payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payable, currency: "INR" }),
      });
      const data = await res.json();
      if (data?.data?.orderId) {
        orderId = data.data.orderId;
      } else {
        throw new Error(data?.message || "Order creation failed");
      }
    } catch (err: any) {
      console.error("Order creation error", err);
      alert(`Could not create payment order. ${err?.message || "Please try again."}`);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_xxxxxxxx",
      amount: payable * 100, // in paisa
      currency: "INR",
      name: "IICPA Checkout Demo",
      description: "Dummy Razorpay payment (no real charge)",
      image: "/images/tally.webp",
      order_id: orderId || undefined,
      handler: () => {
        alert("Dummy Razorpay flow completed (test mode).");
      },
      prefill: {
        name: billing.name,
        email: billing.email,
        contact: billing.phone.replace(/[^0-9+]/g, ""),
      },
      notes: {
        demo: "true",
        userNotes: notes,
      },
      theme: {
        color: "#f59e0b",
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 lg:flex-row lg:px-6">
        <div className="flex-1 space-y-6">
          <header className="rounded-2xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Preview</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">IICPA Checkout</h1>
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

          <div className="flex items-center justify-between px-6 pt-3 text-sm text-slate-500">
            <div className="flex items-center gap-3">
              <Image src="/images/tally.webp" alt="Tally logo" width={56} height={56} className="rounded-xl border border-slate-200" />
              <div>
                <p className="font-semibold text-slate-800">Tally-ready invoice</p>
                <p>Auto-generated after payment</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-3 text-sm text-slate-500">
            Demo cart intentionally left empty. A placeholder charge of {formatINR(fallbackAmount)} is used for testing.
          </div>

          <div className="space-y-3 px-6 py-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Have a coupon?"
                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
              <button
                onClick={handleApplyCoupon}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
            {couponStatus === "applied" && (
              <p className="text-xs font-semibold text-emerald-700">Coupon applied: {formatINR(discount)} off</p>
            )}
            {couponStatus === "invalid" && (
              <p className="text-xs font-semibold text-red-600">Invalid code. Try SUMMER24.</p>
            )}

            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(tax)}</span></div>
            <div className="flex justify-between text-emerald-700">
              <span>Promo</span>
              <span>-{formatINR(discount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Payable today</span>
              <span>{formatINR(total)}</span>
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
            <button
              onClick={openRazorpay}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-base font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Open Razorpay (test)
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
