"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Header from "../components/Header";
import { useCart } from "../../hooks/useCart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Coupon = {
  _id?: string;
  code: string;
  discountType: "amount" | "percentage";
  discountValue: number;
  expiresAt: string;
  description?: string;
  isActive?: boolean;
};

type ReferralConfig = {
  referralUsageDiscountPercent: number;
  referralUsageCoins: number;
  referralPromoCode: string;
};

type CourseBooking = {
  _id: string;
  itemType: "single_course" | "group_package";
  courseId?: string | { _id?: string } | null;
  sessionType?: "recorded" | "live" | null;
  remainingAmount?: number;
  status?: string;
};

type CartBookingConflict = {
  courseId: string;
  sessionType: "recorded" | "live";
  courseTitle: string;
  remainingAmount: number;
};

const isCouponExpired = (expiresAt: string) => {
  const expiry = new Date(`${expiresAt}T23:59:59`);
  return Number.isNaN(expiry.getTime()) ? true : expiry.getTime() < Date.now();
};

const getCouponDiscount = (subtotal: number, coupon: Coupon | null) => {
  if (!coupon || subtotal <= 0 || isCouponExpired(coupon.expiresAt)) return 0;

  const rawDiscount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;

  return Math.min(Math.max(rawDiscount, 0), subtotal);
};

const formatCouponExpiry = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getItemPrice = (item: any) => {
  const course = item?.course;
  if (!course) return 0;

  if (item.sessionType === "recorded") {
    return (
      course?.pricing?.recordedSession?.finalPrice ||
      course?.pricing?.recordedSession?.price ||
      course?.price ||
      0
    );
  }

  return (
    course?.pricing?.liveSession?.finalPrice ||
    course?.pricing?.liveSession?.price ||
    course?.price * (course?.pricing?.liveSession?.priceMultiplier || 1.5) ||
    0
  );
};

