"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
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

export default function StudentBookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/course-bookings/student`, {
        withCredentials: true,
      });
      setBookings(response.data?.bookings || []);
    } catch (error) {
      toast.error("Failed to load booking records");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const totalRemaining = useMemo(
    () => bookings.reduce((sum, entry) => sum + Number(entry.remainingAmount || 0), 0),
    [bookings]
  );

  const startBalancePayment = async (booking) => {
    if (!booking?._id) return;

    setPayingBookingId(booking._id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const orderResponse = await axios.post(
        `${API_URL}/api/v1/course-bookings/create-order`,
        { paymentType: "balance", bookingId: booking._id },
        { withCredentials: true }
      );

      const order = orderResponse.data?.data;
      if (!order?.orderId) {
        throw new Error("Order creation failed");
      }

      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY || order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "IICPA Institute",
        description: `Balance payment for ${booking.itemTitle}`,
        order_id: order.orderId,
        prefill: {
          name: "",
          email: booking.studentEmail || "",
          contact: "",
        },
        theme: { color: "#059669" },
        handler: async (response) => {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/api/v1/course-bookings/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );
            if (verifyResponse.data?.success) {
              toast.success("Balance payment successful");
              fetchBookings();
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            toast.error(
              error?.response?.data?.message || "Failed to verify balance payment"
            );
          } finally {
            setPayingBookingId("");
          }
        },
        modal: {
          ondismiss: () => {
            setPayingBookingId("");
          },
        },
      });

      razorpay.open();
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Payment failed");
      setPayingBookingId("");
    }
  };

  const downloadInvoice = async (bookingId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/v1/course-bookings/${bookingId}/invoice`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Booking-Invoice-${String(bookingId).slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error("Unable to download invoice");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
        <p className="text-sm text-gray-600">
          Track your pre-bookings and pay remaining balance anytime.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-700">
          Total balance due: {formatCurrency(totalRemaining)}
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-gray-600">
          No booking records found.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{booking.itemTitle}</h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {booking.itemType === "group_package" ? "Group Package" : "Single Course"}
                    {booking.sessionType ? ` • ${booking.sessionType}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated: {formatDate(booking.updatedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 capitalize">
                  {booking.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Base Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(booking.baseAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Booking %</p>
                  <p className="font-semibold text-gray-900">
                    {Number(booking.bookingPercent || 0).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Paid</p>
                  <p className="font-semibold text-emerald-700">
                    {formatCurrency(booking.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Remaining</p>
                  <p className="font-semibold text-amber-700">
                    {formatCurrency(booking.remainingAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Number(booking.remainingAmount || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => startBalancePayment(booking)}
                    disabled={payingBookingId === booking._id}
                    className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {payingBookingId === booking._id ? "Processing..." : "Pay Balance"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadInvoice(booking._id)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Download Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
