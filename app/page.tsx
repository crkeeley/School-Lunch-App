import Link from "next/link";
import { DropdownAuthMenu } from "@/components/layout/DropdownAuthMenu";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍎</span>
              <span className="text-xl font-bold text-green-700">School Lunch</span>
            </div>
            <DropdownAuthMenu />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Lunch ordering,{" "}
          <span className="text-green-600">simplified.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Order healthy school lunches for your child in minutes. Set up recurring orders,
          track deliveries, and pay securely online.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors text-lg"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-24 grid grid-cols-3 gap-8 text-left">
          {[
            { icon: "📅", title: "Monthly Calendar", desc: "Pick any school day and order in seconds." },
            { icon: "🔄", title: "Recurring Orders", desc: "Set Mon/Wed/Fri once and never order again." },
            { icon: "📧", title: "Email Confirmation", desc: "Get a receipt every time an order is placed." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
