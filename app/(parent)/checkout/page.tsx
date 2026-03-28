"use client";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

function CheckoutForm({
  clientSecret,
  total,
  onSuccess,
}: {
  clientSecret: string;
  total: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="rounded border-gray-300 text-green-600"
        />
        <span className="text-sm text-gray-700">Save card for future orders</span>
      </label>
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 text-lg"
      >
        {processing ? "Processing..." : `Pay ${formatCurrency(total)}`}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, deliveryDate, childName, teacherName, childId, teacherId, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const total = getTotal();

  useEffect(() => {
    if (items.length === 0) return;
    // Create order then payment intent
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId,
        teacherId,
        deliveryDate,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      }),
    })
      .then((r) => r.json())
      .then((order) => {
        setOrderId(order.id);
        return fetch("/api/payment/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds: [order.id], saveCard: false }),
        });
      })
      .then((r) => r.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
        <div className="space-y-1 mb-3">
          {items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between text-sm text-gray-700">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-green-700">{formatCurrency(total)}</span>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Delivery date</span>
            <span>{deliveryDate ? formatDate(new Date(deliveryDate)) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Child</span>
            <span>{childName}</span>
          </div>
          <div className="flex justify-between">
            <span>Teacher</span>
            <span>{teacherName}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Payment</h2>
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} total={total} onSuccess={() => { clearCart(); router.push("/confirmation"); }} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        )}
      </div>
    </div>
  );
}