export default function CheckoutPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const { cartItems, loading, updateQuantity, removeFromCart, fetchCart } = useCart(student);
  const safeCartItems = useMemo(() => (cartItems as any[]) || [], [cartItems]);

  const [couponCode, setCouponCode] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponFetchError, setCouponFetchError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [appliedReferralCode, setAppliedReferralCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [referralConfig, setReferralConfig] = useState<ReferralConfig>({
    referralUsageDiscountPercent: 0,
    referralUsageCoins: 0,
    referralPromoCode: "",
  });
  const [isPaying, setIsPaying] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [bookingConflicts, setBookingConflicts] = useState<CartBookingConflict[]>([]);
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";
  const cartSubtotal = safeCartItems.reduce(
    (sum: number, item: any) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
  const couponDiscount = getCouponDiscount(cartSubtotal, appliedCoupon);
  const isFirstPurchase =
    !Boolean(student?.referralBenefitsUsed) &&
    Number(student?.course?.length || 0) === 0;
  const isReferralBenefitEligible =
    (Boolean(student?.referredBy) || Boolean(appliedReferralCode)) &&
    isFirstPurchase;
  const referralDiscountBase = Math.max(0, cartSubtotal - couponDiscount);
  const referralDiscount = isReferralBenefitEligible
    ? Math.min(
        Math.max(
          (referralDiscountBase *
            Number(referralConfig.referralUsageDiscountPercent || 0)) /
            100,
          0
        ),
        referralDiscountBase
      )
    : 0;
  const finalTotal = Math.max(0, cartSubtotal - couponDiscount - referralDiscount);

  const applyCouponByCode = (codeInput: string) => {
    const normalizedCode = codeInput.trim().toUpperCase();
    const normalizedReferralCode = String(referralConfig.referralPromoCode || "")
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      setCouponMessage("Please enter a coupon code.");
      return;
    }

    if (normalizedReferralCode && normalizedCode === normalizedReferralCode) {
      if (!isFirstPurchase) {
        setAppliedCoupon(null);
        setAppliedReferralCode("");
        setCouponMessage("Referral code is valid only for first purchase.");
        return;
      }

      setAppliedCoupon(null);
      setAppliedReferralCode(normalizedCode);
      setCouponCode(normalizedCode);
      setCouponMessage(`${normalizedCode} applied as referral code.`);
      return;
    }

    if (couponsLoading) {
      setCouponMessage("Coupons are still loading. Please wait a moment.");
      return;
    }

    const matchedCoupon = availableCoupons.find(
      (coupon) => coupon.code === normalizedCode
    );

    if (!matchedCoupon) {
      setAppliedCoupon(null);
      setAppliedReferralCode("");
      setCouponMessage("Invalid coupon code.");
      return;
    }

    if (isCouponExpired(matchedCoupon.expiresAt)) {
      setAppliedCoupon(null);
      setAppliedReferralCode("");
      setCouponMessage("This coupon has expired.");
      return;
    }

    setAppliedCoupon(matchedCoupon);
    setAppliedReferralCode("");
    setCouponCode(matchedCoupon.code);
    setCouponMessage(`${matchedCoupon.code} applied successfully.`);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v1/students/isstudent`, {
          withCredentials: true,
        });

        if (response.data?.student) {
          setStudent(response.data.student);
        } else {
          router.push("/student-login");
          return;
        }
      } catch {
        router.push("/student-login");
        return;
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (student) {
      setBillingAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || student?.name || "",
        email: prev.email || student?.email || "",
        phone: prev.phone || student?.phone || "",
      }));
    }
  }, [student]);

  useEffect(() => {
    if (sameAsBilling) {
      setShippingAddress(billingAddress);
    }
  }, [sameAsBilling, billingAddress]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setCouponsLoading(true);
        setCouponFetchError("");
        const response = await axios.get(`${API_BASE}/api/coupons/active`, {
          withCredentials: false,
        });
        setAvailableCoupons(response.data?.data || []);
      } catch (error) {
        console.error("Failed to load coupons", error);
        setCouponFetchError("Unable to load coupons right now.");
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  useEffect(() => {
    const fetchReferralConfig = async () => {
      try {
        const response = await axios.get(`${API_BASE}/coins/settings`, {
          withCredentials: true,
        });
        const settings = response.data?.settings || {};
        setReferralConfig({
          referralUsageDiscountPercent: Number(
            settings.referralUsageDiscountPercent || 0
          ),
          referralUsageCoins: Number(settings.referralUsageCoins || 0),
          referralPromoCode: String(settings.referralPromoCode || "")
            .trim()
            .toUpperCase(),
        });
      } catch {
        setReferralConfig({
          referralUsageDiscountPercent: 0,
          referralUsageCoins: 0,
          referralPromoCode: "",
        });
      }
    };

    fetchReferralConfig();
  }, []);

  useEffect(() => {
    if (
      appliedCoupon &&
      !availableCoupons.some((coupon) => coupon.code === appliedCoupon.code)
    ) {
      setAppliedCoupon(null);
      setCouponMessage("Previously applied coupon is no longer available.");
    }
  }, [availableCoupons, appliedCoupon]);

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateAddress = (address: typeof billingAddress) => {
    return (
      address.fullName.trim() &&
      address.email.trim() &&
      address.phone.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.state.trim() &&
      address.pincode.trim() &&
      address.country.trim()
    );
  };

  const billingAddressValid = validateAddress(billingAddress);
  const shippingAddressValid = sameAsBilling || validateAddress(shippingAddress);
  const canStartPayment =
    safeCartItems.length > 0 &&
    razorpayReady &&
    !loading &&
    !isPaying &&
    bookingConflicts.length === 0 &&
    billingAddressValid &&
    shippingAddressValid;

  useEffect(() => {
    const fetchBookingConflicts = async () => {
      if (!student?._id || safeCartItems.length === 0) {
        setBookingConflicts([]);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/api/v1/course-bookings/student`, {
          withCredentials: true,
        });
        const bookings: CourseBooking[] = response?.data?.bookings || [];
        const activeBookingMap = new Map<string, CourseBooking>();

        bookings.forEach((booking) => {
          if (booking.itemType !== "single_course") return;
          const remaining = Number(booking.remainingAmount || 0);
          const status = String(booking.status || "").toLowerCase();
          if (remaining <= 0) return;
          if (status === "cancelled") return;

          const rawCourseId =
            typeof booking.courseId === "object"
              ? booking.courseId?._id
              : booking.courseId;
          const sessionType = booking.sessionType === "live" ? "live" : "recorded";
          if (!rawCourseId) return;
          activeBookingMap.set(`${String(rawCourseId)}:${sessionType}`, booking);
        });

        const conflicts = safeCartItems
          .filter((item: any) => item?.courseId && item?.course?.title)
          .map((item: any) => {
            const sessionType = item.sessionType === "live" ? "live" : "recorded";
            const key = `${String(item.courseId)}:${sessionType}`;
            const booking = activeBookingMap.get(key);
            if (!booking) return null;

            return {
              courseId: String(item.courseId),
              sessionType,
              courseTitle: String(item.course.title || "Course"),
              remainingAmount: Number(booking.remainingAmount || 0),
            } as CartBookingConflict;
          })
          .filter(Boolean) as CartBookingConflict[];

        const uniqueConflicts = conflicts.filter(
          (conflict, index, arr) =>
            arr.findIndex(
              (entry) =>
                entry.courseId === conflict.courseId &&
                entry.sessionType === conflict.sessionType
            ) === index
        );
        setBookingConflicts(uniqueConflicts);
      } catch {
        setBookingConflicts([]);
      }
    };

    fetchBookingConflicts();
  }, [student?._id, safeCartItems]);

  const openRazorpayCheckout = (orderData: any) => {
    if (!window.Razorpay) {
      throw new Error("Razorpay checkout SDK not loaded");
    }

    const rzp = new window.Razorpay({
      key: RAZORPAY_KEY || orderData?.key,
      amount: orderData?.amount,
      currency: orderData?.currency || "INR",
      name: "IICPA Institute",
      description: `Payment for ${safeCartItems.length} course${
        safeCartItems.length > 1 ? "s" : ""
      }`,
      order_id: orderData?.orderId,
      prefill: {
        name: billingAddress.fullName || student?.name || "",
        email: billingAddress.email || student?.email || "",
        contact: billingAddress.phone || student?.phone || "",
      },
      theme: {
        color: "#1d4ed8",
      },
      modal: {
        ondismiss: () => {
          setIsPaying(false);
          alert("Payment was cancelled. You can retry from checkout.");
        },
      },
      handler: async (response: any) => {
        try {
          const verifyRes = await axios.post(
            `${API_BASE}/api/v1/payments/verify-and-capture`,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transactionIds: orderData?.transactionIds || [],
            },
            { withCredentials: true }
          );

          if (verifyRes.data?.success) {
            alert("Payment successful. All selected courses are now enrolled.");
            await fetchCart();
            window.dispatchEvent(new CustomEvent("cartUpdated"));
            window.dispatchEvent(new Event("coins:updated"));
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        } catch (error: any) {
          alert(
            error?.response?.data?.message ||
              "Payment verification failed. Please contact support."
          );
        } finally {
          setIsPaying(false);
        }
      },
    });

    rzp.open();
  };

  const handlePayAll = async () => {
    if (!student?._id) {
      alert("Please login again.");
      router.push("/student-login");
      return;
    }

    if (!safeCartItems.length) {
      alert("Your cart is empty.");
      return;
    }

    if (bookingConflicts.length > 0) {
      alert(
        "This course is already booked. Please go to your dashboard, open the Bookings page, and make the remaining balance payment. Purchase is not allowed from checkout."
      );
      return;
    }

    if (!validateAddress(billingAddress)) {
      alert("Please complete your billing address before payment.");
      return;
    }

    if (!sameAsBilling && !validateAddress(shippingAddress)) {
      alert("Please complete your shipping address before payment.");
      return;
    }

    try {
      setIsPaying(true);
      const cartPayload = safeCartItems
        .filter((item: any) => item?.courseId && item?.sessionType)
        .map((item: any) => ({
          courseId: item.courseId,
          sessionType: item.sessionType,
          quantity: Math.max(1, item.quantity || 1),
        }));

      const response = await axios.post(
        `${API_BASE}/api/v1/payments/create-order`,
        {
          cartItems: cartPayload,
          studentId: student._id,
          billingAddress,
          shippingAddress: sameAsBilling ? billingAddress : shippingAddress,
          sameAsBilling,
          appliedCouponCode: appliedReferralCode || appliedCoupon?.code || "",
        },
        { withCredentials: true }
      );

      if (!response.data?.success || !response.data?.data?.orderId) {
        throw new Error(response.data?.message || "Unable to create payment order");
      }

      openRazorpayCheckout(response.data.data);
    } catch (error: any) {
      setIsPaying(false);
      if (error?.response?.data?.code === "BOOKING_BALANCE_PENDING") {
        alert(
          "This course is already booked. Please go to your dashboard, open the Bookings page, and make the remaining balance payment. Purchase is not allowed from checkout."
        );
        return;
      }
      const apiMessage = error?.response?.data?.message;
      const apiError = error?.response?.data?.error;
      const apiDescription = error?.response?.data?.details?.description;
      const fallbackMessage = error?.message || "Payment failed";
      alert(apiMessage || apiError || apiDescription || fallbackMessage);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header topOffset={40} />
        <div className="pt-36 text-center text-gray-600">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header topOffset={40} />

      <div className="pt-24 pb-10 px-2 md:px-4">
        <div className="mx-auto w-full max-w-none bg-white/95 rounded-3xl shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] border border-slate-200 overflow-hidden backdrop-blur text-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
              <p className="text-xs text-slate-500 mt-1">
                One payment for all courses in your cart
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-2xl text-slate-500 hover:text-slate-700"
            >
              ×
            </button>
          </div>

          <div className="p-6 md:p-7">
            {safeCartItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Your cart is empty.</p>
                <button
                  onClick={() => router.push("/course")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                <div className="lg:col-span-8 space-y-6">
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">
                      Order Items
                    </h2>
                    <div className="space-y-4">
                      {safeCartItems.map((item: any) => {
                        const course = item.course;
                        if (!course || !item.courseId) return null;

                        const unitPrice = getItemPrice(item);
                        const itemTotal = unitPrice * (item.quantity || 1);

                        return (
                          <div
                            key={`${item.courseId}-${item.sessionType}`}
                            className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-gradient-to-r from-white to-slate-50 shadow-sm"
                          >
                            <div className="flex items-start gap-4 md:gap-5">
                              <Image
                                src={
                                  course.image
                                    ? course.image.startsWith("http")
                                      ? course.image
                                      : course.image.startsWith("/uploads/")
                                      ? `${API_BASE}${course.image}`
                                      : course.image.startsWith("/")
                                      ? course.image
                                      : `${API_BASE}/${course.image}`
                                    : "/images/a1.jpeg"
                                }
                                alt={course.title || "Course"}
                                width={120}
                                height={80}
                                className="w-24 h-16 object-cover rounded-lg border border-slate-200"
                              />

                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-slate-800 truncate">
                                  {course.title}
                                </h3>
                                <p className="text-xs text-slate-600 mb-2">
                                  {course.category || "Accounting"}
                                </p>

                                <span
                                  className={`inline-flex text-[11px] px-3 py-1 rounded-full font-semibold ${
                                    item.sessionType === "recorded"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {item.sessionType === "recorded"
                                    ? "Recorded Session"
                                    : "Live Session"}
                                </span>

                                <div className="mt-4 flex items-center gap-3">
                                  <span className="text-xs text-slate-600">
                                    Quantity:
                                  </span>
                                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                                    <button
                                      type="button"
                                      className="px-3 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                      disabled={
                                        loading || (item.quantity || 1) <= 1
                                      }
                                      onClick={() =>
                                        updateQuantity(
                                          item.courseId,
                                          item.sessionType,
                                          Math.max(1, (item.quantity || 1) - 1)
                                        )
                                      }
                                    >
                                      -
                                    </button>
                                    <span className="px-4 py-1 border-x border-slate-300 text-base font-semibold text-slate-800">
                                      {item.quantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      className="px-3 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                                      disabled={loading}
                                      onClick={() =>
                                        updateQuantity(
                                          item.courseId,
                                          item.sessionType,
                                          (item.quantity || 1) + 1
                                        )
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <p className="mt-3 text-base text-slate-700">
                                  ₹{unitPrice.toLocaleString()} ×{" "}
                                  {item.quantity || 1} ={" "}
                                  <span className="text-emerald-600 font-bold">
                                    ₹{itemTotal.toLocaleString()}
                                  </span>
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(item.courseId, item.sessionType)
                                  }
                                  disabled={loading}
                                  className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-medium"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 md:p-6 bg-white shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">
                      Billing & Shipping Address
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-800 mb-3">
                          Billing Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Full name"
                            value={billingAddress.fullName}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                fullName: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={billingAddress.email}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            value={billingAddress.phone}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Pincode"
                            value={billingAddress.pincode}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                pincode: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Address line 1"
                            value={billingAddress.line1}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                line1: e.target.value,
                              }))
                            }
                            className={`md:col-span-2 ${inputClass}`}
                          />
                          <input
                            type="text"
                            placeholder="Address line 2 (optional)"
                            value={billingAddress.line2}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                line2: e.target.value,
                              }))
                            }
                            className={`md:col-span-2 ${inputClass}`}
                          />
                          <input
                            type="text"
                            placeholder="City"
                            value={billingAddress.city}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={billingAddress.state}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                state: e.target.value,
                              }))
                            }
                            className={inputClass}
                          />
                          <input
                            type="text"
                            placeholder="Country"
                            value={billingAddress.country}
                            onChange={(e) =>
                              setBillingAddress((prev) => ({
                                ...prev,
                                country: e.target.value,
                              }))
                            }
                            className={`md:col-span-2 ${inputClass}`}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-semibold text-gray-800">
                            Shipping Address
                          </h3>
                          <label className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <input
                              type="checkbox"
                              checked={sameAsBilling}
                              onChange={(e) =>
                                setSameAsBilling(e.target.checked)
                              }
                            />
                            Same as billing
                          </label>
                        </div>

                        {sameAsBilling ? (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            Shipping address will use the same details as
                            billing.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Full name"
                              value={shippingAddress.fullName}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  fullName: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={shippingAddress.email}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Phone"
                              value={shippingAddress.phone}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Pincode"
                              value={shippingAddress.pincode}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  pincode: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Address line 1"
                              value={shippingAddress.line1}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  line1: e.target.value,
                                }))
                              }
                              className={`md:col-span-2 ${inputClass}`}
                            />
                            <input
                              type="text"
                              placeholder="Address line 2 (optional)"
                              value={shippingAddress.line2}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  line2: e.target.value,
                                }))
                              }
                              className={`md:col-span-2 ${inputClass}`}
                            />
                            <input
                              type="text"
                              placeholder="City"
                              value={shippingAddress.city}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="State"
                              value={shippingAddress.state}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                }))
                              }
                              className={inputClass}
                            />
                            <input
                              type="text"
                              placeholder="Country"
                              value={shippingAddress.country}
                              onChange={(e) =>
                                setShippingAddress((prev) => ({
                                  ...prev,
                                  country: e.target.value,
                                }))
                              }
                              className={`md:col-span-2 ${inputClass}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                      Discount Coupons
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Select a student coupon and apply it at checkout.
                    </p>
                    {referralConfig.referralPromoCode ? (
                      <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                        Referral code available:{" "}
                        <span className="font-semibold">
                          {referralConfig.referralPromoCode}
                        </span>
                      </p>
                    ) : null}

                    <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
                      {couponsLoading ? (
                        <p className="text-sm text-gray-500">Loading coupons...</p>
                      ) : availableCoupons.length ? (
                        availableCoupons.map((coupon) => {
                          const expired = isCouponExpired(coupon.expiresAt);
                          const isActive = appliedCoupon?.code === coupon.code;

                          return (
                            <div
                              key={coupon.code}
                              className={`border rounded-xl p-3 ${
                                isActive
                                  ? "border-green-300 bg-green-50"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">
                                    {coupon.code}
                                  </p>
                                  {coupon.description ? (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {coupon.description}
                                    </p>
                                  ) : null}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Expires: {formatCouponExpiry(coupon.expiresAt)}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <span className="inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                    {coupon.discountType === "percentage"
                                      ? `${coupon.discountValue}% OFF`
                                      : `Rs ${coupon.discountValue} OFF`}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={expired}
                                    onClick={() => applyCouponByCode(coupon.code)}
                                    className="mt-2 block ml-auto text-xs px-3 py-1 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {expired ? "Expired" : "Apply"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">
                          {couponFetchError
                            ? couponFetchError
                            : "No coupons available right now."}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="ENTER COUPON CODE"
                        className={`${inputClass} uppercase bg-white`}
                      />
                      <button
                        type="button"
                        onClick={() => applyCouponByCode(couponCode)}
                        className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-medium"
                      >
                        Apply
                      </button>
                    </div>

                    {couponMessage ? (
                      <p
                        className={`mt-2 text-sm ${
                          appliedCoupon || appliedReferralCode
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {couponMessage}
                      </p>
                    ) : null}
                  </div>

                  <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl p-4 border border-slate-200 shadow-sm sticky top-20">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">
                      Order Summary
                    </h3>

                    {bookingConflicts.length > 0 ? (
                      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-800">
                        <p className="text-sm font-semibold">
                          One or more courses in your cart already have an active booking.
                        </p>
                        <p className="mt-1 text-xs">
                          Please go to your dashboard, open the Bookings page, and make the
                          remaining balance payment. Purchase is not allowed from checkout.
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2 mb-4">
                      {safeCartItems.map((item: any) => {
                        const course = item.course;
                        if (!course || !item.courseId) return null;
                        return (
                          <div
                            key={`${item.courseId}-${item.sessionType}`}
                            className="text-sm"
                          >
                            <div className="flex justify-between gap-3">
                              <span className="text-gray-700 truncate">
                                {course.title} × {item.quantity || 1}
                              </span>
                              <span className="font-medium text-gray-900">
                                ₹
                                {(
                                  getItemPrice(item) * (item.quantity || 1)
                                ).toLocaleString()}
                              </span>
                            </div>
                            <p
                              className={`text-xs ${
                                item.sessionType === "recorded"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {item.sessionType === "recorded"
                                ? "Recorded"
                                : "Live"}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 pt-3 mb-4">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          Rs {cartSubtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-700">Coupon Discount</span>
                        <span className="font-medium text-green-600">
                          - Rs {couponDiscount.toLocaleString()}
                        </span>
                      </div>
                      {isReferralBenefitEligible ? (
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-700">Referral Discount</span>
                          <span className="font-medium text-green-600">
                            - Rs{" "}
                            {referralDiscount.toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center text-xl font-semibold">
                        <span>Total</span>
                        <span className="text-green-600">
                          Rs{" "}
                          {finalTotal.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {safeCartItems.length ? (
                      <div className="space-y-3 mb-4">
                        <button
                          type="button"
                          onClick={handlePayAll}
                          disabled={!canStartPayment}
                          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 text-lg font-semibold shadow-sm disabled:opacity-50"
                        >
                          {isPaying
                            ? "Processing..."
                            : `Pay Now for All Courses (Rs ${finalTotal.toLocaleString()})`}
                        </button>
                        {isReferralBenefitEligible &&
                        referralConfig.referralUsageCoins > 0 ? (
                          <p className="text-xs text-emerald-700">
                            This payment will also credit{" "}
                            {referralConfig.referralUsageCoins} referral coins to
                            your wallet after successful verification.
                          </p>
                        ) : null}
                        {!RAZORPAY_KEY ? (
                          <p className="text-xs text-red-600">
                            Razorpay key is missing. Set `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
                          </p>
                        ) : null}
                        {!billingAddressValid || !shippingAddressValid ? (
                          <p className="text-xs text-amber-700">
                            Complete billing and shipping details to continue.
                          </p>
                        ) : null}
                        {bookingConflicts.length > 0 ? (
                          <p className="text-xs text-amber-700">
                            Checkout is blocked for booked course(s). Continue from Dashboard
                            → Bookings.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <h4 className="text-lg text-blue-700 font-semibold mb-2">
                        Payment Instructions
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Review all courses, then complete one secure payment</li>
                        <li>• Complete payment in Razorpay secure checkout</li>
                        <li>• On success, all selected enrollments are activated automatically</li>
                        <li>• Invoice receipt is sent to your registered email</li>
                        <li>• If payment is cancelled, you can retry anytime</li>
                      </ul>

                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <p className="text-sm text-blue-700 mb-2">
                          Need help with payment or courses?
                        </p>
                        <a
                          href="https://wa.me/+918810380146?text=Hi, I need support with my course checkout or payment process. Please help."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium shadow-sm"
                        >
                          WhatsApp Support
                        </a>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
