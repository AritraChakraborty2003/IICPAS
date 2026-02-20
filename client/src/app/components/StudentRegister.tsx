/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useState } from "react";
import Select from "react-select";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

export default function StudentRegisterForm() {
  const [mode, setMode] = useState<"register" | "login" | "forgot">("register");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    location: "Greater Noida",
    center: "Greater Noida",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCenterChange = (selected: any) => {
    setForm((prev) => ({ ...prev, center: selected.value }));
  };

  const handleRegister = async (e: any) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword, location, center } = form;

    if (!name || !email || !phone || !password || !confirmPassword) {
      return toast.success("All fields required");
    }
    if (password !== confirmPassword) {
      return toast("Passwords do not match!");
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/register`,
        { name, email, phone, password, location, center },
        { withCredentials: true }
      );
      toast.success("Registration successful!", {
        style: {
          zIndex: 9999,
        },
      });
      setMode("login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed", {
        style: {
          zIndex: 9999,
        },
      });
    }
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      return toast.error("Email and password required");
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/login`,
        { email: loginEmail, password: loginPassword },
        { withCredentials: true }
      );
      toast.success("Login successful", {
        style: {
          zIndex: 9999,
        },
      });
      window.location.href = "/student-dashboard";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed", {
        style: {
          zIndex: 9999,
        },
      });
    }
  };

  const handleSendOtp = async (e: any) => {
    e.preventDefault();
    if (!forgotEmail) return alert("Enter your email");

    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/forgot-password`,
        { email: forgotEmail }
      );
      toast.success("OTP sent to your email.");
      setForgotStep("otp");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    if (!otp || !newPassword) return toast.error("All fields required");

    setLoading(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/reset-password`,
        { email: forgotEmail, otp, newPassword }
      );
      toast.success("Password reset successful");
      setMode("login");
      setForgotStep("email");
      setForgotEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  const centerOptions = [{ label: "Greater Noida", value: "Greater Noida" }];

  const compactSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: 40,
      borderRadius: 10,
      borderColor: state.isFocused ? "#34d399" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(16,185,129,0.2)" : "none",
      ":hover": { borderColor: "#34d399" },
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 12px" }),
    indicatorsContainer: (base: any) => ({ ...base, height: 40 }),
    menu: (base: any) => ({ ...base, zIndex: 30 }),
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 pt-28 pb-6 px-4 md:pt-32 md:pb-8"
      style={{ position: "relative", zIndex: 1 }}
    >
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl">
        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          <div className="relative hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-7 text-white md:flex md:flex-col md:justify-between">
            <div>
              <Image src="/images/logo.png" height={72} width={120} alt="IICPA" className="mb-5 rounded bg-white p-2" />
              <h2 className="text-2xl font-bold leading-tight">Learn Smarter With IICPA</h2>
              <p className="mt-3 text-sm text-emerald-50/90">
                Access classes, practicals, and progress tools from one student dashboard.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-emerald-50/95">
              <li>Fast onboarding</li>
              <li>Structured practical training</li>
              <li>Single account for all learning tools</li>
            </ul>
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}
                </h1>
                <p className="text-xs text-slate-500">
                  {mode === "register"
                    ? "Complete your details to get started"
                    : mode === "forgot"
                    ? "Enter your email and OTP to continue"
                    : "Login to continue your learning"}
                </p>
              </div>
              {mode !== "forgot" && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      mode === "login" ? "bg-white font-semibold text-emerald-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      mode === "register" ? "bg-white font-semibold text-emerald-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {mode === "register" && (
              <form onSubmit={handleRegister} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Full Name" name="name" value={form.name} onChange={handleChange} />
                <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />

                <SelectDropdown
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  options={["Greater Noida"]}
                />

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Center</label>
                  <Select
                    options={centerOptions}
                    value={centerOptions.find((opt) => opt.value === form.center)}
                    onChange={handleCenterChange}
                    placeholder="Select center"
                    aria-label="Center selection"
                    styles={compactSelectStyles}
                  />
                </div>

                <div className="sm:col-span-2">
                  <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
                </div>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                />
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  show={showConfirm}
                  toggle={() => setShowConfirm(!showConfirm)}
                />

                <button
                  type="submit"
                  className="sm:col-span-2 mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Register
                </button>

                <div className="sm:col-span-2 text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => setMode("login")}>
                    Login
                  </button>
                </div>
              </form>
            )}

            {mode === "login" && (
              <form onSubmit={handleLogin} className="mx-auto flex w-full max-w-md flex-col gap-3">
                <Input
                  label="Email"
                  name="loginEmail"
                  type="email"
                  value={loginEmail}
                  onChange={(e: any) => setLoginEmail(e.target.value)}
                />
                <PasswordInput
                  label="Password"
                  name="loginPassword"
                  value={loginPassword}
                  onChange={(e: any) => setLoginPassword(e.target.value)}
                  show={showLoginPassword}
                  toggle={() => setShowLoginPassword(!showLoginPassword)}
                />

                <button
                  type="submit"
                  className="mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Login
                </button>

                <button
                  type="button"
                  className="text-center text-sm text-emerald-700 hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>

                <div className="text-center text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => setMode("register")}>
                    Register
                  </button>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <form
                onSubmit={forgotStep === "email" ? handleSendOtp : handleResetPassword}
                className="mx-auto flex w-full max-w-md flex-col gap-3"
              >
                {forgotStep === "email" && (
                  <Input
                    label="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e: any) => setForgotEmail(e.target.value)}
                  />
                )}

                {forgotStep === "otp" && (
                  <>
                    <Input label="Enter OTP" value={otp} onChange={(e: any) => setOtp(e.target.value)} />
                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChange={(e: any) => setNewPassword(e.target.value)}
                      show={showForgotPassword}
                      toggle={() => setShowForgotPassword(!showForgotPassword)}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Processing..." : forgotStep === "email" ? "Send OTP" : "Reset Password"}
                </button>

                {forgotStep === "otp" && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("email");
                      setOtp("");
                      setNewPassword("");
                    }}
                    className="text-left text-sm text-emerald-700 hover:underline"
                  >
                    Back to Email
                  </button>
                )}

                <div className="text-center text-sm text-slate-600">
                  Remembered your password?{" "}
                  <button type="button" className="font-semibold text-emerald-700 hover:underline" onClick={() => setMode("login")}>
                    Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}

function SelectDropdown({ label, name, value, onChange, options }: any) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        title={label}
        className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function PasswordInput({ label, name, value, onChange, show, toggle }: any) {
  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        className="h-10 w-full rounded-xl border border-slate-300 px-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-[33px] text-slate-500"
        tabIndex={-1}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}
