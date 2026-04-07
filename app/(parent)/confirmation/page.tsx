"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const directSuccess = searchParams.get("order") === "success";
  const paymentIntentId = searchParams.get("payment_intent");
  const [success, setSuccess] = useState(directSuccess);
  const [checking, setChecking] = useState(!directSuccess && Boolean(paymentIntentId));
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function validatePaymentIntent() {
      if (directSuccess) {
        if (mounted) {
          setSuccess(true);
          setChecking(false);
        }
        return;
      }

      if (!paymentIntentId) {
        if (mounted) {
          setSuccess(false);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/payment/intent-status?payment_intent=${encodeURIComponent(paymentIntentId)}`, {
          cache: "no-store",
        });
        if (!mounted) return;

        if (!res.ok) {
          setSuccess(false);
          setMessage("We could not verify your payment status yet.");
          setChecking(false);
          return;
        }

        const data = await res.json();
        const status = data?.status;

        if (status === "succeeded") {
          setSuccess(true);
          setChecking(false);
          return;
        }

        if (status === "processing") {
          setSuccess(false);
          setMessage("Your payment is processing. Please refresh this page in a moment.");
          setChecking(false);
          return;
        }

        setSuccess(false);
        setMessage("Payment was not completed. Please try again.");
        setChecking(false);
      } catch {
        if (!mounted) return;
        setSuccess(false);
        setMessage("We could not verify your payment status yet.");
        setChecking(false);
      }
    }

    validatePaymentIntent();

    return () => {
      mounted = false;
    };
  }, [directSuccess, paymentIntentId]);

  useEffect(() => {
    if (success) clearCart();
  }, [success, clearCart]);

  if (checking) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Confirming payment...</h2>
        <p className="text-gray-500 font-medium mb-6">Please wait while we verify your Stripe payment.</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 font-medium mb-6">{message || "We couldn&apos;t confirm your order. Please try again."}</p>
        <Link href="/cart" className="btn-bounce inline-block bg-orange-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-orange-600">
          Back to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16">
      {/* Success icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</div>
      </div>

      <h2 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
      <p className="text-gray-500 font-semibold mb-8 leading-relaxed">
        Your child&apos;s lunch is all set.<br />
        A confirmation email has been sent to you.
      </p>

      {/* Fun food decoration */}
      <div className="flex justify-center gap-3 text-3xl mb-8">
        🍱🥗🥤🍪
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          href="/orders"
          className="border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-2xl font-black hover:bg-gray-50 transition-colors"
        >
          View Orders
        </Link>
        <Link
          href="/dashboard"
          className="btn-bounce bg-orange-500 text-white px-5 py-3 rounded-2xl font-black hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
        >
          Back to Calendar
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
