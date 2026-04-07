import Link from "next/link";
import { DropdownAuthMenu } from "@/components/layout/DropdownAuthMenu";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#fffbf5" }}>
      {/* Nav */}
      <nav className="bg-white border-b-4 border-orange-400 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍱</span>
              <span className="text-xl font-black text-orange-500 tracking-tight">LunchBox</span>
            </div>
            <DropdownAuthMenu />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden py-20 px-4 text-center"
          style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #ecfdf5 100%)" }}>
          {/* Floating food decorations */}
          <div className="absolute top-8 left-8 text-5xl opacity-20 rotate-12 select-none">🍕</div>
          <div className="absolute top-12 right-12 text-5xl opacity-20 -rotate-12 select-none">🍎</div>
          <div className="absolute bottom-8 left-16 text-4xl opacity-20 rotate-6 select-none">🥦</div>
          <div className="absolute bottom-12 right-20 text-4xl opacity-20 -rotate-6 select-none">🧃</div>
          <div className="absolute top-1/2 left-4 text-3xl opacity-10 select-none">⭐</div>
          <div className="absolute top-1/3 right-8 text-3xl opacity-10 select-none">⭐</div>

          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 text-sm font-bold px-4 py-2 rounded-full mb-6">
              <span>✨</span> Healthy lunches, happy kids
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
              School lunch <br />
              <span className="text-orange-500">made easy!</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto font-medium">
              Order yummy school lunches in just a few taps. Pick meals, pay safely, and your child eats great every day.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn-bounce bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 hover:bg-orange-600"
              >
                Get Started — It&apos;s Free!
              </Link>
              <Link
                href="/login"
                className="btn-bounce bg-white text-orange-500 border-2 border-orange-300 px-8 py-4 rounded-2xl font-black text-lg hover:bg-orange-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Stats ribbon */}
        <section className="bg-orange-500 py-4">
          <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-white font-bold text-sm">
            {[
              { emoji: "🏫", text: "500+ Schools" },
              { emoji: "🥗", text: "Fresh Daily Menus" },
              { emoji: "🔒", text: "Secure Payments" },
              { emoji: "📧", text: "Email Confirmations" },
            ].map(s => (
              <span key={s.text} className="flex items-center gap-2">
                <span>{s.emoji}</span>{s.text}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-3">
            Everything parents need
          </h2>
          <p className="text-center text-gray-500 font-medium mb-12">Simple, fast, and built for busy families</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                emoji: "📅",
                color: "bg-orange-50 border-orange-200",
                iconBg: "bg-orange-100",
                title: "Monthly Calendar",
                desc: "Pick any school day and order in seconds. See all your upcoming lunches at a glance.",
              },
              {
                emoji: "🔄",
                color: "bg-yellow-50 border-yellow-200",
                iconBg: "bg-yellow-100",
                title: "Recurring Orders",
                desc: "Set Mon/Wed/Fri once and never order again. We'll handle the rest automatically.",
              },
              {
                emoji: "📧",
                color: "bg-green-50 border-green-200",
                iconBg: "bg-green-100",
                title: "Email Confirmations",
                desc: "Get a receipt every time an order is placed so you always know what's coming.",
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-3xl border-2 ${f.color} p-6`}>
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center text-3xl mb-4`}>
                  {f.emoji}
                </div>
                <h3 className="font-black text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-4 mb-16 rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)" }}>
          <div className="py-14 px-8 text-center text-white relative overflow-hidden">
            <div className="absolute -top-4 -left-4 text-8xl opacity-10 select-none">🍎</div>
            <div className="absolute -bottom-4 -right-4 text-8xl opacity-10 select-none">🥗</div>
            <h2 className="text-3xl font-black mb-3 relative">Ready to make lunch easy?</h2>
            <p className="text-orange-100 font-semibold mb-7 relative">Join thousands of families who already love LunchBox</p>
            <Link
              href="/register"
              className="btn-bounce inline-block bg-white text-orange-500 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl"
            >
              Start Ordering Today
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
