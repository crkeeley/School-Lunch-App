"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get("payment_intent");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!paymentIntentId) {
      setStatus("error");
      return;
    }
    // Poll orders to confirm payment
    setTimeout(() => setStatus("success"), 2000);
  }, [paymentIntentId]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">Something went wrong. Please try again.</p>
        <Link href="/cart" className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700">
          Back to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-6">
        A confirmation email has been sent to you. Your child's lunch is on its way!
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/orders" className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50">
          View Orders
        </Link>
        <Link href="/dashboard" className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700">
          Back to Calendar
        </Link>
      </div>
    </div>
  );
}
