"use client";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function PaymentForm({ total }: { total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-bounce w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {processing ? "Processing..." : `Pay ${formatCurrency(total)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, deliveryDate, childName, teacherName, childId, teacherId, getTotal } = useCartStore();
  const router = useRouter();
  const total = getTotal();

  const [clientSecret, setClientSecret] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  async function handleStartPayment(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 1 — Create the order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        teacherId,
        deliveryDate,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      }),
    });
    if (!orderRes.ok) {
      setLoading(false);
      setError("Could not create order. Please review your cart and try again.");
      return;
    }
    const order = await orderRes.json();

    // 2 — Create payment intent for Stripe Elements
    const intentRes = await fetch("/api/payment/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: [order.id], saveCard }),
    });
    if (!intentRes.ok) {
      setLoading(false);
      setError("Could not initialize payment. Please try again.");
      return;
    }

    const paymentData = await intentRes.json();
    setClientSecret(paymentData.clientSecret ?? "");
    setLoading(false);
  }

  if (clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Stripe Checkout</h1>
        <div className="bg-white rounded-3xl border-2 border-orange-100 p-5 mb-5">
          <h2 className="font-black text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-1.5 mb-4">
            {items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between text-sm font-medium text-gray-700">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-orange-100 pt-3 flex justify-between font-black text-lg">
            <span>Total</span>
            <span className="text-orange-500">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-orange-100 p-5">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm total={total} />
          </Elements>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-3xl border-2 border-orange-100 p-5 mb-5">
        <h2 className="font-black text-gray-800 mb-3">Order Summary</h2>
        <div className="space-y-1.5 mb-4">
          {items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm font-medium text-gray-700">
              <span>{item.name} x {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-dashed border-orange-100 pt-3 flex justify-between font-black text-lg">
          <span>Total</span>
          <span className="text-orange-500">{formatCurrency(total)}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm font-medium text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Delivery date</span>
            <span className="text-gray-700">{deliveryDate ? formatDate(new Date(deliveryDate)) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Child</span>
            <span className="text-gray-700">{childName}</span>
          </div>
          <div className="flex justify-between">
            <span>Teacher</span>
            <span className="text-gray-700">{teacherName}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-orange-100 p-5">
        <h2 className="font-black text-gray-800 mb-4">Payment Setup</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-2xl text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleStartPayment} className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="rounded border-gray-300"
            />
            Save card for future orders
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-bounce w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Preparing payment..." : `Continue to Stripe (${formatCurrency(total)})`}
          </button>
        </form>
      </div>
    </div>
  );
}
