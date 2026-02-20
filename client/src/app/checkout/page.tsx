"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import Header from "../components/Header";
import { useCart } from "../../hooks/useCart";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

  const { cartItems, loading, updateQuantity, removeFromCart, fetchCart, getTotalPrice } =
    useCart(student);
  const safeCartItems = (cartItems as any[]) || [];

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    utrNumber: "",
    additionalNotes: "",
    paymentScreenshot: null as File | null,
  });
  const [couponCode, setCouponCode] = useState("");
  const [deliveryType, setDeliveryType] = useState("normal");
  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

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

  const handlePayNow = (item: any) => {
    const price = getItemPrice(item);
    setSelectedItem({ ...item, price });
    setShowPaymentForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setPaymentData((prev) => ({ ...prev, paymentScreenshot: file }));
  };

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedItem) return;

    if (!paymentData.utrNumber.trim()) {
      alert("Please enter UTR number");
      return;
    }

    if (!paymentData.paymentScreenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("courseId", selectedItem.courseId);
      formData.append("sessionType", selectedItem.sessionType);
      formData.append("amount", String(selectedItem.price));
      formData.append("utrNumber", paymentData.utrNumber.trim());
      formData.append("additionalNotes", paymentData.additionalNotes);
      formData.append("paymentScreenshot", paymentData.paymentScreenshot);
      formData.append("studentId", student?._id || "");
      formData.append("billingAddress", JSON.stringify(billingAddress));
      formData.append(
        "shippingAddress",
        JSON.stringify(sameAsBilling ? billingAddress : shippingAddress)
      );
      formData.append("sameAsBilling", String(sameAsBilling));

      const response = await axios.post(
        `${API_BASE}/api/v1/transactions/submit-payment`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.data?.success) {
        alert("Payment submitted successfully! It will be reviewed by admin.");
        setPaymentData({ utrNumber: "", additionalNotes: "", paymentScreenshot: null });
        setSelectedItem(null);
        setShowPaymentForm(false);
        await fetchCart();
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      <Header topOffset={40} />

      <div className="pt-32 pb-10 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">Checkout</h1>
              <p className="text-sm text-gray-500 mt-1">
                Complete your purchase securely
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="p-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
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
                            className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                          >
                            <div className="flex items-start gap-4">
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
                                className="w-24 h-16 object-cover rounded"
                              />

                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-semibold text-gray-800 truncate">
                                  {course.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  {course.category || "Accounting"}
                                </p>

                                <span
                                  className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                                    item.sessionType === "recorded"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {item.sessionType === "recorded"
                                    ? "Recorded Session"
                                    : "Live Session"}
                                </span>

                                <div className="mt-3 flex items-center gap-3">
                                  <span className="text-sm text-gray-600">
                                    Quantity:
                                  </span>
                                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <button
                                      type="button"
                                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
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
                                    <span className="px-4 py-1 border-x border-gray-300 text-xl">
                                      {item.quantity || 1}
                                    </span>
                                    <button
                                      type="button"
                                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
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

                                <p className="mt-2 text-lg text-gray-700">
                                  ₹{unitPrice.toLocaleString()} ×{" "}
                                  {item.quantity || 1} ={" "}
                                  <span className="text-green-600 font-semibold">
                                    ₹{itemTotal.toLocaleString()}
                                  </span>
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePayNow(item)}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-semibold shadow-sm"
                                >
                                  Pay Now
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(item.courseId, item.sessionType)
                                  }
                                  disabled={loading}
                                  className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg"
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

                  <div className="border border-gray-200 rounded-xl p-5 bg-white">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Billing & Shipping Address
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Have a coupon?
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="ENTER COUPON CODE"
                        className={`${inputClass} uppercase`}
                      />
                      <button
                        type="button"
                        className="px-5 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Delivery Type
                    </h3>
                    <div className="space-y-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="normal"
                          checked={deliveryType === "normal"}
                          onChange={(e) => setDeliveryType(e.target.value)}
                        />
                        Normal Delivery
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryType"
                          value="express"
                          checked={deliveryType === "express"}
                          onChange={(e) => setDeliveryType(e.target.value)}
                        />
                        Express Delivery
                      </label>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm sticky top-28">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                      Order Summary
                    </h3>

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

                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between items-center text-2xl font-semibold">
                        <span>Total</span>
                        <span className="text-green-600">
                          ₹{getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <h4 className="text-lg text-blue-700 font-semibold mb-2">
                        Payment Instructions
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Click "Pay Now" for each course individually</li>
                        <li>• Scan the QR code with any UPI app</li>
                        <li>• Take a screenshot of your payment confirmation</li>
                        <li>• Enter the UTR number from your payment receipt</li>
                        <li>• Upload the payment screenshot</li>
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

      {showPaymentForm && selectedItem && (
        <div className="fixed inset-0 backdrop-blur-lg bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-semibold text-gray-900">Complete Payment</h2>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedItem(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{selectedItem.course?.title}</h3>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Session: {selectedItem.sessionType === "recorded" ? "Recorded" : "Live"}
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{Number(selectedItem.price || 0).toLocaleString()}
                  </p>
                </div>

                <div className="text-center">
                  <h4 className="font-semibold mb-2 text-gray-800">Scan QR Code to Pay</h4>
                  <Image src="/upi.jpeg" alt="UPI QR" width={250} height={250} className="mx-auto rounded-lg border" />
                  <p className="text-xs text-gray-500 mt-2">UPI ID: 8810380146@ptaxis</p>
                </div>
              </div>

              <div>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UTR Number *</label>
                    <input
                      type="text"
                      value={paymentData.utrNumber}
                      onChange={(e) => setPaymentData((prev) => ({ ...prev, utrNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Enter UTR number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Screenshot *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea
                      value={paymentData.additionalNotes}
                      onChange={(e) =>
                        setPaymentData((prev) => ({ ...prev, additionalNotes: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedItem(null);
                      }}
                      className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2"
                    >
                      {submitting ? "Submitting..." : "Submit Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
