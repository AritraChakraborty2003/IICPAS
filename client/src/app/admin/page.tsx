"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { FaLock, FaEye, FaEyeSlash, FaEnvelope, FaKey } from "react-icons/fa";
import Image from "next/image";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Admin accounts get a second step: a 6-digit code sent by email.
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(
        email,
        password,
        step === "otp" ? otp : undefined
      );
      if (result.success) {
        // Use role-based redirect from AuthContext
        router.push(result.redirectUrl || "/admin-dashboard");
      } else if (result.otpRequired && step === "credentials") {
        setStep("otp");
        setOtp("");
        setInfo(result.message);
        setResendIn(result.retryAfter || 30);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await login(email, password);
      if (result.otpRequired) {
        setInfo(result.message);
        setOtp("");
        setResendIn(result.retryAfter || 30);
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const backToCredentials = () => {
    setStep("credentials");
    setOtp("");
    setInfo("");
    setError("");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/images/logo.png"
                alt="IICPA Institute"
                width={64}
                height={64}
                className="h-16 w-auto"
              />
            </div>

            {/* Title */}
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
              Admin Login
            </h2>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === "otp" ? (
                <>
                  {info && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
                      {info}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="otp"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Login code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaKey className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="\d{6}"
                        maxLength={6}
                        required
                        autoFocus
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white tracking-[0.5em] text-lg placeholder-gray-400 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter 6-digit code"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <button
                        type="button"
                        onClick={backToCredentials}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={loading || resendIn > 0}
                        className="text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
              <>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              </>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Sign In Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {step === "otp" ? "Verifying..." : "Signing in..."}
                    </div>
                  ) : step === "otp" ? (
                    "Verify & Sign In"
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-center">
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-500 text-sm"
                >
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
