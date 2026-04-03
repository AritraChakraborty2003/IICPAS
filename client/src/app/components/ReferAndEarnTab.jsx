"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaBullhorn,
  FaCheckCircle,
  FaCoins,
  FaCopy,
  FaGift,
  FaLink,
  FaShareAlt,
  FaUserFriends,
  FaWhatsapp,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const formatDate = (value) => {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "ST";

const maskEmail = (email = "") => {
  const [username = "", domain = ""] = email.split("@");
  if (!username) return "";
  const safeName =
    username.length <= 2
      ? `${username[0] || ""}*`
      : `${username.slice(0, 2)}${"*".repeat(Math.max(username.length - 2, 2))}`;
  return `${safeName}${domain ? `@${domain}` : ""}`;
};

const defaultSummary = {
  referralCode: "",
  referralRewardCoins: 0,
  referredCount: 0,
  totalReferralCoins: 0,
  currentCoinBalance: 0,
  recentReferrals: [],
  referredBy: null,
};

function StatCard({ icon, label, value, tone }) {
  const toneClasses = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${toneClasses[tone] || toneClasses.blue}`}
    >
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-lg shadow-sm">
        {icon}
      </div>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function ReferAndEarnTab({ student }) {
  const [summary, setSummary] = useState(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!student?._id) return undefined;

    let cancelled = false;

    const fetchReferralSummary = async () => {
      setLoading(true);

      try {
        const response = await axios.get(
          `${API_URL}/api/v1/students/referral-summary/${student._id}`,
          { withCredentials: true }
        );

        if (!cancelled) {
          setSummary({ ...defaultSummary, ...response.data });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Unable to load referral details");
          setSummary(defaultSummary);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReferralSummary();

    return () => {
      cancelled = true;
    };
  }, [student?._id]);

  const referralLink = useMemo(() => {
    if (!summary.referralCode) return "";
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://www.iicpa.in";
    return `${origin}/register?ref=${summary.referralCode}`;
  }, [summary.referralCode]);

  const shareMessage = useMemo(() => {
    const rewardText = summary.referralRewardCoins
      ? `I earn ${summary.referralRewardCoins} coins when a new student signs up. `
      : "";

    return `Join IICPA Institute with my referral link. ${rewardText}Use code ${summary.referralCode} while registering.`;
  }, [summary.referralCode, summary.referralRewardCoins]);

  const handleCopy = async (value, field) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopyState(field);
      toast.success(field === "link" ? "Referral link copied" : "Referral code copied");

      window.setTimeout(() => {
        setCopyState((current) => (current === field ? "" : current));
      }, 1800);
    } catch (error) {
      toast.error("Unable to copy right now");
    }
  };

  const handleNativeShare = async () => {
    if (!referralLink) return;

    if (typeof navigator === "undefined" || !navigator.share) {
      handleCopy(referralLink, "link");
      return;
    }

    try {
      setSharing(true);
      await navigator.share({
        title: "Join IICPA Institute",
        text: shareMessage,
        url: referralLink,
      });
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Sharing failed");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!referralLink || typeof window === "undefined") return;
    const whatsappText = `${shareMessage} ${referralLink}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-64 animate-pulse rounded-[28px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#00111F] via-[#002640] to-[#003153] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] md:p-8">
        <div className="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-[#4F93CE]/20 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#0F4C81]/25 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-semibold text-blue-50 backdrop-blur">
              <FaGift className="text-amber-300" />
              <span>Refer & Earn</span>
            </div>

            <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight md:text-4xl">
              Share IICPA with friends and collect coins for every successful signup.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/85 md:text-base">
              Your personal referral link is ready. Copy it, share it, and track how
              many students joined through you from one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleCopy(referralLink, "link")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-blue-50"
              >
                {copyState === "link" ? <FaCheckCircle className="text-emerald-600" /> : <FaCopy />}
                <span>{copyState === "link" ? "Copied Link" : "Copy Referral Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                disabled={sharing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
              >
                <FaShareAlt />
                <span>{sharing ? "Sharing..." : "Share Now"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-100/80">
              Your Reward
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black text-white">
                {Number(summary.referralRewardCoins || 0)}
              </span>
              <span className="pb-1 text-lg font-semibold text-blue-100">coins</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-50/80">
              Coins are credited when a new student signs up using your referral code.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100/70">
                Referral Code
              </p>
              <p className="mt-3 break-all text-2xl font-black tracking-[0.35em] text-white">
                {summary.referralCode || "--------"}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(summary.referralCode, "code")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {copyState === "code" ? <FaCheckCircle className="text-blue-300" /> : <FaCopy />}
                <span>{copyState === "code" ? "Copied Code" : "Copy Code"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
                Share Link
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Send this referral link to your network
              </h3>
            </div>
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Hi {student?.name || "Student"}
            </div>
          </div>

          <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3 text-slate-500">
              <FaLink className="text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-[0.28em]">
                Registration URL
              </span>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 font-mono text-sm text-slate-700 shadow-sm">
              <span className="break-all">{referralLink || "Your referral link will appear here."}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleCopy(referralLink, "link")}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <FaCopy />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
              >
                <FaWhatsapp />
                <span>Share on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <FaBullhorn />
                <span>More Share Options</span>
              </button>
            </div>
          </div>

          {summary.referredBy?.name ? (
            <div className="mt-5 rounded-3xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
              You joined IICPA through <span className="font-semibold">{summary.referredBy.name}</span>.
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <StatCard
            icon={<FaUserFriends className="text-blue-600" />}
            label="Successful referrals"
            value={Number(summary.referredCount || 0)}
            tone="blue"
          />
          <StatCard
            icon={<FaCoins className="text-amber-500" />}
            label="Coins earned from referrals"
            value={Number(summary.totalReferralCoins || 0)}
            tone="amber"
          />
          <StatCard
            icon={<FaGift className="text-emerald-600" />}
            label="Current coin balance"
            value={Number(summary.currentCoinBalance || 0)}
            tone="emerald"
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            How It Works
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Three simple steps
          </h3>

          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Step 1</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Copy your link</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the copy button to grab your personal registration link or referral code.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Step 2</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Invite new students</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Share it on WhatsApp, social media, or directly with friends interested in IICPA.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Step 3</p>
              <p className="mt-2 text-lg font-bold text-slate-900">Earn coins automatically</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                When a student registers with your code, the reward is added to your coin balance.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Referral Activity
              </p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                Recent joins from your link
              </h3>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {Number(summary.referredCount || 0)} total
            </div>
          </div>

          {summary.recentReferrals.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                <FaUserFriends size={22} />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-900">
                No referrals yet
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start sharing your link now. Your successful referral signups will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {summary.recentReferrals.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-black text-white">
                    {getInitials(entry.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {entry.name}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {maskEmail(entry.email)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Joined
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDate(entry.joinedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
